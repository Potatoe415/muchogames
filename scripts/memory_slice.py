"""Slice the AI-generated Memory sheets into 400x400 WebP cards.

Usage (from the repo root, needs Pillow):
    python scripts/memory_slice.py [--src tmp-resources] [--out public/games/memory]

Writes:
    <out>/cards/<theme>/card_NN.webp
    <out>/backs/back_NN.webp
    <out>/decks.js  (manifest imported by the game)
"""

import argparse
import shutil
from pathlib import Path

from PIL import Image

ROOT = Path(__file__).resolve().parent.parent

THEMES = [
    ("miraculous", ["gemini-mira1.jpg", "gemini-mira2.jpg"]),
    ("objets", ["gemini-obj1.jpg", "gemini-obj2.jpg"]),
    ("ghibli", ["gemini-gibli1.jpg", "gemini-gibli2.jpg"]),
    ("pat-patrouille", ["gemini-pat1.jpg", "gemini-pat2.jpg"]),
    ("dinosaures", ["gemini-dino1.jpg", "gemini-dino2.jpg"]),
    (
        "cuba",
        [
            "gemini-cuba1.jpg",
            "gemini-cuba2.jpg",
            "gemini-cuba3.jpg",
            "gemini-cuba4.jpg",
        ],
    ),
    ("nature", ["gemini-nat1.jpg", "gemini-nat2.jpg"]),
    (
        "harry-potter",
        ["gemini-hp1.jpg", "gemini-hp2.jpg", "gemini-hp3.jpg", "gemini-hp4.jpg"],
    ),
    (
        "camions",
        [
            "gemini-camion1.jpg",
            "gemini-camion2.jpg",
            "gemini-camion3.jpg",
            "gemini-camion4.jpg",
        ],
    ),
]
# 1-based tiles to drop because they look like a tile of another sheet.
SKIP = {"gemini-camion4.jpg": {9}}
# Square white-backed cells in a thin frame: the white top of each cell reads
# as gutter, so rows reuse the column bands.
SQUARE_CELLS = {f"gemini-camion{i}.jpg" for i in range(1, 5)}
BACK_SHEETS = ["gemini-verso1.jpg", "gemini-verso2.jpg"]
CARD_GRID = 3
BACK_GRID = 2

SIZE = 400
QUALITY = 85
INSET = 0.05
WHITE_LEVEL = 230
DARK_LEVEL = 100
GUTTER_RATIO = 0.92
MIN_BAND_RATIO = 0.25


def gutter_mask(img, dark):
    """255 on gutter pixels: near-white, or near-black when `dark` is set."""
    gray = img.convert("L")
    if dark:
        return gray.point(lambda v: 255 if v <= DARK_LEVEL else 0)
    return gray.point(lambda v: 255 if v >= WHITE_LEVEL else 0)


def profile(mask, axis):
    """Mean whiteness (0..255) of each column (axis 0) or row (axis 1)."""
    width, height = mask.size
    size = (width, 1) if axis == 0 else (1, height)
    return list(mask.resize(size, Image.BOX).tobytes())


def bands(values, n):
    """Runs of non-gutter lines, or None if they don't form n clean cells."""
    limit = GUTTER_RATIO * 255
    runs, start = [], None
    for index, value in enumerate(values + [255]):
        if value < limit and start is None:
            start = index
        elif value >= limit and start is not None:
            runs.append((start, index))
            start = None
    min_len = MIN_BAND_RATIO * len(values) / n
    runs = [run for run in runs if run[1] - run[0] >= min_len]
    return runs if len(runs) == n else None


def even_split(lo, hi, n):
    step = (hi - lo) / n
    return [(round(lo + i * step), round(lo + (i + 1) * step)) for i in range(n)]


def content_box(mask):
    box = mask.point(lambda v: 255 - v).getbbox()
    return box or (0, 0, mask.width, mask.height)


def band_score(runs, total):
    """How much of the sheet the bands cover, or 0 when they look wrong.

    A real grid covers most of the sheet with bands of similar length.
    Illustration blobs (nature sheets on the light mask) fail both tests.
    """
    if not runs:
        return 0
    lengths = [end - start for start, end in runs]
    if max(lengths) > 1.5 * min(lengths):
        return 0
    covered = sum(lengths)
    if covered < 0.75 * total:
        return 0
    return covered


def grid_mask(img, n):
    """Whichever gutter color (light or dark) yields the fuller grid."""
    best, best_score = None, 0
    for dark in (False, True):
        mask = gutter_mask(img, dark)
        score = band_score(bands(profile(mask, 1), n), img.height)
        if score > best_score:
            best, best_score = mask, score
    return best if best else gutter_mask(img, False)


def cell_boxes(img, n, name):
    """Grid cells as (left, top, right, bottom), row-major.

    Gutters come from the pixel profiles; any axis that does not yield
    exactly n bands falls back to an even split of the trimmed sheet.
    """
    mask = grid_mask(img, n)
    left, top, right, bottom = content_box(mask)
    if name in SQUARE_CELLS:
        cols = bands(profile(mask, 0), n) or even_split(left, right, n)
        rows = [(top + x0 - left, top + x1 - left) for x0, x1 in cols]
        return [(x0, y0, x1, y1) for y0, y1 in rows for x0, x1 in cols]
    rows = bands(profile(mask, 1), n)
    if not rows:
        print(f"  {name}: rows -> even split")
        rows = even_split(top, bottom, n)
    boxes = []
    for index, (y0, y1) in enumerate(rows, start=1):
        strip = mask.crop((0, y0, mask.width, y1))
        cols = bands(profile(strip, 0), n)
        if not cols:
            print(f"  {name}: row {index} columns -> even split")
            cols = even_split(left, right, n)
        boxes.extend((x0, y0, x1, y1) for x0, x1 in cols)
    return boxes


def safe_crop(box):
    """5% inset on each side, then the centered square."""
    left, top, right, bottom = box
    dx = (right - left) * INSET
    dy = (bottom - top) * INSET
    left, top, right, bottom = left + dx, top + dy, right - dx, bottom - dy
    side = min(right - left, bottom - top)
    cx, cy = (left + right) / 2, (top + bottom) / 2
    half = side / 2
    return tuple(round(v) for v in (cx - half, cy - half, cx + half, cy + half))


def slice_sheet(path, n):
    img = Image.open(path).convert("RGB")
    skip = SKIP.get(path.name, set())
    return [
        img.crop(safe_crop(box)).resize((SIZE, SIZE), Image.LANCZOS)
        for index, box in enumerate(cell_boxes(img, n, path.name), start=1)
        if index not in skip
    ]


def export(tiles, folder, prefix):
    if folder.exists():
        shutil.rmtree(folder)
    folder.mkdir(parents=True)
    for index, tile in enumerate(tiles, start=1):
        tile.save(folder / f"{prefix}_{index:02d}.webp", "WEBP", quality=QUALITY, method=6)
    return len(tiles)


def write_manifest(path, counts, back_count):
    themes = "\n".join(
        f'  {{ id: "{theme}", count: {count} }},' for theme, count in counts
    ).rstrip(",")
    backs = ", ".join(f'"{i:02d}"' for i in range(1, back_count + 1))
    path.write_text(
        "// Generated by scripts/memory_slice.py. Do not edit by hand.\n"
        f"export const THEMES = [\n{themes}\n];\n\n"
        f"export const BACKS = [{backs}];\n",
        encoding="utf-8",
        newline="\n",
    )


def main():
    parser = argparse.ArgumentParser(description=__doc__.splitlines()[0])
    parser.add_argument("--src", default=ROOT / "tmp-resources", type=Path)
    parser.add_argument("--out", default=ROOT / "public/games/memory", type=Path)
    args = parser.parse_args()

    counts = []
    for theme, sheets in THEMES:
        tiles = [t for sheet in sheets for t in slice_sheet(args.src / sheet, CARD_GRID)]
        counts.append((theme, export(tiles, args.out / "cards" / theme, "card")))
        print(f"{theme}: {counts[-1][1]} cards")

    backs = [t for sheet in BACK_SHEETS for t in slice_sheet(args.src / sheet, BACK_GRID)]
    back_count = export(backs, args.out / "backs", "back")
    print(f"backs: {back_count}")

    write_manifest(args.out / "decks.js", counts, back_count)
    print(f"manifest: {args.out / 'decks.js'}")


if __name__ == "__main__":
    main()
