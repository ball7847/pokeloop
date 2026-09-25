#!/usr/bin/env python3
"""
Normalize transparent Pokemon sprite PNGs for PokeLoop.

Rule:
1) crop to non-transparent alpha bounds
2) add 12% breathing room based on the longer side
3) center on a square transparent canvas
4) resize to 128x128 with nearest-neighbor sampling
"""

from __future__ import annotations

import argparse
import io
import zipfile
from pathlib import Path

from PIL import Image


def normalize_sprite(image: Image.Image, size: int = 128, padding_ratio: float = 0.12) -> Image.Image:
    image = image.convert("RGBA")
    bbox = image.getchannel("A").getbbox()

    if bbox is None:
        return Image.new("RGBA", (size, size), (0, 0, 0, 0))

    cropped = image.crop(bbox)
    width, height = cropped.size
    longest = max(width, height)
    padding = max(2, round(longest * padding_ratio))
    canvas_size = longest + padding * 2

    canvas = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    x = (canvas_size - width) // 2
    y = (canvas_size - height) // 2
    canvas.alpha_composite(cropped, (x, y))

    return canvas.resize((size, size), Image.Resampling.NEAREST)


def normalize_zip(zip_path: Path, output_dir: Path, prefix: str = "Front/") -> int:
    output_dir.mkdir(parents=True, exist_ok=True)
    count = 0

    with zipfile.ZipFile(zip_path) as archive:
        for name in archive.namelist():
            if not name.startswith(prefix) or not name.lower().endswith(".png"):
                continue

            image = Image.open(io.BytesIO(archive.read(name)))
            normalized = normalize_sprite(image)
            normalized.save(output_dir / Path(name).name, optimize=True)
            count += 1

    return count


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("zip", type=Path, help="source sprite ZIP")
    parser.add_argument(
        "--output",
        type=Path,
        default=Path("assets/images/pokemon/front"),
        help="output directory",
    )
    args = parser.parse_args()

    count = normalize_zip(args.zip, args.output)
    print(f"normalized {count} sprites into {args.output}")


if __name__ == "__main__":
    main()
