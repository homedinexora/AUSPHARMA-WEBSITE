"""Build a 3D pack shot from a vertically stacked mono/unit carton dieline (front, top, back, bottom in one column;
side panels beside the back). Panels are located from the carton's stated L x W x H (mm) at 200 dpi.

Usage: pdftoppm -r 200 -png -f <page> -l <page> carton.pdf /tmp/c
       python3 scripts/make-unit-packshot.py /tmp/c-<page>.png <slug> <outdir> <L> <W> <H> [front_top_y|-] [L|R]
Pass the front panel's top edge (px) when a printed pasting flap or uneven fold lines confuse detection, and L/R to
choose the side panel beside the back. Writes <outdir>/<slug>.png/.webp; copy the .webp to public/packs/<GTIN>.webp.
"""
import importlib.util, os, sys
import numpy as np
from PIL import Image
spec = importlib.util.spec_from_file_location("mp", os.path.join(os.path.dirname(os.path.abspath(__file__)), "make-packshots.py"))
mp = importlib.util.module_from_spec(spec); spec.loader.exec_module(mp)

src, slug, outdir = sys.argv[1], sys.argv[2], sys.argv[3]
L, W, H = (float(v) for v in sys.argv[4:7])
Y0 = int(sys.argv[7]) if len(sys.argv) > 7 and sys.argv[7] != "-" else None   # front top edge, measured on the dieline
SIDE = sys.argv[8] if len(sys.argv) > 8 else None                               # "L" or "R": side panel beside the back
PX = 200 / 25.4
img = Image.open(src).convert("RGB"); a = np.asarray(img).astype(int)
r, g, b = a[..., 0], a[..., 1], a[..., 2]
printed = ((r > 150) & (r < 225) & (g > 110) & (g < 185) & (b > 60) & (b < 150) & (r - b > 45)) \
    | ((b > 150) & (r < 90) & (g > 90)) | ((b > 70) & (r < 70) & (g < 90)) \
    | ((r > 170) & (g < 90) & (b < 110)) | ((r > 200) & (g > 110) & (g < 200) & (b > 150)) \
    | ((g > r + 40) & (g > b + 40))
# kraft (incl. the lighter Bone Plus tan) | brand blue | navy | therapy red | pink "+a" tint | anti-infectives green
Lp, Wp, Hp = (round(v * PX) for v in (L, W, H))

# main column: the x-range of width L with the most printed pixels
cols = printed.mean(0)
cs = np.concatenate([[0], np.cumsum(cols)])
x0 = int(np.argmax(cs[Lp:] - cs[:-Lp])); x1 = x0 + Lp
# vertical start from the fold lines: dark rules spanning most of the column. Pick the line y0 such that lines
# follow at y0+H (front|top) and y0+H+W (top|back): a printed pasting flap above the front can't fool this.
dark = (a[:, x0:x1].sum(2) < 200).mean(1) > 0.6
lines = [y for y in range(1, len(dark)) if dark[y] and not dark[y - 1]]
def near(y, tol=6): return any(abs(l - y) <= tol for l in lines)
cands = [y for y in lines if near(y + Hp) and near(y + Hp + Wp)]
if Y0 is not None:
    y0 = Y0
elif cands:
    y0 = cands[0]
else:
    raise SystemExit(f"{slug}: no fold-line sequence matching H={H} W={W}; pass the front's top edge")
front = (x0, y0, x1, y0 + Hp)
top = (x0, y0 + Hp, x1, y0 + Hp + Wp)
back = (x0, y0 + Hp + Wp, x1, y0 + 2 * Hp + Wp)
# side panel: whichever side of the back is more printed
left = printed[back[1]:back[3], x0 - Wp:x0].mean(); right = printed[back[1]:back[3], x1:x1 + Wp].mean()
use_left = SIDE == "L" if SIDE else left >= right
side = (x0 - Wp, back[1], x0, back[3]) if use_left else (x1, back[1], x1 + Wp, back[3])
print(f"{slug}: column x {x0}-{x1}, front y {front[1]}-{front[3]}, side {'left' if use_left else 'right'} "
      f"(coverage L {left:.2f} R {right:.2f}), front coverage {printed[front[1]:front[3], x0:x1].mean():.2f}")
out = mp.render_3d(mp.crop_inset(img, front), mp.crop_inset(img, side), mp.crop_inset(img, top), slug, outdir)
img.crop((front[0], front[1], front[2], front[3])).save(f"{outdir}/{slug}-check-front.png")
