import { render } from "@testing-library/react";
import { describe, expect, test } from "vitest";
import PresetConstellationLayer from "../components/PresetConstellationLayer";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import { projectConstellationNodes } from "../utils/constellationProjection";

function buildRecords(key, layout, count) {
  const constellation = getConstellationByKey(key);
  return projectConstellationNodes(constellation, null, 1200, 800, layout)
    .slice(0, count)
    .map((node, index) => ({
      id: `${key}-${node.id}`,
      star: {
        id: `${key}-star-${node.id}`,
        x: node.x,
        y: node.y,
        constellationKey: key,
        constellationNodeId: node.id,
        constellationIndex: index,
        constellationLayout: layout
      }
    }));
}

describe("PresetConstellationLayer", () => {
  test("keeps completed constellations as solid outlines while drawing the active constellation as dashed", () => {
    const completedLayout = { id: "slot-complete", x: 160, y: 110, width: 260, height: 180 };
    const formingLayout = { id: "slot-forming", x: 580, y: 120, width: 260, height: 180 };
    const records = [
      ...buildRecords("aries", completedLayout, getConstellationByKey("aries").requiredStarCount),
      ...buildRecords("gemini", formingLayout, getConstellationByKey("gemini").outlineRevealThreshold)
    ];

    render(<PresetConstellationLayer records={records} constellationKey="gemini" />);

    const completedOutline = document.querySelector(
      '.preset-constellation-outline[data-constellation-key="aries"]'
    );
    const formingOutline = document.querySelector(
      '.preset-constellation-outline[data-constellation-key="gemini"]'
    );

    expect(completedOutline.classList.contains("is-completed")).toBe(true);
    expect(formingOutline.classList.contains("is-forming")).toBe(true);
    expect(completedOutline.querySelectorAll("line").length).toBe(getConstellationByKey("aries").edges.length);
    expect(formingOutline.querySelectorAll("line").length).toBe(getConstellationByKey("gemini").edges.length);
  });
});
