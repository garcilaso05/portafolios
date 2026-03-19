#!/usr/bin/env python3
"""Optimize images under /images, convert to WebP, and rewrite asset paths.

Usage:
  python3 scripts/optimize_images.py
  python3 scripts/optimize_images.py --dry-run
  python3 scripts/optimize_images.py --keep-originals
"""

from __future__ import annotations

import argparse
from pathlib import Path
from typing import Dict, Iterable, List, Set, Tuple

from PIL import Image, ImageSequence


SOURCE_EXTS: Set[str] = {".jpg", ".jpeg", ".png", ".gif", ".bmp", ".tif", ".tiff"}
TEXT_EXTS: Set[str] = {".html", ".js", ".css", ".json"}
DEFAULT_PRESERVE_NAMES: Set[str] = {
    "chip.png",
    "favicon-16x16.png",
    "favicon-32x32.png",
    "apple-touch-icon.png",
    "favicon.ico",
}


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Optimize and convert portfolio images to WebP")
    parser.add_argument("--project-root", default=".", help="Project root path (default: current directory)")
    parser.add_argument("--images-dir", default="images", help="Images directory relative to project root")
    parser.add_argument("--quality", type=int, default=82, help="WebP quality (default: 82)")
    parser.add_argument("--keep-originals", action="store_true", help="Keep original files after conversion")
    parser.add_argument("--dry-run", action="store_true", help="Show changes without writing files")
    parser.add_argument(
        "--preserve",
        nargs="*",
        default=sorted(DEFAULT_PRESERVE_NAMES),
        help="File names to keep untouched (default includes favicon sources)",
    )
    return parser.parse_args()


def to_posix_rel(path: Path, base: Path) -> str:
    return path.relative_to(base).as_posix()


def iter_image_files(images_root: Path, preserve_names: Set[str]) -> Iterable[Path]:
    for path in images_root.rglob("*"):
        if not path.is_file():
            continue
        if path.name in preserve_names:
            continue
        if path.suffix.lower() in SOURCE_EXTS or path.suffix.lower() == ".webp":
            yield path


def save_animated_webp(img: Image.Image, target: Path, quality: int) -> None:
    frames: List[Image.Image] = [f.convert("RGBA") for f in ImageSequence.Iterator(img)]
    durations: List[int] = [
        int(getattr(frame, "info", {}).get("duration", img.info.get("duration", 100)))
        for frame in ImageSequence.Iterator(img)
    ]
    if not frames:
        raise ValueError("Animated image has no frames")

    frames[0].save(
        target,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=img.info.get("loop", 0),
        quality=quality,
        method=6,
    )


def convert_to_webp(source: Path, target: Path, quality: int) -> Tuple[int, int]:
    before_size = source.stat().st_size if source.exists() else 0

    with Image.open(source) as img:
        exif = img.info.get("exif")
        is_animated = bool(getattr(img, "is_animated", False)) and getattr(img, "n_frames", 1) > 1

        if is_animated:
            save_animated_webp(img, target, quality)
        else:
            has_alpha = "A" in img.getbands()
            normalized = img.convert("RGBA" if has_alpha else "RGB")
            save_kwargs = {
                "format": "WEBP",
                "quality": quality,
                "method": 6,
                "optimize": True,
            }
            if exif:
                save_kwargs["exif"] = exif
            normalized.save(target, **save_kwargs)

    after_size = target.stat().st_size if target.exists() else 0
    return before_size, after_size


def rewrite_references(project_root: Path, mapping: Dict[str, str], dry_run: bool) -> int:
    changed_files = 0
    for path in project_root.rglob("*"):
        if not path.is_file():
            continue
        if path.suffix.lower() not in TEXT_EXTS:
            continue
        if any(part.startswith(".git") for part in path.parts):
            continue

        content = path.read_text(encoding="utf-8")
        updated = content

        # Longer paths first to avoid partial overlap replacements.
        for old_rel, new_rel in sorted(mapping.items(), key=lambda kv: len(kv[0]), reverse=True):
            updated = updated.replace(old_rel, new_rel)

        if updated != content:
            changed_files += 1
            if not dry_run:
                path.write_text(updated, encoding="utf-8")

    return changed_files


def main() -> int:
    args = parse_args()

    project_root = Path(args.project_root).resolve()
    images_root = (project_root / args.images_dir).resolve()
    preserve_names = {name.strip() for name in args.preserve if name.strip()}

    if not images_root.exists():
        print(f"[error] Images directory not found: {images_root}")
        return 1

    mapping: Dict[str, str] = {}
    converted = 0
    skipped = 0
    removed = 0
    bytes_before = 0
    bytes_after = 0

    for source in iter_image_files(images_root, preserve_names):
        suffix = source.suffix.lower()

        if suffix == ".webp":
            # Re-encode existing WebP to compact size when possible.
            tmp_target = source.with_name(f"{source.stem}.tmp.webp")
            try:
                before, after = convert_to_webp(source, tmp_target, args.quality)
                if args.dry_run:
                    tmp_target.unlink(missing_ok=True)
                    skipped += 1
                    continue

                if after > 0 and after <= before:
                    source.unlink(missing_ok=True)
                    tmp_target.rename(source)
                    converted += 1
                    bytes_before += before
                    bytes_after += after
                else:
                    tmp_target.unlink(missing_ok=True)
                    skipped += 1
            except Exception as exc:
                tmp_target.unlink(missing_ok=True)
                print(f"[warn] Could not optimize {source}: {exc}")
                skipped += 1
            continue

        target = source.with_suffix(".webp")
        old_rel = to_posix_rel(source, project_root)
        new_rel = to_posix_rel(target, project_root)

        try:
            before, after = convert_to_webp(source, target, args.quality)
            converted += 1
            bytes_before += before
            bytes_after += after
            mapping[old_rel] = new_rel

            if not args.keep_originals and not args.dry_run:
                source.unlink(missing_ok=True)
                removed += 1
        except Exception as exc:
            print(f"[warn] Could not convert {source}: {exc}")
            skipped += 1

    changed_files = rewrite_references(project_root, mapping, args.dry_run)

    print("[done] Image optimization completed")
    print(f"- Project root: {project_root}")
    print(f"- Images folder: {images_root}")
    print(f"- Converted: {converted}")
    print(f"- Skipped: {skipped}")
    print(f"- Removed originals: {removed}")
    print(f"- Rewritten files: {changed_files}")
    print(f"- Bytes before: {bytes_before}")
    print(f"- Bytes after:  {bytes_after}")
    if bytes_before > 0:
        saved = bytes_before - bytes_after
        ratio = (saved / bytes_before) * 100
        print(f"- Estimated savings: {saved} bytes ({ratio:.2f}%)")

    if args.dry_run:
        print("[note] Dry run mode enabled: no file was modified")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
