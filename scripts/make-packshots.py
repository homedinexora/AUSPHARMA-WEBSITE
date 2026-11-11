"""Build 3D carton pack shots from flat CorelDRAW dielines (front + right side + top flap)."""
# Usage: python3 scripts/make-packshots.py <dir with carton PDFs> <out dir> [<slug> <pdf> [page]]
#   With slug + pdf, builds just that carton; otherwise builds every entry in JOBS.
import subprocess
import sys
import numpy as np
from PIL import Image, ImageFilter

DPI = 200
SRC = sys.argv[1]
OUTDIR = sys.argv[2]

JOBS = [
    # slug, pdf, page
    ("ausdapa-10", "394f91b7-Ausdapa_10.pdf", 1),
    ("austeneptin-m", "fb642419-Austeneptin-M.pdf", 1),
    ("ausvilda-50", "2db01dba-Ausvilda-50_.pdf", 1),
    ("ausglimer-mv1", "66366ff3-ausglimer_MV1.pdf", 2),
    ("ausglimer-mv2", "9b66c4eb-ausglimer_MV2.pdf", 1),
]


def kraft_mask(a):
    r, g, b = a[..., 0], a[..., 1], a[..., 2]
    return (r > 150) & (r < 225) & (g > 110) & (g < 185) & (b > 60) & (b < 140) & (r - b > 45)


def find_panels(a):
    k = kraft_mask(a)
    rows = k.sum(1)
    band = np.where(rows > 0.8 * rows.max())[0]
    y0, y1 = band.min(), band.max()
    cols = k[y0:y1].mean(0)
    xs = np.where(cols > 0.3)[0]
    x0, x1 = xs.min(), xs.max()
    groups = []
    for x in range(x0, x1):
        if cols[x] < 0.05:
            if groups and x - groups[-1][-1] <= 6:
                groups[-1].append(x)
            else:
                groups.append([x])
    edges = [x0] + [(g[0] + g[-1]) // 2 for g in groups] + [x1]
    panels = [(edges[i], edges[i + 1]) for i in range(len(edges) - 1)]
    return k, (y0, y1), panels


def crop_inset(img, box, inset=3):
    x0, y0, x1, y1 = box
    return img.crop((x0 + inset, y0 + inset, x1 - inset, y1 - inset))


def find_coeffs(dst, src):
    """Perspective coefficients mapping dst quad -> src rect (PIL transform convention)."""
    m = []
    for (x, y), (u, v) in zip(dst, src):
        m.append([x, y, 1, 0, 0, 0, -u * x, -u * y])
        m.append([0, 0, 0, x, y, 1, -v * x, -v * y])
    A = np.array(m, dtype=float)
    B = np.array(src, dtype=float).reshape(8)
    return np.linalg.solve(A, B).tolist()


def warp(face, quad, size):
    w, h = face.size
    coeffs = find_coeffs(quad, [(0, 0), (w, 0), (w, h), (0, h)])
    rgba = face.convert("RGBA")
    return rgba.transform(size, Image.PERSPECTIVE, coeffs, Image.BICUBIC, fillcolor=(0, 0, 0, 0))


def shade(img, factor):
    """Darken a face (factor < 1) keeping alpha."""
    r, g, b, a = img.split()
    rgb = Image.merge("RGB", (r, g, b)).point(lambda v: int(v * factor))
    return Image.merge("RGBA", (*rgb.split(), a))


def build(slug, pdf, page):
    prefix = f"{OUTDIR}/_{slug}"
    subprocess.run(["pdftoppm", "-r", str(DPI), "-png", "-f", str(page), "-l", str(page), f"{SRC}/{pdf}", prefix], check=True)
    import glob

    path = sorted(glob.glob(prefix + "*.png"))[0]
    img = Image.open(path).convert("RGB")
    a = np.asarray(img).astype(int)
    k, (y0, y1), panels = find_panels(a)
    (fx0, fx1), (sx0, sx1) = panels[0], panels[1]
    front = crop_inset(img, (fx0, y0, fx1, y1))
    side = crop_inset(img, (sx0, y0, sx1, y1))
    depth = sx1 - sx0
    # top flap: kraft area directly above the front panel, about one depth tall
    col = k[: y0, fx0 + 20 : fx1 - 20].mean(1)
    ty0 = y0
    while ty0 > 0 and col[ty0 - 1] > 0.5:
        ty0 -= 1
    flap_h = min(depth, y0 - ty0)
    top = crop_inset(img, (fx0, y0 - flap_h, fx1, y0)) if flap_h > depth * 0.6 else Image.new("RGB", (fx1 - fx0, depth), (198, 159, 115))

    # Canvas geometry (front-on with a slight 3/4 view)
    W, H = 1600, 1200
    fw, fh = front.size
    scale = min(900 / fw, 640 / fh)
    FW, FH = fw * scale, fh * scale
    D = depth * scale * 0.55  # foreshortened depth
    dx, dy = D * 0.95, -D * 0.55
    ox = (W - (FW + dx)) / 2
    oy = (H - (FH - dy)) / 2 - dy + 30
    F = [(ox, oy), (ox + FW, oy), (ox + FW, oy + FH), (ox, oy + FH)]
    S = [(ox + FW, oy), (ox + FW + dx, oy + dy), (ox + FW + dx, oy + FH + dy), (ox + FW, oy + FH)]
    T = [(ox + dx, oy + dy), (ox + FW + dx, oy + dy), (ox + FW, oy), (ox, oy)]

    canvas = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    # soft floor shadow
    sh = Image.new("L", (W, H), 0)
    from PIL import ImageDraw

    ImageDraw.Draw(sh).polygon(
        [(ox + 10, oy + FH - 6), (ox + FW + dx, oy + FH + dy - 6), (ox + FW + dx + 60, oy + FH + dy + 30), (ox + 60, oy + FH + 40)],
        fill=120,
    )
    sh = sh.filter(ImageFilter.GaussianBlur(28))
    canvas.paste(Image.new("RGBA", (W, H), (23, 51, 48, 255)), (0, 0), sh)
    canvas.alpha_composite(shade(warp(top, T, (W, H)), 1.06))
    canvas.alpha_composite(shade(warp(side, S, (W, H)), 0.8))
    canvas.alpha_composite(warp(front, F, (W, H)))
    bbox = canvas.getbbox()
    out = canvas.crop((max(0, bbox[0] - 40), max(0, bbox[1] - 40), min(W, bbox[2] + 40), min(H, bbox[3] + 40)))
    out.save(f"{OUTDIR}/{slug}.png", optimize=True)
    out.save(f"{OUTDIR}/{slug}.webp", quality=88, method=6)
    front.convert("RGB").save(f"{OUTDIR}/{slug}-front.webp", quality=88, method=6)
    print(slug, "front", front.size, "depth", depth, "flap_h", flap_h, "->", out.size)


if len(sys.argv) > 4:
    JOBS = [(sys.argv[3], sys.argv[4], int(sys.argv[5]) if len(sys.argv) > 5 else 1)]

for job in JOBS:
    build(*job)
