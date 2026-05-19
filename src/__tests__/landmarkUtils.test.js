import { describe, expect, test } from "vitest";
import {
  calculateHandShape,
  getPalmCenter,
  getPalmSize,
  getThumbIndexRatio,
  mapNormalizedPointToScreen,
  resolvePointerPoint
} from "../gesture/landmarkUtils";

function createHand({ type = "open", x = 0.5, y = 0.5, scale = 0.1 } = {}) {
  const hand = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
  hand[0] = { x, y: y + scale * 1.1, z: 0 };
  hand[5] = { x: x - scale * 0.42, y, z: 0 };
  hand[9] = { x, y: y - scale * 0.05, z: 0 };
  hand[13] = { x: x + scale * 0.33, y, z: 0 };
  hand[17] = { x: x + scale * 0.62, y: y + scale * 0.04, z: 0 };

  if (type === "fist") {
    [4, 8, 12, 16, 20].forEach((index, offset) => {
      hand[index] = { x: x - scale * 0.18 + offset * scale * 0.09, y: y + scale * 0.18, z: 0 };
    });
    return hand;
  }

  hand[4] = { x: x - scale * 0.72, y: y + scale * 0.1, z: 0 };
  hand[8] = { x: x - scale * 0.36, y: y - scale * 1.34, z: 0 };
  hand[12] = { x, y: y - scale * 1.52, z: 0 };
  hand[16] = { x: x + scale * 0.28, y: y - scale * 1.33, z: 0 };
  hand[20] = { x: x + scale * 0.52, y: y - scale * 1.12, z: 0 };

  if (type === "ok" || type === "pinch") {
    hand[4] = { x: x - scale * 0.22, y: y - scale * 0.45, z: 0 };
    hand[8] = { x: x - scale * 0.12, y: y - scale * 0.48, z: 0 };
  }

  if (type === "pointing") {
    hand[12] = { x, y: y + scale * 0.14, z: 0 };
    hand[16] = { x: x + scale * 0.22, y: y + scale * 0.18, z: 0 };
    hand[20] = { x: x + scale * 0.36, y: y + scale * 0.2, z: 0 };
  }

  if (type === "victory") {
    hand[16] = { x: x + scale * 0.22, y: y + scale * 0.18, z: 0 };
    hand[20] = { x: x + scale * 0.36, y: y + scale * 0.2, z: 0 };
  }

  return hand;
}

describe("landmarkUtils", () => {
  test("calculates palm center and palm size from stable hand anchors", () => {
    const hand = createHand({ x: 0.45, y: 0.52, scale: 0.12 });

    expect(getPalmCenter(hand)).toMatchObject({ x: expect.any(Number), y: expect.any(Number), z: expect.any(Number) });
    expect(getPalmSize(hand)).toBeGreaterThan(0.09);
  });

  test("finger curl score separates fist from open hand", () => {
    const openShape = calculateHandShape(createHand({ type: "open" }));
    const fistShape = calculateHandShape(createHand({ type: "fist" }));

    expect(openShape.fistScore).toBeLessThan(0.45);
    expect(fistShape.fistScore).toBeGreaterThan(0.65);
    expect(openShape.openScore).toBeGreaterThan(fistShape.openScore);
  });

  test("thumb-index ratio detects OK/pinch shape", () => {
    const openHand = createHand({ type: "open" });
    const okHand = createHand({ type: "ok" });

    expect(getThumbIndexRatio(okHand)).toBeLessThan(0.35);
    expect(getThumbIndexRatio(openHand)).toBeGreaterThan(0.35);
  });

  test("detects a one-hand V wish pose without requiring two hands", () => {
    const victoryShape = calculateHandShape(createHand({ type: "victory" }));
    const openShape = calculateHandShape(createHand({ type: "open" }));

    expect(victoryShape.isVictory).toBe(true);
    expect(victoryShape.isWishPose).toBe(true);
    expect(openShape.isVictory).toBe(false);
    expect(openShape.isWishPose).toBe(false);
  });

  test("maps normalized coordinates to a screen rect and honors mirrorX", () => {
    const rect = { left: 10, top: 20, width: 400, height: 300 };

    expect(mapNormalizedPointToScreen({ x: 0.25, y: 0.5 }, rect, { mirrorX: false })).toEqual({ x: 110, y: 170 });
    expect(mapNormalizedPointToScreen({ x: 0.25, y: 0.5 }, rect, { mirrorX: true })).toEqual({ x: 310, y: 170 });
  });

  test("uses index tip for tracking, palm for fist, and midpoint for pinch", () => {
    const pointing = createHand({ type: "pointing" });
    const fist = createHand({ type: "fist" });
    const ok = createHand({ type: "ok" });

    expect(resolvePointerPoint(pointing, { status: "tracking" })).toEqual(pointing[8]);
    expect(resolvePointerPoint(fist, { status: "fist" })).toEqual(getPalmCenter(fist));
    expect(resolvePointerPoint(ok, { status: "pinching" }).x).toBeCloseTo((ok[4].x + ok[8].x) / 2);
  });
});
