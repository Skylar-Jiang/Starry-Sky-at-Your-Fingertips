import { describe, expect, test } from "vitest";
import {
  createPrayerHoldTracker,
  detectPinch,
  detectPrayerGesture,
  mapLandmarkToElementPoint
} from "../utils/gestureUtils";

function createHand({ x = 0.5, y = 0.5, scale = 0.1 } = {}) {
  const hand = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
  hand[0] = { x, y: y + scale, z: 0 };
  hand[4] = { x: x - scale * 0.25, y: y + scale * 0.12, z: 0 };
  hand[5] = { x: x - scale * 0.35, y, z: 0 };
  hand[8] = { x: x - scale * 0.1, y: y - scale * 1.35, z: 0 };
  hand[9] = { x, y: y - scale * 0.08, z: 0 };
  hand[12] = { x, y: y - scale * 1.5, z: 0 };
  hand[13] = { x: x + scale * 0.25, y, z: 0 };
  hand[16] = { x: x + scale * 0.18, y: y - scale * 1.3, z: 0 };
  hand[17] = { x: x + scale * 0.42, y: y + scale * 0.02, z: 0 };
  hand[20] = { x: x + scale * 0.35, y: y - scale * 1.1, z: 0 };
  return hand;
}

describe("gestureUtils", () => {
  test("detectPinch normalizes thumb/index distance and uses hysteresis", () => {
    const hand = createHand({ scale: 0.12 });
    hand[4] = { x: 0.5, y: 0.5, z: 0 };
    hand[8] = { x: 0.512, y: 0.5, z: 0 };

    const started = detectPinch(hand, { previousPinching: false, startThreshold: 0.35, endThreshold: 0.48 });
    expect(started.isPinching).toBe(true);
    expect(started.normalizedDistance).toBeLessThan(0.35);

    hand[8] = { x: 0.55, y: 0.5, z: 0 };
    const held = detectPinch(hand, { previousPinching: true, startThreshold: 0.35, endThreshold: 0.48 });
    expect(held.isPinching).toBe(true);

    hand[8] = { x: 0.59, y: 0.5, z: 0 };
    const released = detectPinch(hand, { previousPinching: true, startThreshold: 0.35, endThreshold: 0.48 });
    expect(released.isPinching).toBe(false);
  });

  test("detectPrayerGesture scores two close upright hands higher than one hand", () => {
    const left = createHand({ x: 0.46, y: 0.48 });
    const right = createHand({ x: 0.54, y: 0.48 });

    const prayer = detectPrayerGesture([left, right], {
      maxPalmDistanceRatio: 1.5,
      maxPalmHeightDeltaRatio: 0.7,
      scoreThreshold: 0.75
    });

    expect(prayer.handsCount).toBe(2);
    expect(prayer.isPraying).toBe(true);
    expect(prayer.prayerScore).toBeGreaterThanOrEqual(0.75);

    const oneHand = detectPrayerGesture([left]);
    expect(oneHand.handsCount).toBe(1);
    expect(oneHand.isPraying).toBe(false);
    expect(oneHand.prayerScore).toBeLessThan(0.75);
  });

  test("createPrayerHoldTracker triggers only after stable hold time and cooldown", () => {
    const tracker = createPrayerHoldTracker({ holdMs: 1000, cooldownMs: 3000, scoreThreshold: 0.75 });

    expect(tracker.update({ prayerScore: 0.8, timestamp: 0 }).triggered).toBe(false);
    expect(tracker.update({ prayerScore: 0.82, timestamp: 999 }).triggered).toBe(false);
    expect(tracker.update({ prayerScore: 0.82, timestamp: 1000 }).triggered).toBe(true);
    expect(tracker.update({ prayerScore: 0.9, timestamp: 1200 }).triggered).toBe(false);
    expect(tracker.update({ prayerScore: 0.9, timestamp: 4200 }).triggered).toBe(true);
  });

  test("mapLandmarkToElementPoint converts normalized video coordinates to element pixels", () => {
    const rect = { left: 10, top: 20, width: 400, height: 300 };

    expect(mapLandmarkToElementPoint({ x: 0.25, y: 0.5 }, rect)).toEqual({ x: 100, y: 150 });
  });
});
