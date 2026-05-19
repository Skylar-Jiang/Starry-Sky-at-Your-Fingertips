export function landmarkDistance(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

export function getPalmCenter(landmarks = []) {
  const points = [0, 5, 9, 13, 17].map((index) => landmarks[index]).filter(Boolean);
  if (!points.length) return null;

  return points.reduce(
    (center, point) => ({
      x: center.x + point.x / points.length,
      y: center.y + point.y / points.length,
      z: center.z + (point.z || 0) / points.length
    }),
    { x: 0, y: 0, z: 0 }
  );
}

export function getHandScale(landmarks = []) {
  const wristToMiddle = landmarkDistance(landmarks[0], landmarks[9]);
  const palmWidth = landmarkDistance(landmarks[5], landmarks[17]);
  const scale = Math.max(wristToMiddle, palmWidth);
  return Number.isFinite(scale) && scale > 0 ? scale : 0.001;
}

export function detectPinch(
  landmarks = [],
  { previousPinching = false, startThreshold = 0.35, endThreshold = 0.48 } = {}
) {
  const palmSize = getHandScale(landmarks);
  const normalizedDistance = landmarkDistance(landmarks[4], landmarks[8]) / palmSize;
  const isPinching = previousPinching
    ? normalizedDistance < endThreshold
    : normalizedDistance < startThreshold;
  const midpoint =
    landmarks[4] && landmarks[8]
      ? {
          x: (landmarks[4].x + landmarks[8].x) / 2,
          y: (landmarks[4].y + landmarks[8].y) / 2,
          z: ((landmarks[4].z || 0) + (landmarks[8].z || 0)) / 2
        }
      : null;

  return { isPinching, normalizedDistance, midpoint };
}

function isUpright(landmarks = []) {
  const pairs = [
    [8, 5],
    [12, 9],
    [16, 13],
    [20, 17]
  ];
  const uprightCount = pairs.filter(([tip, mcp]) => landmarks[tip] && landmarks[mcp] && landmarks[tip].y < landmarks[mcp].y).length;
  return uprightCount >= 3;
}

export function detectPrayerGesture(
  hands = [],
  { maxPalmDistanceRatio = 1.5, maxPalmHeightDeltaRatio = 0.7, scoreThreshold = 0.75 } = {}
) {
  const validHands = hands.filter((hand) => Array.isArray(hand) && hand.length >= 18);
  if (validHands.length < 2) {
    return {
      handsCount: validHands.length,
      prayerScore: validHands.length === 1 ? 0.32 : 0,
      isPraying: false,
      reason: validHands.length === 1 ? "oneHand" : "noHands"
    };
  }

  const [left, right] = [...validHands].sort((a, b) => (getPalmCenter(a)?.x || 0) - (getPalmCenter(b)?.x || 0));
  const leftCenter = getPalmCenter(left);
  const rightCenter = getPalmCenter(right);
  const averageScale = (getHandScale(left) + getHandScale(right)) / 2;
  const palmDistanceRatio = landmarkDistance(leftCenter, rightCenter) / averageScale;
  const heightDeltaRatio = Math.abs(leftCenter.y - rightCenter.y) / averageScale;
  const uprightScore = (isUpright(left) ? 0.5 : 0) + (isUpright(right) ? 0.5 : 0);
  const closenessScore = Math.max(0, 1 - palmDistanceRatio / maxPalmDistanceRatio);
  const heightScore = Math.max(0, 1 - heightDeltaRatio / maxPalmHeightDeltaRatio);
  const prayerScore = Math.min(1, closenessScore * 0.5 + heightScore * 0.24 + uprightScore * 0.26);

  return {
    handsCount: validHands.length,
    prayerScore,
    isPraying: prayerScore >= scoreThreshold,
    palmDistanceRatio,
    heightDeltaRatio,
    reason:
      prayerScore >= scoreThreshold
        ? "praying"
        : palmDistanceRatio > maxPalmDistanceRatio
          ? "tooFar"
          : "handsReady"
  };
}

export function createPrayerHoldTracker({ holdMs = 1000, cooldownMs = 3000, scoreThreshold = 0.75 } = {}) {
  let holdStart = null;
  let lastTrigger = -Number.POSITIVE_INFINITY;

  return {
    update({ prayerScore = 0, timestamp = 0 }) {
      if (prayerScore >= scoreThreshold) {
        if (holdStart === null) holdStart = timestamp;
        const holdProgress = Math.min((timestamp - holdStart) / holdMs, 1);
        const triggered = holdProgress >= 1 && timestamp - lastTrigger >= cooldownMs;
        if (triggered) {
          lastTrigger = timestamp;
          holdStart = timestamp;
        }
        return { triggered, holdProgress };
      }

      holdStart = null;
      return { triggered: false, holdProgress: 0 };
    },
    reset() {
      holdStart = null;
    }
  };
}

export function mapLandmarkToElementPoint(point, rect, { mirrored = false } = {}) {
  return {
    x: (mirrored ? 1 - point.x : point.x) * rect.width,
    y: point.y * rect.height
  };
}
