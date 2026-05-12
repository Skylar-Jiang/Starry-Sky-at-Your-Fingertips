import { getConstellationByKey } from "../config/presetConstellationConfig";
import {
  indexProjectedNodesById,
  logConstellationProjection,
  projectConstellationNodes
} from "../utils/constellationProjection";

function getViewportSize() {
  if (typeof window === "undefined") return { width: 1200, height: 800 };
  return { width: window.innerWidth, height: window.innerHeight };
}

function groupRecordsByConstellation(records = [], activeConstellationKey) {
  const groups = new Map();
  for (const record of records) {
    if (!record?.star) continue;
    const key = record.star.constellationKey || activeConstellationKey;
    const group = groups.get(key) || [];
    group.push(record);
    groups.set(key, group);
  }
  return [...groups.entries()].map(([key, groupRecords]) => ({
    constellation: getConstellationByKey(key),
    records: groupRecords.sort((a, b) => (a.star.constellationIndex ?? 0) - (b.star.constellationIndex ?? 0))
  }));
}

function getGroupLayout(records = []) {
  return records.find((record) => record?.star?.constellationLayout)?.star.constellationLayout || null;
}

export default function PresetConstellationLayer({
  records = [],
  mode = "main",
  constellationKey,
  skyBounds
}) {
  const activeConstellation = getConstellationByKey(constellationKey);
  const { width, height } = getViewportSize();
  const visibleGroups = groupRecordsByConstellation(records, activeConstellation.key)
    .map(({ constellation, records: litRecords }) => {
      const isCompleted = litRecords.length >= constellation.requiredStarCount;
      const shouldShowOutline = isCompleted || litRecords.length >= constellation.outlineRevealThreshold;
      if (!shouldShowOutline) return null;

      const projectedNodes = projectConstellationNodes(
        constellation,
        skyBounds,
        width,
        height,
        getGroupLayout(litRecords)
      );
      const projectedNodesById = indexProjectedNodesById(projectedNodes);
      const filledNodeIds = litRecords
        .map((record) => record.star.constellationNodeId)
        .filter(Boolean);

      logConstellationProjection("outline projectedNodes", {
        constellation,
        projectedNodes,
        filledNodeIds,
        edges: constellation.edges
      });

      return {
        constellation,
        litRecords,
        projectedNodesById,
        isCompleted
      };
    })
    .filter(Boolean);

  if (!visibleGroups.length) return null;

  const activeGroup = visibleGroups.find((group) => group.constellation.key === activeConstellation.key);

  return (
    <div
      className={`preset-constellation-layer preset-constellation-${mode}`}
      aria-label="constellation outlines"
      data-constellation-key={activeConstellation.key}
      data-lit-count={activeGroup?.litRecords.length || 0}
    >
      <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
        {visibleGroups.map(({ constellation, litRecords, projectedNodesById, isCompleted }) => (
          <g
            key={constellation.key}
            className={`preset-constellation-outline ${isCompleted ? "is-completed" : "is-forming"}`}
            data-constellation-key={constellation.key}
            data-state={isCompleted ? "completed" : "forming"}
          >
            {constellation.edges.map(([from, to]) => {
              const projectedFrom = projectedNodesById[from];
              const projectedTo = projectedNodesById[to];
              if (!projectedFrom || !projectedTo) return null;

              const isAnchored =
                litRecords.some(
                  (record) =>
                    record.star.constellationNodeId === from || record.star.constellationIndex === projectedFrom.index
                ) ||
                litRecords.some(
                  (record) =>
                    record.star.constellationNodeId === to || record.star.constellationIndex === projectedTo.index
                );

              return (
                <line
                  key={`${constellation.key}-${from}-${to}`}
                  className={isAnchored ? "is-anchored" : ""}
                  x1={projectedFrom.x}
                  y1={projectedFrom.y}
                  x2={projectedTo.x}
                  y2={projectedTo.y}
                />
              );
            })}
          </g>
        ))}
        <g className="preset-constellation-points" />
      </svg>
      {activeGroup && !activeGroup.isCompleted ? <p>{activeConstellation.label} forming</p> : null}
    </div>
  );
}
