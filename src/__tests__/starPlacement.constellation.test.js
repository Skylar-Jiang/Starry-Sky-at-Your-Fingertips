import { describe, expect, test } from "vitest";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import { getBoxOverlapArea, getProjectedNodeBounds, projectConstellationNodes } from "../utils/constellationProjection";
import { createStarPlacement } from "../utils/starPlacement";

describe("constellation star placement", () => {
  test("randomly picks one unfilled preset node and snaps to its exact projected coordinates", () => {
    const projectedNodesById = Object.fromEntries(
      projectConstellationNodes(getConstellationByKey("aries"), null, 1200, 800).map((node) => [node.id, node])
    );
    const star = createStarPlacement({
      viewportWidth: 1200,
      viewportHeight: 800,
      existingStars: [
        {
          id: "r1",
          star: {
            x: projectedNodesById.a1.x,
            y: projectedNodesById.a1.y,
            constellationKey: "aries",
            constellationNodeId: "a1",
            constellationIndex: 0
          }
        },
        {
          id: "r2",
          star: {
            x: projectedNodesById.a3.x,
            y: projectedNodesById.a3.y,
            constellationKey: "aries",
            constellationNodeId: "a3",
            constellationIndex: 2
          }
        }
      ],
      emotion: "calm",
      constellationKey: "aries",
      random: () => 0.99
    });

    expect(star).toEqual(
      expect.objectContaining({
        x: projectedNodesById.a4.x,
        y: projectedNodesById.a4.y,
        constellationKey: "aries",
        constellationNodeId: "a4",
        constellationIndex: 3
      })
    );
  });

  test("does not create extra constellation stars after every preset node is filled", () => {
    const star = createStarPlacement({
      viewportWidth: 1200,
      viewportHeight: 800,
      existingStars: ["a1", "a2", "a3", "a4"].map((nodeId, index) => ({
        id: `r${index}`,
        star: {
          x: 0,
          y: 0,
          constellationKey: "aries",
          constellationNodeId: nodeId,
          constellationIndex: index
        }
      })),
      emotion: "calm",
      constellationKey: "aries",
      random: () => 0.5
    });

    expect(star).toBeNull();
  });

  test("keeps one layout for a forming constellation and picks a non-overlapping layout for a new one", () => {
    const ariesLayout = {
      id: "occupied-left",
      x: 180,
      y: 110,
      width: 260,
      height: 180
    };
    const ariesNodes = projectConstellationNodes(getConstellationByKey("aries"), null, 1200, 800, ariesLayout);
    const existingStars = ariesNodes.map((node, index) => ({
      id: `aries-${node.id}`,
      star: {
        x: node.x,
        y: node.y,
        constellationKey: "aries",
        constellationNodeId: node.id,
        constellationIndex: index,
        constellationLayout: ariesLayout
      }
    }));

    const firstGemini = createStarPlacement({
      viewportWidth: 1200,
      viewportHeight: 800,
      existingStars,
      emotion: "calm",
      constellationKey: "gemini",
      random: () => 0
    });
    const geminiNodes = projectConstellationNodes(
      getConstellationByKey("gemini"),
      null,
      1200,
      800,
      firstGemini.constellationLayout
    );
    const selectedGeminiNode = geminiNodes.find((node) => node.id === firstGemini.constellationNodeId);

    expect(firstGemini.constellationLayout).toEqual(expect.objectContaining({ id: expect.any(String) }));
    expect(firstGemini.x).toBe(selectedGeminiNode.x);
    expect(firstGemini.y).toBe(selectedGeminiNode.y);
    expect(
      getBoxOverlapArea(getProjectedNodeBounds(ariesNodes), getProjectedNodeBounds(geminiNodes))
    ).toBe(0);

    const secondGemini = createStarPlacement({
      viewportWidth: 1200,
      viewportHeight: 800,
      existingStars: [...existingStars, { id: "gemini-1", star: firstGemini }],
      emotion: "calm",
      constellationKey: "gemini",
      random: () => 0
    });

    expect(secondGemini.constellationLayout).toEqual(firstGemini.constellationLayout);
  });
});
