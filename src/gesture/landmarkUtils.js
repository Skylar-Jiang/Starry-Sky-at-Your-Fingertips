const FINGER_TIPS = [8, 12, 16, 20];
const ALL_TIPS = [4, 8, 12, 16, 20];

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

export function getPalmSize(landmarks = []) {
  const wristToMiddle = landmarkDistance(landmarks[0], landmarks[9]);
  const palmWidth = landmarkDistance(landmarks[5], landmarks[17]);
  const size = Math.max(wristToMiddle, palmWidth);
  return Number.isFinite(size) && size > 0 ? size : 0.001;
}

export function getThumbIndexRatio(landmarks = []) {
  return landmarkDistance(landmarks[4], landmarks[8]) / getPalmSize(landmarks);
}

export function getPinchMidpoint(landmarks = []) {
  if (!landmarks[4] || !landmarks[8]) return null;
  return {
    x: (landmarks[4].x + landmarks[8].x) / 2,
    y: (landmarks[4].y + landmarks[8].y) / 2,
    z: ((landmarks[4].z || 0) + (landmarks[8].z || 0)) / 2
  };
}

function isFingerExtended(landmarks, tipIndex, mcpIndex) {
  const tip = landmarks[tipIndex];
  const mcp = landmarks[mcpIndex];
  return Boolean(tip && mcp && tip.y < mcp.y - getPalmSize(landmarks) * 0.18);
}

export function calculateHandShape(landmarks = [], config = {}) {
  const palmCenter = getPalmCenter(landmarks);
  const palmSize = getPalmSize(landmarks);
  const averageTipDistance =
    ALL_TIPS.reduce((total, index) => total + landmarkDistance(landmarks[index], palmCenter), 0) / ALL_TIPS.length;
  const fistScore = Math.max(0, Math.min(1, 1 - averageTipDistance / (palmSize * 1.65)));
  const extended = {
    index: isFingerExtended(landmarks, 8, 5),
    middle: isFingerExtended(landmarks, 12, 9),
    ring: isFingerExtended(landmarks, 16, 13),
    pinky: isFingerExtended(landmarks, 20, 17)
  };
  const extendedCount = Object.values(extended).filter(Boolean).length;
  const openScore = extendedCount / FINGER_TIPS.length;
  const thumbIndexRatio = getThumbIndexRatio(landmarks);
  const isOk =
    thumbIndexRatio < (config.thumbIndexRatio || 0.35) &&
    (!config.requireOtherFingersExtended || (extended.middle && extended.ring && extended.pinky));
  const isPinching = thumbIndexRatio < (config.pinchRatio || 0.42);
  const isPointing = extended.index && !extended.middle && !extended.ring && !extended.pinky;
  const isVictory = extended.index && extended.middle && !extended.ring && !extended.pinky;
  const isWishPose = isVictory;
  const isOpen = openScore >= 0.75 && !isOk;
  const isFist = fistScore >= 0.55 && openScore <= 0.05 && !isPointing;

  return {
    fistScore,
    openScore,
    thumbIndexRatio,
    extended,
    isOk,
    isPinching,
    isPointing,
    isVictory,
    isWishPose,
    isOpen,
    isFist
  };
}

export function mapNormalizedPointToScreen(point, rect, { mirrorX = false } = {}) {
  if (!point || !rect) return null;
  const x = mirrorX ? 1 - point.x : point.x;
  return {
    x: (rect.left || 0) + x * (rect.width || 0),
    y: (rect.top || 0) + point.y * (rect.height || 0)
  };
}

export function resolvePointerPoint(landmarks = [], { status = "tracking" } = {}) {
  if (status === "fist" || status === "throwing") return getPalmCenter(landmarks);
  if (status === "pinching" || status === "ok") return getPinchMidpoint(landmarks);
  return landmarks[8] || getPalmCenter(landmarks);
}

export function classifyHands(rawHands = [], config = {}) {
  return rawHands
    .map((hand, index) => {
      const landmarks = Array.isArray(hand) ? hand : hand?.landmarks;
      if (!Array.isArray(landmarks) || landmarks.length < 21) return null;
      const handedness = hand?.handedness || hand?.categoryName || hand?.label || (index === 0 ? "unknown" : "unknown");
      return {
        handedness: String(handedness).toLowerCase(),
        landmarks,
        shape: calculateHandShape(landmarks, config)
      };
    })
    .filter(Boolean);
}

export function calculateVelocity(trajectory = [], windowMs = 450) {
  if (trajectory.length < 2) return { x: 0, y: 0, speed: 0 };
  const last = trajectory[trajectory.length - 1];
  const first =
    [...trajectory].reverse().find((point) => last.timestamp - point.timestamp >= Math.min(windowMs, 80)) || trajectory[0];
  const dt = Math.max((last.timestamp - first.timestamp) / 1000, 0.001);
  const vx = (last.x - first.x) / dt;
  const vy = (last.y - first.y) / dt;
  return { x: vx, y: vy, speed: Math.hypot(vx, vy) };
}

export function twoHandPrayerScore(classifiedHands = [], config = {}) {
  if (classifiedHands.length < 2) {
    return { handsCount: classifiedHands.length, isPraying: false, score: classifiedHands.length ? 0.28 : 0, reason: "needTwoHands" };
  }
  const [left, right] = [...classifiedHands].sort(
    (a, b) => (getPalmCenter(a.landmarks)?.x || 0) - (getPalmCenter(b.landmarks)?.x || 0)
  );
  const leftCenter = getPalmCenter(left.landmarks);
  const rightCenter = getPalmCenter(right.landmarks);
  const scale = (getPalmSize(left.landmarks) + getPalmSize(right.landmarks)) / 2;
  const distanceRatio = landmarkDistance(leftCenter, rightCenter) / scale;
  const heightDeltaRatio = Math.abs(leftCenter.y - rightCenter.y) / scale;
  const uprightScore = left.shape.openScore >= 0.75 && right.shape.openScore >= 0.75 ? 0.28 : 0.12;
  const closenessScore = Math.max(0, 1 - distanceRatio / (config.palmDistanceRatio || 1.6));
  const heightScore = Math.max(0, 1 - heightDeltaRatio / (config.heightDeltaRatio || 0.75));
  const score = Math.min(1, closenessScore * 0.54 + heightScore * 0.28 + uprightScore);
  return {
    handsCount: classifiedHands.length,
    isPraying: score >= 0.74,
    score,
    distanceRatio,
    heightDeltaRatio,
    reason: score >= 0.74 ? "praying" : distanceRatio > (config.palmDistanceRatio || 1.6) ? "tooFar" : "alignHands"
  };
}
