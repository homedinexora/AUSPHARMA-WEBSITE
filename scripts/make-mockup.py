"""Website pack mock-ups. Outer cartons (panel.outer) never carry a colour patch: kraft, black seal, "+a" in the
therapy colour, as on the live ACEELO outer. With panel.tint set, they follow the pack shots live on auspharma.in (therapy panel
with white WHO-GMP seal and "+a" tint, strength | pack box); without it, the plain outer treatment below.
Wording and (R)/(TM) positions come from the product's previous artwork.

Outer treatment (docs/design/therapy-colour-guide-cyber-oak.docx): bare kraft board, one solid therapy panel,
text in black, panel text knocked out to board colour, "+a" in the full panel colour on bare board
(spec "plus_a": {"h": fraction of front height}). Keep the previous artwork's wording and (R)/(TM) position. Mono cartons
(solid panel over white) are a separate treatment, used only where the product has a mono carton.
Brand line is a little smaller than the generic name (21:24); strength shows actives only, lowercase units.

Usage: python3 scripts/make-mockup.py <spec.json> <outdir>
spec keys: slug, kind ("carton" | "bottle"), L, W, H (mm; bottle: label L x H), rx, generic [lines],
  brand [[text, "" | "sup"], ...], brand_sub (optional), pack, seal (bool),
  panel {color, frac, lines [..], rotate (bool)}, side {lines [..], box [..]} (carton only)
Writes <slug>.png/.webp (3D view) and <slug>-front.png.
"""
import importlib.util
import json
import os
import sys

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

HERE = os.path.dirname(os.path.abspath(__file__))
FONT = os.path.join(HERE, "..", "assets", "fonts", "Inter-Variable.ttf")
FONT_I = os.path.join(HERE, "..", "assets", "fonts", "Inter-Italic-Variable.ttf")
ASSETS = os.path.join(HERE, "mockup-assets")
PX = 200 / 25.4
KRAFT = (203, 154, 104)
INK = (26, 26, 24)
KW = {"features": ["-calt"]}  # keep "x" as x


def hexrgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def font(size, weight=400, italic=False):
    f = ImageFont.truetype(FONT_I if italic else FONT, max(6, round(size)))
    f.set_variation_by_axes([32, weight])
    return f


def tmask(txt, f):
    """Alpha mask of txt, cropped to ink, plus the baseline offset from the mask top."""
    l, t, r, b = f.getbbox(txt, **KW)
    asc = f.getmetrics()[0]
    im = Image.new("L", (r - l + 4, b - t + 4), 0)
    ImageDraw.Draw(im).text((2 - l, 2 - t), txt, font=f, fill=255, **KW)
    return im, asc - t + 2


def stamp(img, mask, color, x, y):
    img.paste(Image.new("RGB", mask.size, color), (round(x), round(y)), mask)


def brand_mask(parts, size, weight=800):
    """Brand line from [text, kind] parts; kind "sup" sets a raised mark ((R)/(TM)) exactly where the artwork has it."""
    pieces, x = [], 0.0
    for txt, kind in parts:
        if kind == "sup":
            m, base = tmask(txt, font(size * 0.42, 500))
            pieces.append((m, x - size * 0.10, -size * 0.36, base))  # tucked against the slanted cap
            x += m.width - size * 0.04
        else:
            m, base = tmask(txt, font(size, weight, True))
            pieces.append((m, x, 0, base))
            x += m.width
    asc = round(size * 1.6)
    out = Image.new("L", (round(x + size), asc + round(size * 0.6)), 0)
    for m, px, rise, base in pieces:
        out.paste(m, (round(px), round(asc - base + rise)), m)
    return out.crop(out.getbbox())


def rx_box(h):
    s = 4
    H, W = round(h * s), round(h * 0.78 * s)
    im = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    ImageDraw.Draw(im).rounded_rectangle([0, 0, W - 1, H - 1], radius=round(H * 0.16), fill=INK + (255,))
    m, _ = tmask("R", font(H * 0.78))
    im.paste(Image.new("RGB", m.size, KRAFT), (round(W * 0.12), round(H * 0.06)), m)
    m2, _ = tmask("x", font(H * 0.5))
    im.paste(Image.new("RGB", m2.size, KRAFT), (round(W * 0.46), round(H * 0.47)), m2)
    return im.resize((round(W / s), round(H / s)), Image.LANCZOS)


def seal(h):
    a = Image.open(os.path.join(ASSETS, "who-gmp-seal.png")).convert("L")
    return a.resize((round(a.width * h / a.height), round(h)), Image.LANCZOS)


def panel_text(img, spec, x0, pw, H):
    """Knock-out text (board colour) on the therapy panel, centred; stacked or rotated 90 degrees."""
    p = spec["panel"]
    lines = p["lines"]
    if p.get("rotate"):
        tile = Image.new("L", (H, pw), 0)
        size = pw * 0.55
        while size > 6:
            m, _ = tmask("  ".join(lines), font(size, 700))
            if m.width <= H * 0.8 and m.height <= pw * 0.62:
                break
            size *= 0.96
        tile.paste(m, ((H - m.width) // 2, (pw - m.height) // 2))
        stamp(img, tile.rotate(90, expand=True), KRAFT, x0, 0)
        return
    size = pw * 0.3
    while size > 6:
        ms = [tmask(l, font(size, 700))[0] for l in lines]
        if max(m.width for m in ms) <= pw * 0.8 and len(ms) * size * 1.3 <= H * 0.8:
            break
        size *= 0.96
    gap = size * 0.3
    total = sum(m.height for m in ms) + gap * (len(ms) - 1)
    y = (H - total) / 2
    for m in ms:
        stamp(img, m, KRAFT, x0 + (pw - m.width) / 2, y)
        y += m.height + gap


def front(spec, Lmm, Hmm):
    W, H = round(Lmm * PX), round(Hmm * PX)
    img = Image.new("RGB", (W, H), KRAFT)
    p = spec["panel"]
    outer = bool(p.get("outer"))  # outer carton: never a colour patch; "+a" in the therapy colour on bare board
    pw = 0 if outer else round(min(W * p["frac"], H * 1.05))
    px0 = W - pw
    if outer:
        a = Image.open(os.path.join(ASSETS, "plus-a.png")).convert("L")
        ah = min(H * 0.5, W * 0.28 * a.height / a.width)  # same size as on the live ACEELO outer
        a = a.resize((round(a.width * ah / a.height), round(ah)), Image.LANCZOS)
        stamp(img, a, hexrgb(p["color"]), W - a.width * 1.02, H - a.height * 0.86)
    else:
        img.paste(Image.new("RGB", (pw, H), hexrgb(p["color"])), (px0, 0))
    if p.get("lines"):
        panel_text(img, spec, px0, pw, H)
    site = bool(p.get("tint"))  # website pack style: seal + "+a" tint on the panel, as on the live pack shots
    if site:
        a = Image.open(os.path.join(ASSETS, "plus-a.png")).convert("L")
        ah = min(H * 0.62, pw * 0.98 * a.height / a.width)  # keep it on the panel, as on the live packs
        a = a.resize((round(a.width * ah / a.height), round(ah)), Image.LANCZOS)
        stamp(img, a, hexrgb(p["tint"]), W - a.width + a.width * 0.06, H - a.height + a.height * 0.05)
        if spec.get("seal"):
            s = seal(min(pw * 0.56, H * 0.32))
            stamp(img, s, (255, 255, 255), px0 + (pw - s.width) / 2, H * 0.06)

    m = max(24, min(W, H) * 0.07)
    left_w = px0 - 2 * m
    seal_h = min(H * 0.30, left_w * 0.2) if spec.get("seal") and not site else 0
    lines = spec["generic"]
    has_sub = bool(spec.get("brand_sub"))
    # fit the generic size to the width and the stack to the height
    g = H * 0.2
    while g > 8:
        rx_h = max(26, g * 0.62) if spec.get("rx") else 0
        gw = max(tmask(l, font(g))[0].width for l in lines)
        bw = brand_mask(spec["brand"], g * 21 / 24).width
        stack = (rx_h + g * 0.2 if rx_h else 0) + len(lines) * g * 1.12 + g * 0.3 + g * 0.9 + (g * 0.55 if has_sub else 0)
        stack += g * 0.6 + g * 1.05
        first_w = left_w - (seal_h * 1.15 if seal_h else 0)
        if gw <= first_w and bw <= left_w and stack + 2 * m <= H:
            break
        g *= 0.97
    y = m
    if spec.get("rx"):
        rx = rx_box(max(26, g * 0.62))
        img.paste(rx, (round(m), round(y)), rx)
        y += rx.height + g * 0.2
    if seal_h:
        s = seal(seal_h)
        stamp(img, s, INK, px0 - m * 0.8 - s.width, m * 0.8)
    for l in lines:
        mk, _ = tmask(l, font(g))
        stamp(img, mk, INK, m, y)
        y += g * 1.12
    y += g * 0.3
    bl = brand_mask(spec["brand"], g * 21 / 24)
    stamp(img, bl, INK, m, y)
    y += bl.height
    if has_sub:
        sm, _ = tmask(spec["brand_sub"], font(g * 0.42, 700))
        stamp(img, sm, INK, m + bl.width - sm.width, y + g * 0.15)
    if spec.get("strength"):  # strength | pack box, bottom left (live pack style)
        sf = font(g * 0.5, 500)
        a1, _ = tmask(spec["strength"], sf)
        b1, _ = tmask(spec["pack"], sf)
        pad = g * 0.26
        bh = max(a1.height, b1.height) + 2 * pad
        by = H - m - bh
        w1, w2 = a1.width + 2 * pad, b1.width + 2 * pad
        d = ImageDraw.Draw(img)
        lw = max(2, round(g * 0.04))
        d.rectangle([m, by, m + w1 + w2, by + bh], outline=INK, width=lw)
        d.line([m + w1, by, m + w1, by + bh], fill=INK, width=lw)
        stamp(img, a1, INK, m + pad, by + pad)
        stamp(img, b1, INK, m + w1 + pad, by + pad)
    else:
        pk, _ = tmask(spec["pack"], font(g * 0.55, 500))
        stamp(img, pk, INK, m, H - m - pk.height)
    return img


def side(spec, Wmm, Hmm):
    """Right side panel: composition and warnings from the previous artwork, black on board."""
    W, H = round(Wmm * PX), round(Hmm * PX)
    img = Image.new("RGB", (W, H), KRAFT)
    sd = spec.get("side") or {}
    m = W * 0.08
    if not sd.get("lines"):  # narrow side (tube carton): rotated brand line
        tile = Image.new("RGB", (H, W), KRAFT)
        bl = brand_mask(spec["brand"], W * 0.36)
        if bl.width > H * 0.85:
            bl = bl.resize((round(H * 0.85), round(bl.height * H * 0.85 / bl.width)), Image.LANCZOS)
        stamp(tile, bl, INK, (H - bl.width) / 2, (W - bl.height) / 2)
        return tile.rotate(90, expand=True)
    size = H * 0.045
    while size > 6:
        widths = [tmask(l, font(size))[0].width for l in sd["lines"] + sd.get("box", []) if l]
        if max(widths) <= W - 2.6 * m:
            break
        size *= 0.96
    y = m
    for l in sd["lines"]:
        if l:
            mk, _ = tmask(l, font(size, 700 if l.endswith(":") else 400))
            stamp(img, mk, INK, m, y)
        y += size * 1.35
    if sd.get("box"):
        y += size * 0.6
        d = ImageDraw.Draw(img)
        bh = len(sd["box"]) * size * 1.3 + size * 0.7
        d.rectangle([m, y, W - m, y + bh], outline=INK, width=max(2, round(size * 0.12)))
        yy = y + size * 0.35
        for i, l in enumerate(sd["box"]):
            mk, _ = tmask(l, font(size, 700 if i == 0 else 500))
            stamp(img, mk, INK, m + size * 0.5, yy)
            yy += size * 1.3
    return img


def top(spec, Lmm, Wmm, Hmm):
    W, D = round(Lmm * PX), round(Wmm * PX)
    img = Image.new("RGB", (W, D), KRAFT)
    pw = 0 if spec["panel"].get("outer") else round(min(W * spec["panel"]["frac"], Hmm * PX * 1.05))
    img.paste(Image.new("RGB", (pw, D), hexrgb(spec["panel"]["color"])), (W - pw, 0))
    bl = brand_mask(spec["brand"], D * 0.42)
    if bl.width > (W - pw) * 0.8:
        bl = bl.resize((round((W - pw) * 0.8), round(bl.height * (W - pw) * 0.8 / bl.width)), Image.LANCZOS)
    stamp(img, bl, INK, (W - pw - bl.width) / 2, (D - bl.height) / 2)
    return img


def bottle(label):
    """Amber PET bottle with a white cap; the label wraps the visible ~110 degrees of the cylinder."""
    bw, bh, neck_w, neck_h, cap_h = 560, 860, 250, 70, 190
    Wc, Hc = 900, 1300
    canvas = Image.new("RGBA", (Wc, Hc), (0, 0, 0, 0))
    cx, top_y = Wc // 2, 90
    body_y = top_y + cap_h + neck_h
    shoulder = 120
    sh = Image.new("L", (Wc, Hc), 0)
    ImageDraw.Draw(sh).ellipse([cx - bw * 0.62, body_y + bh - 40, cx + bw * 0.62, body_y + bh + 70], fill=130)
    canvas.paste(Image.new("RGBA", (Wc, Hc), (23, 51, 48, 255)), (0, 0), sh.filter(ImageFilter.GaussianBlur(30)))

    def cyl(n, lo=0.55):
        xs = np.linspace(-1, 1, n)
        return xs, lo + (1 - lo) * np.cos(np.arcsin(np.clip(xs, -0.999, 0.999)) * 0.95)

    amber = np.array([150, 72, 22.0])
    xs, sf = cyl(bw)
    body = np.ones((bh, bw, 3)) * amber * sf[None, :, None]
    body = np.clip(body + np.exp(-((xs + 0.45) / 0.08) ** 2)[None, :, None] * 90, 0, 255)
    bm = Image.new("L", (bw, bh), 0)
    ImageDraw.Draw(bm).rounded_rectangle([0, 0, bw - 1, bh - 1], radius=60, fill=255)
    sm = Image.new("L", (bw, bh), 255)
    ImageDraw.Draw(sm).rectangle([0, 0, bw, shoulder], fill=0)
    ImageDraw.Draw(sm).pieslice([0, 0, bw - 1, shoulder * 2], 180, 360, fill=255)
    bm = Image.fromarray(np.minimum(np.asarray(bm), np.asarray(sm)))
    canvas.paste(Image.fromarray(body.astype(np.uint8)), (cx - bw // 2, body_y), bm)
    _, ns = cyl(neck_w)
    canvas.paste(Image.fromarray((np.ones((neck_h + 10, neck_w, 3)) * amber * ns[None, :, None]).astype(np.uint8)),
                 (cx - neck_w // 2, top_y + cap_h - 5))
    cw = neck_w + 50
    _, cs = cyl(cw, 0.72)
    ribs = 0.94 + 0.06 * (np.sin(np.arange(cw) * 0.9) > 0)
    cap = np.ones((cap_h, cw, 3)) * 245 * (cs * ribs)[None, :, None]
    cmk = Image.new("L", (cw, cap_h), 0)
    ImageDraw.Draw(cmk).rounded_rectangle([0, 0, cw - 1, cap_h - 1], radius=18, fill=255)
    canvas.paste(Image.fromarray(cap.clip(0, 255).astype(np.uint8)), (cx - cw // 2, top_y), cmk)
    # the label front faces the viewer, wrapped over the visible arc of the cylinder
    lw = round(bw * 0.995)
    th = np.radians(55)
    lh = min(round(lw * label.height / label.width), bh - shoulder - 80)
    xs = np.linspace(-1, 1, lw)
    theta = np.arcsin(np.clip(xs * np.sin(th), -1, 1))
    u = (theta + th) / (2 * th) * (label.width - 1)
    L = np.asarray(label.convert("RGB").resize((label.width, lh), Image.LANCZOS)).astype(float)
    warped = L[:, np.clip(u.round().astype(int), 0, label.width - 1)]
    warped *= (0.62 + 0.38 * np.cos(theta))[None, :, None]
    warped += (np.exp(-((xs + 0.45) / 0.10) ** 2) * 45)[None, :, None]
    ly = body_y + shoulder + (bh - shoulder - lh) // 2 + 10
    canvas.paste(Image.fromarray(warped.clip(0, 255).astype(np.uint8)), (cx - lw // 2, ly))
    return canvas.crop(canvas.getbbox())


def main():
    spec = json.load(open(sys.argv[1]))
    outdir = sys.argv[2]
    os.makedirs(outdir, exist_ok=True)
    slug = spec["slug"]
    f = front(spec, spec["L"], spec["H"])
    f.save(f"{outdir}/{slug}-front.png")
    if spec.get("kind") == "bottle":
        out = bottle(f)
        out.save(f"{outdir}/{slug}.png", optimize=True)
        out.save(f"{outdir}/{slug}.webp", quality=88, method=6)
        return
    s = side(spec, spec["W"], spec["H"])
    t = top(spec, spec["L"], spec["W"], spec["H"])
    ms = importlib.util.spec_from_file_location("mp", os.path.join(HERE, "make-packshots.py"))
    mp = importlib.util.module_from_spec(ms)
    sys.argv = sys.argv[:1]
    ms.loader.exec_module(mp)
    mp.render_3d(f, s, t, slug, outdir)


if __name__ == "__main__":
    main()
