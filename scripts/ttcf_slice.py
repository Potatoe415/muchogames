"""Cut the AI-generated TTCF art into WebP sprites for public/games/ttcf/assets.

Usage (from the repo root, needs Pillow, numpy, scipy):
    python scripts/ttcf_slice.py [--src tmp-resources/ttcf] [--out public/games/ttcf/assets]

Sources, on white: the asset sheet (meadow scene, theme medallions, the
first 4 acorn characters) and the sheet of 4 extra acorns (teams 5-8). The board tiles are hand-made SVGs (assets/icons/): the mockup tiles are
too small to stay sharp on a 4K TV.
"""

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = Path(__file__).resolve().parent.parent
SHEET = "Gemini_Generated_Image_wsqj7hwsqj7hwsqj.jpg"
EXTRA_SHEET = "Gemini_Generated_Image_8ofjy28ofjy28ofj.jpg"
QUALITY = 88

# Sprites on the white sheet: name -> a point inside the sprite.
MEDALLIONS = ["improbable", "mature", "plaisir", "scolaire", "challenge", "superbe", "debuter", "gagner"]
TOKENS = {"token-red": (420, 1450), "token-blue": (810, 1450), "token-yellow": (1250, 1450), "token-purple": (1670, 1450)}
EXTRA_TOKENS = {"token-orange": (500, 760), "token-green": (1390, 830), "token-pink": (2240, 830), "token-brown": (3120, 830)}



def sprite_masks(sheet):
    """Label map of everything that is not the white sheet background."""
    rgb = np.asarray(sheet).astype(int)
    ink = np.abs(rgb - 255).sum(axis=2) > 40
    ink = ndimage.binary_closing(ink, iterations=4)
    ink = ndimage.binary_fill_holes(ink)
    labels, _ = ndimage.label(ink)
    return labels


def cut_sprite(sheet, labels, point, max_side):
    """The sprite under `point`, white removed through its own shape mask."""
    x, y = point
    label = labels[y, x]
    if not label:
        raise ValueError(f"no sprite at {point}")
    rows, cols = ndimage.find_objects((labels == label).astype(int))[0]
    box = (cols.start, rows.start, cols.stop, rows.stop)
    alpha = Image.fromarray(((labels == label) * 255).astype(np.uint8)).crop(box)
    alpha = alpha.filter(ImageFilter.GaussianBlur(1.2))
    sprite = sheet.crop(box).convert("RGBA")
    sprite.putalpha(alpha)
    sprite.thumbnail((max_side, max_side), Image.LANCZOS)
    return sprite


def medallion_points(labels):
    """Centres of the 8 medallions: the row of equal circles below the scene."""
    found = []
    for rows, cols in ndimage.find_objects(labels):
        h, w = rows.stop - rows.start, cols.stop - cols.start
        if 200 < w < 260 and 200 < h < 260:
            found.append(((cols.start + cols.stop) // 2, (rows.start + rows.stop) // 2))
    found.sort()
    if len(found) != len(MEDALLIONS):
        raise ValueError(f"expected {len(MEDALLIONS)} medallions, found {len(found)}")
    return found


def scene_box(labels):
    """The meadow scene: the largest sprite, cut inside its torn edges."""
    sizes = ndimage.sum(np.ones_like(labels), labels, index=range(1, labels.max() + 1))
    label = int(np.argmax(sizes)) + 1
    rows, cols = ndimage.find_objects((labels == label).astype(int))[0]
    inset = 70
    return (cols.start + inset, rows.start + inset, cols.stop - inset, rows.stop - inset)



def save(img, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    img.save(path, "WEBP", quality=QUALITY, method=6)
    print(f"{path.relative_to(ROOT)} {img.width}x{img.height}")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default=str(ROOT / "tmp-resources" / "ttcf"))
    parser.add_argument("--out", default=str(ROOT / "public" / "games" / "ttcf" / "assets"))
    args = parser.parse_args()
    src, out = Path(args.src), Path(args.out)

    sheet = Image.open(src / SHEET).convert("RGB")
    labels = sprite_masks(sheet)
    save(sheet.crop(scene_box(labels)), out / "meadow.webp")
    for name, point in zip(MEDALLIONS, medallion_points(labels)):
        save(cut_sprite(sheet, labels, point, 240), out / "medallions" / f"{name}.webp")
    for name, point in TOKENS.items():
        save(cut_sprite(sheet, labels, point, 400), out / f"{name}.webp")

    extra = Image.open(src / EXTRA_SHEET).convert("RGB")
    extra_labels = sprite_masks(extra)
    for name, point in EXTRA_TOKENS.items():
        save(cut_sprite(extra, extra_labels, point, 400), out / f"{name}.webp")



if __name__ == "__main__":
    main()
