#!/usr/bin/env python3
"""Generate favicon assets from images/chip.png."""

from __future__ import annotations

from pathlib import Path

from PIL import Image


def main() -> int:
    project_root = Path(__file__).resolve().parents[1]
    images_dir = project_root / "images"
    source = images_dir / "chip.png"

    if not source.exists():
        print(f"[error] Source icon not found: {source}")
        return 1

    outputs = {
        "favicon-16x16.png": (16, 16),
        "favicon-32x32.png": (32, 32),
        "apple-touch-icon.png": (180, 180),
        "android-chrome-192x192.png": (192, 192),
        "android-chrome-512x512.png": (512, 512),
    }

    with Image.open(source) as img:
        base = img.convert("RGBA")

        for filename, size in outputs.items():
            resized = base.resize(size, Image.Resampling.LANCZOS)
            resized.save(images_dir / filename, format="PNG", optimize=True)
            print(f"[ok] Generated {filename} ({size[0]}x{size[1]})")

        ico_sizes = [(16, 16), (32, 32), (48, 48)]
        base.save(images_dir / "favicon.ico", format="ICO", sizes=ico_sizes)
        print("[ok] Generated favicon.ico")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
