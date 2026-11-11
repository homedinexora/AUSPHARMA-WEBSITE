"""Add the Rx box (taken from the AUSRASTIN F mono carton, 200 dpi) above the generic name on a mono-carton front.

Usage: python3 scripts/add-rx-box.py <ausrastin-f-mono@200dpi.png> <mono@200dpi.png> <out.png> <panel_left_x> <front_top_y>
The pack carries no Rx yet (Pure & Cure to add it); this keeps the website pack shot in line with its RX label."""
import sys
import numpy as np
from PIL import Image

src_carton, mono, out, x_panel0, y_front = sys.argv[1], sys.argv[2], sys.argv[3], int(sys.argv[4]), int(sys.argv[5])
ref = np.asarray(Image.open(src_carton).convert("RGB")).astype(float)
box = ref[1274:1326, 575:615]                      # Rx box, 40 x 52 px at 200 dpi
kraft = np.array([193, 138, 87.0]); ink = box.reshape(-1, 3)[box.reshape(-1, 3).sum(1).argmin()]
lum = lambda c: c @ [0.299, 0.587, 0.114]
alpha = np.clip((lum(kraft) - lum(box)) / (lum(kraft) - lum(ink)), 0, 1)[..., None]

img = Image.open(mono).convert("RGB"); a = np.asarray(img).astype(float).copy()
H = 709                                            # 90 mm front at 200 dpi
front = a[y_front:y_front + H, x_panel0:x_panel0 + 709]
dark = front.sum(2) < 200
# generic name: first rows of dark text in the left 60 % of the panel
rows = np.where(dark[:, :420].sum(1) > 3)[0]
top = rows[rows > 20][0]
cols = np.where(dark[top:top + 60, :420].sum(0) > 0)[0]
left = cols[0]
bg = np.median(front[top - 40:top - 10, left:left + 200].reshape(-1, 3), 0)
y0 = y_front + top - 52 - 22                       # 22 px (~2.8 mm) gap above the generic name
x0 = x_panel0 + left
assert y0 > y_front + 8, "no room above the generic name"
patch = alpha * ink + (1 - alpha) * bg
a[y0:y0 + 52, x0:x0 + 40] = patch
Image.fromarray(a.clip(0, 255).astype(np.uint8)).save(out)
print(f"{mono}: generic name top {y_front + top}, left {x0}; Rx at ({x0},{y0}); background {bg.round()}")
