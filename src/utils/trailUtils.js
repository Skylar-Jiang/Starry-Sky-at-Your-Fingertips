export function distanceBetween(a, b) {
  if (!a || !b) return 0;
  return Math.hypot((b.x || 0) - (a.x || 0), (b.y || 0) - (a.y || 0));
}

export function smoothPoint(previous, current, smoothing = 0.35) {
  if (!previous) return { ...current };
  const currentWeight = Math.max(0, Math.min(1, smoothing));
  const previousWeight = 1 - currentWeight;
  return {
    x: previous.x * previousWeight + current.x * currentWeight,
    y: previous.y * previousWeight + current.y * currentWeight
  };
}

export function calculateTrailLength(points = []) {
  return points.reduce((length, point, index) => {
    if (index === 0) return 0;
    return length + distanceBetween(points[index - 1], point);
  }, 0);
}

export function trimTrailPoints(points = [], maxPoints = 56) {
  return points.length > maxPoints ? points.slice(points.length - maxPoints) : points;
}

export function buildTrailSegments(points = [], options = {}) {
  const minWidth = options.minWidth ?? 1.3;
  const maxWidth = options.maxWidth ?? 5.2;
  const minOpacity = options.minOpacity ?? 0.1;
  const maxOpacity = options.maxOpacity ?? 0.92;

  return points.slice(1).map((point, index) => {
    const segmentCount = Math.max(points.length - 1, 1);
    const ratio = segmentCount <= 1 ? 1 : index / (segmentCount - 1);
    const eased = ratio * ratio * (3 - 2 * ratio);
    return {
      id: `${points[index].id || index}-${point.id || index + 1}`,
      from: points[index],
      to: point,
      opacity: minOpacity + (maxOpacity - minOpacity) * eased,
      glowOpacity: (minOpacity + (maxOpacity - minOpacity) * eased) * 0.32,
      width: minWidth + (maxWidth - minWidth) * eased
    };
  });
}
