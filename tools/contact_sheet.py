#!/usr/bin/env python3
"""Contact sheets for UI review: python tools/contact_sheet.py [--only-before] [--theme light] [--out file] [names...]"""
import argparse
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

ROOT = Path(__file__).resolve().parent.parent / "docs" / "ui-review"
ap = argparse.ArgumentParser()
ap.add_argument("--theme", default="light")
ap.add_argument("--sets", default="before,after")
ap.add_argument("--width", type=int, default=300)
ap.add_argument("--out", default=str(ROOT / "overview.png"))
ap.add_argument("names", nargs="*")
a = ap.parse_args()
sets = [s for s in a.sets.split(",") if (ROOT / s).exists()]
names = a.names or sorted({p.name.rsplit("-", 1)[0] for p in (ROOT / sets[0]).glob(f"*-{a.theme}.png")})
w = a.width; h = int(w * 844 / 390); pad = 16; label = 34
cols = len(sets)
try:
    font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 18)
except OSError:
    font = ImageFont.load_default()
pairs_per_row = max(1, 6 // cols)
rows = (len(names) + pairs_per_row - 1) // pairs_per_row
sheet = Image.new("RGB", (pairs_per_row * (cols * (w + pad) + pad * 2), rows * (h + label + pad)), "white")
d = ImageDraw.Draw(sheet)
for i, n in enumerate(names):
    r, c = divmod(i, pairs_per_row)
    x0 = c * (cols * (w + pad) + pad * 2); y0 = r * (h + label + pad)
    for j, s in enumerate(sets):
        p = ROOT / s / f"{n}-{a.theme}.png"
        x = x0 + j * (w + pad)
        d.text((x, y0 + 8), f"{n} · {s}" if cols > 1 else n, fill="black", font=font)
        if p.exists():
            sheet.paste(Image.open(p).convert("RGB").resize((w, h)), (x, y0 + label))
sheet.save(a.out, optimize=True)
print(a.out, sheet.size)
