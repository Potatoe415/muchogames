"""Slice the AI-generated chess piece sheets into 256x256 WebP pieces.

Usage (from the repo root, needs Pillow):
    python scripts/chess_slice.py [--src tmp-resources] [--out public/games/chess]

Each sheet is a 3x2 grid on a flat magenta background, top row king, queen,
rook, bottom row bishop, knight, pawn. Every piece keeps the same scale
(the tallest piece fills HEIGHT_SHARE of a square) and stands on the same
baseline.

Writes:
    <out>/pieces/<white|black>-<piece>.webp
    <out>/assets/thumbnail.webp  (hub tile, 4:5)
"""

import argparse
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

ROOT = Path(__file__).resolve().parent.parent

SHEETS = [("white", "gemini-chess-white.jpg"), ("black", "gemini-chess-black.jpg")]
GRID = [["king", "queen", "rook"], ["bishop", "knight", "pawn"]]
SIZE = 256
HEIGHT_SHARE = 0.9
BASELINE = 0.955

# Magenta key: strength = min(R, B) - G. Pieces sit near 0, the background
# near 250; in between is the anti-aliased edge.
KEY_LOW = 45
KEY_HIGH = 150


def key_alpha(strength):
    if strength <= KEY_LOW:
        return 255
    if strength >= KEY_HIGH:
        return 0
    return round(255 * (KEY_HIGH - strength) / (KEY_HIGH - KEY_LOW))


def key_out(sheet):
    r, g, b = sheet.split()
    strength = ImageChops.subtract(ImageChops.darker(r, b), g)
    alpha = strength.point(key_alpha)
    # Despill the edge: clamp the magenta channels back towards green.
    r2 = ImageChops.darker(r, ImageChops.add(g, Image.new("L", g.size, 40)))
    b2 = ImageChops.darker(b, g)
    edge = alpha.point(lambda v: 255 if v < 255 else 0)
    r = Image.composite(r2, r, edge)
    b = Image.composite(b2, b, edge)
    return Image.merge("RGBA", (r, g, b, alpha))


def cut_cells(keyed):
    width, height = keyed.size
    cells = {}
    for row, names in enumerate(GRID):
        for col, name in enumerate(names):
            left, right = col * width // 3, (col + 1) * width // 3
            top, bottom = row * height // 2, (row + 1) * height // 2
            cell = keyed.crop((left, top, right, bottom))
            solid = cell.getchannel("A").point(lambda v: 255 if v > 128 else 0)
            cells[name] = cell.crop(solid.getbbox())
    return cells


def place(piece, scale, size=SIZE):
    w = max(1, round(piece.width * scale))
    h = max(1, round(piece.height * scale))
    canvas = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    spot = ((size - w) // 2, round(size * BASELINE) - h)
    canvas.alpha_composite(piece.resize((w, h), Image.LANCZOS), spot)
    return canvas


# Hub tile: the king's side of a wood board in mid-game (files c to h).
THUMB_PIECES = [
    ("black", "king", 6, 0),
    ("black", "rook", 5, 0),
    ("black", "queen", 3, 0),
    ("black", "pawn", 5, 1),
    ("black", "pawn", 6, 1),
    ("black", "pawn", 7, 1),
    ("black", "knight", 2, 2),
    ("black", "pawn", 4, 3),
    ("white", "queen", 7, 3),
    ("white", "bishop", 2, 4),
    ("white", "pawn", 4, 4),
    ("white", "knight", 5, 5),
    ("white", "pawn", 5, 6),
    ("white", "pawn", 6, 6),
    ("white", "pawn", 7, 6),
    ("white", "rook", 5, 7),
    ("white", "king", 6, 7),
]
THUMB_FIRST_COL = 2
THUMB_LAST_MOVE = ((3, 7), (7, 3))
HIGHLIGHT = (255, 214, 92)


def square_colour(r, c):
    colour = (181, 136, 99) if (r + c) % 2 else (240, 217, 181)
    if (r, c) in THUMB_LAST_MOVE:
        colour = tuple(round(v * 0.55 + h * 0.45) for v, h in zip(colour, HIGHLIGHT))
    return colour


def thumbnail(pieces, scale):
    tile = Image.new("RGBA", (400, 500), (90, 58, 34, 255))
    draw = ImageDraw.Draw(tile)
    sq, left, top = 62, 14, 2
    for r in range(8):
        for c in range(THUMB_FIRST_COL, 8):
            x, y = left + (c - THUMB_FIRST_COL) * sq, top + r * sq
            draw.rectangle([x, y, x + sq - 1, y + sq - 1], fill=square_colour(r, c))
    for side, name, c, r in THUMB_PIECES:
        x, y = left + (c - THUMB_FIRST_COL) * sq, top + r * sq
        piece = place(pieces[side][name], scale * sq / SIZE, sq)
        tile.alpha_composite(piece, (x, y))
    return tile.convert("RGB")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--src", default="tmp-resources")
    parser.add_argument("--out", default="public/games/chess")
    args = parser.parse_args()
    src, out = ROOT / args.src, ROOT / args.out
    pieces = {
        side: cut_cells(key_out(Image.open(src / file).convert("RGB")))
        for side, file in SHEETS
    }
    tallest = max(p.height for cells in pieces.values() for p in cells.values())
    scale = SIZE * HEIGHT_SHARE / tallest
    (out / "pieces").mkdir(parents=True, exist_ok=True)
    for side, cells in pieces.items():
        for name, piece in cells.items():
            target = out / "pieces" / f"{side}-{name}.webp"
            place(piece, scale).save(target, quality=90, method=6)
    tile = thumbnail(pieces, scale)
    tile.save(out / "assets" / "thumbnail.webp", quality=88, method=6)
    print(f"12 pieces + thumbnail written to {out}")


if __name__ == "__main__":
    main()
