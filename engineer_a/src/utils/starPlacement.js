import { createStarId } from "./id";

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

export function createStarPlacement({
  viewportWidth,
  viewportHeight,
  existingStars = [],
  random = Math.random
} = {}) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 1200;
  const height = Number.isFinite(viewportHeight) ? viewportHeight : 800;
  const minX = SAFE_AREA.marginX;
  const maxX = Math.max(minX, width - SAFE_AREA.marginX);
  const minY = SAFE_AREA.top;
  const maxY = Math.max(minY, Math.round(height * SAFE_AREA.bottomRatio));
  const points = getExistingStarPoints(existingStars);

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
      return candidate;
    }
  }

  return {
    ...bestCandidate,
    x: clamp(bestCandidate.x, minX, maxX),
    y: clamp(bestCandidate.y, minY, maxY)
  };
}
