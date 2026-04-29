from __future__ import annotations

from collections import deque
from pathlib import Path
from PIL import Image, ImageDraw


ROOT = Path(r"d:\ai-coding")
INPUT_DIR = ROOT / "public" / "assets" / "needs-manual-cutout"
OUTPUT_DIR = ROOT / "public" / "assets" / "_cutout-analysis"


def is_foreground(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return False
    return not (r >= 245 and g >= 245 and b >= 245)


def find_components(image: Image.Image) -> list[tuple[int, int, int, int]]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    visited = bytearray(width * height)
    components: list[tuple[int, int, int, int]] = []

    def idx(x: int, y: int) -> int:
        return y * width + x

    for y in range(height):
        for x in range(width):
            if visited[idx(x, y)] or not is_foreground(pixels[x, y]):
                continue

            queue: deque[tuple[int, int]] = deque([(x, y)])
            visited[idx(x, y)] = 1
            min_x = max_x = x
            min_y = max_y = y
            count = 0

            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)

                for nx, ny in (
                    (cx + 1, cy),
                    (cx - 1, cy),
                    (cx, cy + 1),
                    (cx, cy - 1),
                ):
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    pos = idx(nx, ny)
                    if visited[pos]:
                        continue
                    visited[pos] = 1
                    if is_foreground(pixels[nx, ny]):
                        queue.append((nx, ny))

            area = (max_x - min_x + 1) * (max_y - min_y + 1)
            if count >= 300 and area >= 3000:
                components.append((min_x, min_y, max_x + 1, max_y + 1))

    return sorted(components, key=lambda box: (box[1], box[0]))


def save_preview(image: Image.Image, boxes: list[tuple[int, int, int, int]], out_path: Path) -> None:
    preview = image.convert("RGBA").copy()
    draw = ImageDraw.Draw(preview)
    for index, (left, top, right, bottom) in enumerate(boxes, start=1):
        draw.rectangle((left, top, right - 1, bottom - 1), outline=(255, 0, 0, 255), width=3)
        draw.text((left + 4, top + 4), str(index), fill=(0, 0, 255, 255))
    preview.save(out_path)


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    lines: list[str] = []

    for image_path in sorted(INPUT_DIR.glob("*.png")):
        image = Image.open(image_path)
        thumb = image.copy()
        thumb.thumbnail((480, 480))
        thumb.convert("RGB").save(OUTPUT_DIR / f"{image_path.stem}_thumb.jpg", quality=85)
        boxes = find_components(image)
        preview_name = image_path.stem + "_preview.png"
        save_preview(image, boxes, OUTPUT_DIR / preview_name)

        lines.append(f"[{image_path.name}] size={image.size[0]}x{image.size[1]} components={len(boxes)}")
        for index, (left, top, right, bottom) in enumerate(boxes, start=1):
            lines.append(f"  {index}: x={left}, y={top}, w={right-left}, h={bottom-top}")
        lines.append("")

    (OUTPUT_DIR / "report.txt").write_text("\n".join(lines), encoding="utf-8")


if __name__ == "__main__":
    main()
