import { describe, expect, test } from "vitest";
import { buildTrailSegments, calculateTrailLength, smoothPoint } from "../utils/trailUtils";

describe("trailUtils", () => {
  test("smoothPoint softens abrupt pointer jumps", () => {
    const previous = { x: 10, y: 10 };
    const current = { x: 110, y: 60 };

    expect(smoothPoint(previous, current, 0.35)).toEqual({ x: 45, y: 27.5 });
  });

  test("calculateTrailLength sums the full path", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 3, y: 4 },
      { x: 9, y: 12 }
    ];

    expect(calculateTrailLength(points)).toBe(15);
  });

  test("buildTrailSegments makes the head brighter and wider than the tail", () => {
    const points = [
      { x: 0, y: 0 },
      { x: 10, y: 0 },
      { x: 25, y: 8 },
      { x: 45, y: 16 }
    ];

    const segments = buildTrailSegments(points);

    expect(segments).toHaveLength(3);
    expect(segments[0].opacity).toBeLessThan(segments[1].opacity);
    expect(segments[1].opacity).toBeLessThan(segments[2].opacity);
    expect(segments[0].width).toBeLessThan(segments[2].width);
    expect(new Set(segments.map((segment) => segment.opacity)).size).toBeGreaterThan(1);
  });
});
