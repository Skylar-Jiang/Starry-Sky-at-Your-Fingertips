import { createStarId } from "./id";
import { getConstellationByKey } from "../config/presetConstellationConfig";
import { logConstellationProjection, projectConstellationNodes } from "./constellationProjection";
import { chooseConstellationLayout } from "./constellationSelection";
import { addStarRatios } from "./starCoordinates";

const SAFE_AREA = {
  marginX: 120,
  top: 96,
  bottomRatio: 0.55,
  minDistance: 86,
  maxAttempts: 32
};

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getExistingStarPoints(existingStars = []) {
  return existingStars
    .map((item) => item?.star)
    .filter((star) => star && Number.isFinite(star.x) && Number.isFinite(star.y));
}

function hasEnoughDistance(candidate, points, minDistance) {
  return points.every((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y) >= minDistance);
}

function getFilledConstellationNodeState(existingStars = [], constellationKey) {
  const nodeIds = new Set();
  const indices = new Set();

  for (const record of existingStars) {
    const star = record?.star;
    if (!star || star.constellationKey !== constellationKey) continue;
    if (star.constellationNodeId) nodeIds.add(star.constellationNodeId);
    if (Number.isFinite(star.constellationIndex)) indices.add(star.constellationIndex);
  }

  return { nodeIds, indices };
}

function getExistingConstellationLayout(existingStars = [], constellationKey) {
  const record = existingStars.find((item) => item?.star?.constellationKey === constellationKey && item.star.constellationLayout);
  return record?.star?.constellationLayout || null;
}

function hasExistingConstellationStars(existingStars = [], constellationKey) {
  return existingStars.some((item) => item?.star?.constellationKey === constellationKey);
}

function createTemplateCandidate({ viewportWidth, viewportHeight, skyBounds, existingStars, random, constellationKey }) {
  const constellation = getConstellationByKey(constellationKey);
  const existingLayout = getExistingConstellationLayout(existingStars, constellation.key);
  const constellationLayout = existingLayout || (
    hasExistingConstellationStars(existingStars, constellation.key)
      ? null
      : chooseConstellationLayout({
          constellation,
          records: existingStars,
          skyBounds,
          viewportWidth,
          viewportHeight,
          random
        })
  );
  const projectedNodes = projectConstellationNodes(
    constellation,
    skyBounds,
    viewportWidth,
    viewportHeight,
    constellationLayout
  );
  const filled = getFilledConstellationNodeState(existingStars, constellation.key);
  const availableNodes = projectedNodes
    .filter((node) => !filled.nodeIds.has(node.id) && !filled.indices.has(node.index));

  logConstellationProjection("starPlacement projectedNodes", {
    constellation,
    projectedNodes,
    filledNodeIds: [...filled.nodeIds],
    edges: constellation.edges
  });

  if (!availableNodes.length) return null;

  const selectedIndex = Math.min(availableNodes.length - 1, Math.floor(random() * availableNodes.length));
  const selectedNode = availableNodes[selectedIndex];
  return addStarRatios({
    id: createStarId(),
    x: selectedNode.x,
    y: selectedNode.y,
    constellationKey: constellation.key,
    constellationNodeId: selectedNode.id,
    constellationIndex: selectedNode.index,
    constellationLayout
  }, { width: viewportWidth, height: viewportHeight });
}

export function createStarPlacement({
  viewportWidth,
  viewportHeight,
  existingStars = [],
  emotion,
  skyBounds,
  constellationKey,
  random = Math.random
} = {}) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 1200;
  const height = Number.isFinite(viewportHeight) ? viewportHeight : 800;
  const points = getExistingStarPoints(existingStars);
  const targetConstellationKey = constellationKey || "aries";
  if (emotion) {
    return createTemplateCandidate({
      viewportWidth: width,
      viewportHeight: height,
      skyBounds,
      existingStars,
      random,
      constellationKey: targetConstellationKey
    });
  }

  const minX = SAFE_AREA.marginX;
  const maxX = Math.max(minX, width - SAFE_AREA.marginX);
  const minY = SAFE_AREA.top;
  const maxY = Math.max(minY, Math.round(height * SAFE_AREA.bottomRatio));

  let bestCandidate = null;
  let bestDistance = -1;

  for (let attempt = 0; attempt < SAFE_AREA.maxAttempts; attempt += 1) {
    const candidate = {
      id: createStarId(),
      x: Math.round(minX + random() * (maxX - minX)),
      y: Math.round(minY + random() * (maxY - minY))
    };

    const nearestDistance = points.length
      ? Math.min(...points.map((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y)))
      : Infinity;

    if (nearestDistance > bestDistance) {
      bestCandidate = candidate;
      bestDistance = nearestDistance;
    }

    if (hasEnoughDistance(candidate, points, SAFE_AREA.minDistance)) {
      return addStarRatios(candidate, { width, height });
    }
  }

  return addStarRatios({
    ...bestCandidate,
    x: clamp(bestCandidate.x, minX, maxX),
    y: clamp(bestCandidate.y, minY, maxY)
  }, { width, height });
}
