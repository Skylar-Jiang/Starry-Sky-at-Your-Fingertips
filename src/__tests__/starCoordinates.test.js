import { describe, expect, test } from "vitest";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import {
  getConstellationLayoutCandidates,
  projectConstellationNodes
} from "../utils/constellationProjection";
import { resolveStarRenderPosition } from "../utils/starCoordinates";

describe("star render coordinates", () => {
  test("keeps a saved constellation star aligned to the same node after scene resize", () => {
    const oldLayout = getConstellationLayoutCandidates(null, 1200, 800)[0];
    const oldNode = projectConstellationNodes(getConstellationByKey("aries"), null, 1200, 800, oldLayout)[0];
    const star = {
      x: oldNode.x,
      y: oldNode.y,
      constellationKey: "aries",
      constellationNodeId: oldNode.id,
      constellationIndex: oldNode.index,
      constellationLayout: oldLayout
    };

    const position = resolveStarRenderPosition(star, {
      width: 2000,
      height: 1000
    });
    const expectedNode = projectConstellationNodes(getConstellationByKey("aries"), null, 2000, 1000, {
      id: oldLayout.id
    }).find((node) => node.id === oldNode.id);

    expect(position).toEqual(
      expect.objectContaining({
        x: expectedNode.x,
        y: expectedNode.y
      })
    );
    expect(position.xRatio).toBeCloseTo(expectedNode.x / 2000);
    expect(position.yRatio).toBeCloseTo(expectedNode.y / 1000);
  });
});
