from __future__ import annotations

from collections import deque
from pathlib import Path
from statistics import median

from PIL import Image


ROOT = Path(r"d:\ai-coding")
INPUT_DIR = ROOT / "public" / "assets" / "needs-manual-cutout"
OUTPUT_DIR = ROOT / "public" / "assets" / "cutouts"


def is_background(pixel: tuple[int, int, int, int]) -> bool:
    r, g, b, a = pixel
    if a == 0:
        return True
    channel_max = max(r, g, b)
    channel_min = min(r, g, b)
    return channel_max >= 210 and channel_max - channel_min <= 25


def find_foreground_boxes(image: Image.Image) -> list[tuple[int, int, int, int]]:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    pixels = rgba.load()
    background = bytearray(width * height)

    def idx(x: int, y: int) -> int:
        return y * width + x

    queue: deque[tuple[int, int]] = deque()

    for x in range(width):
        for y in (0, height - 1):
            if is_background(pixels[x, y]) and not background[idx(x, y)]:
                background[idx(x, y)] = 1
                queue.append((x, y))

    for y in range(height):
        for x in (0, width - 1):
            if is_background(pixels[x, y]) and not background[idx(x, y)]:
                background[idx(x, y)] = 1
                queue.append((x, y))

    while queue:
        x, y = queue.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if not (0 <= nx < width and 0 <= ny < height):
                continue
            pos = idx(nx, ny)
            if background[pos] or not is_background(pixels[nx, ny]):
                continue
            background[pos] = 1
            queue.append((nx, ny))

    seen = bytearray(width * height)
    boxes: list[tuple[int, int, int, int, int]] = []

    for y in range(height):
        for x in range(width):
            pos = idx(x, y)
            if background[pos] or seen[pos]:
                continue

            queue = deque([(x, y)])
            seen[pos] = 1
            count = 0
            min_x = max_x = x
            min_y = max_y = y

            while queue:
                cx, cy = queue.popleft()
                count += 1
                min_x = min(min_x, cx)
                max_x = max(max_x, cx)
                min_y = min(min_y, cy)
                max_y = max(max_y, cy)

                for nx, ny in ((cx + 1, cy), (cx - 1, cy), (cx, cy + 1), (cx, cy - 1)):
                    if not (0 <= nx < width and 0 <= ny < height):
                        continue
                    next_pos = idx(nx, ny)
                    if background[next_pos] or seen[next_pos]:
                        continue
                    seen[next_pos] = 1
                    queue.append((nx, ny))

            if count >= 500:
                boxes.append((min_x, min_y, max_x + 1, max_y + 1, count))

    boxes.sort(key=lambda item: (item[1], item[0]))
    return [(left, top, right, bottom) for left, top, right, bottom, _ in boxes]


def trim_transparent(image: Image.Image) -> Image.Image:
    bbox = image.getchannel("A").getbbox()
    if bbox is None:
        return image
    return image.crop(bbox)


def group_rows(boxes: list[tuple[int, int, int, int]]) -> list[list[tuple[int, int, int, int]]]:
    if not boxes:
        return []

    heights = [bottom - top for _, top, _, bottom in boxes]
    tolerance = max(24, int(median(heights) * 0.35))
    rows: list[list[tuple[int, int, int, int]]] = []

    for box in boxes:
        _, top, _, bottom = box
        center_y = (top + bottom) / 2
        if not rows:
            rows.append([box])
            continue

        previous_row = rows[-1]
        row_center = sum((row_top + row_bottom) / 2 for _, row_top, _, row_bottom in previous_row) / len(previous_row)
        if abs(center_y - row_center) <= tolerance:
            previous_row.append(box)
        else:
            rows.append([box])

    for row in rows:
        row.sort(key=lambda item: item[0])

    return rows


def make_transparent_crop(
    image: Image.Image,
    box: tuple[int, int, int, int],
    padding: int = 8,
) -> Image.Image:
    rgba = image.convert("RGBA")
    width, height = rgba.size
    left, top, right, bottom = box
    crop_left = max(0, left - padding)
    crop_top = max(0, top - padding)
    crop_right = min(width, right + padding)
    crop_bottom = min(height, bottom + padding)
    cropped = rgba.crop((crop_left, crop_top, crop_right, crop_bottom))
    out = Image.new("RGBA", cropped.size, (0, 0, 0, 0))
    source_pixels = cropped.load()
    out_pixels = out.load()

    for y in range(cropped.size[1]):
        for x in range(cropped.size[0]):
            pixel = source_pixels[x, y]
            if not is_background(pixel):
                out_pixels[x, y] = pixel

    return trim_transparent(out)


def export_sheet(image_path: Path) -> list[str]:
    image = Image.open(image_path)
    boxes = find_foreground_boxes(image)
    rows = group_rows(boxes)
    sheet_output = OUTPUT_DIR / image_path.stem
    sheet_output.mkdir(parents=True, exist_ok=True)

    manifest_lines = [f"{image_path.name}: {sum(len(row) for row in rows)} items"]

    for row_index, row in enumerate(rows, start=1):
        for col_index, box in enumerate(row, start=1):
            crop = make_transparent_crop(image, box)
            file_name = f"{image_path.stem}_r{row_index:02d}_c{col_index:02d}.png"
            crop.save(sheet_output / file_name)
            manifest_lines.append(f"- {file_name}")

    return manifest_lines


def export_single(image_path: Path) -> list[str]:
    image = Image.open(image_path).convert("RGBA")
    trimmed = trim_transparent(image)
    output_dir = OUTPUT_DIR / image_path.stem
    output_dir.mkdir(parents=True, exist_ok=True)
    file_name = f"{image_path.stem}.png"
    trimmed.save(output_dir / file_name)
    return [f"{image_path.name}: 1 item", f"- {file_name}"]


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    manifest: list[str] = []

    single_names = {"tear_lake_single_white_background.png"}

    for image_path in sorted(INPUT_DIR.glob("*.png")):
        if image_path.name in single_names:
            manifest.extend(export_single(image_path))
        else:
            manifest.extend(export_sheet(image_path))
        manifest.append("")

    (OUTPUT_DIR / "manifest.txt").write_text("\n".join(manifest), encoding="utf-8")


if __name__ == "__main__":
    main()
