import { describe, expect, test } from "vitest";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import {
  getBoxOverlapArea,
  getProjectedNodeBounds,
  projectConstellationNodes
} from "../utils/constellationProjection";
import { chooseConstellationLayout, chooseNextConstellationKey } from "../utils/constellationSelection";

describe("constellation selection", () => {
  test("chooses a next constellation whose preset nodes do not collide with existing stars when possible", () => {
    const records = projectConstellationNodes(getConstellationByKey("aries"), null, 1200, 800).map((node) => ({
      star: { x: node.x, y: node.y, constellationKey: "aries", constellationNodeId: node.id }
    }));
    const nextKey = chooseNextConstellationKey({
      currentKey: "aries",
      viewportWidth: 1200,
      viewportHeight: 800,
      records,
      minDistance: 34,
      random: () => 0
    });
    const selectedConstellation = getConstellationByKey(nextKey);
    const selectedLayout = chooseConstellationLayout({
      constellation: selectedConstellation,
      records,
      viewportWidth: 1200,
      viewportHeight: 800,
      minDistance: 34,
      random: () => 0
    });
    const selectedPoints = projectConstellationNodes(selectedConstellation, null, 1200, 800, selectedLayout);
    const nearestDistance = Math.min(
      ...selectedPoints.flatMap((point) =>
        records.map((record) => Math.hypot(point.x - record.star.x, point.y - record.star.y))
      )
    );

    expect(nextKey).not.toBe("aries");
    expect(nearestDistance).toBeGreaterThanOrEqual(34);
  });

  test("falls back to the least-colliding constellation instead of returning the current one", () => {
    const nextKey = chooseNextConstellationKey({
      currentKey: "aries",
      viewportWidth: 1200,
      viewportHeight: 800,
      records: Array.from({ length: 8 }).map((_, index) => ({
        star: { x: 120 + index * 120, y: 220 }
      })),
      minDistance: 220,
      random: () => 0
    });

    expect(nextKey).not.toBe("aries");
  });

  test("chooses a constellation layout whose occupied box avoids completed constellations", () => {
    const occupiedLayout = {
      id: "occupied-left",
      x: 180,
      y: 110,
      width: 260,
      height: 180
    };
    const ariesNodes = projectConstellationNodes(getConstellationByKey("aries"), null, 1200, 800, occupiedLayout);
    const records = ariesNodes.map((node, index) => ({
      star: {
        x: node.x,
        y: node.y,
        constellationKey: "aries",
        constellationNodeId: node.id,
        constellationIndex: index,
        constellationLayout: occupiedLayout
      }
    }));

    const layout = chooseConstellationLayout({
      constellation: getConstellationByKey("gemini"),
      records,
      viewportWidth: 1200,
      viewportHeight: 800,
      random: () => 0
    });
    const geminiNodes = projectConstellationNodes(getConstellationByKey("gemini"), null, 1200, 800, layout);

    expect(layout).toEqual(expect.objectContaining({ id: expect.any(String) }));
    expect(getBoxOverlapArea(getProjectedNodeBounds(ariesNodes), getProjectedNodeBounds(geminiNodes))).toBe(0);
  });
});
