import { useRef } from "react";
import DriftStarItem from "./DriftStarItem";

export default function DriftStarLayer({
  driftingStars,
  onSelectStar,
  onPickup,
  sceneSize,
  skyBounds
}) {
  const legacyRatioCache = useRef(new Map());

  if (!driftingStars || driftingStars.length === 0) return null;

  return (
    <div className="drift-star-layer" aria-label="漂流星星层">
      {driftingStars.map((star) => (
        <DriftStarItem
          key={star.id}
          star={star}
          onClick={onSelectStar}
          onPickup={onPickup}
          sceneSize={sceneSize}
          skyBounds={skyBounds}
          legacyRatioCache={legacyRatioCache.current}
        />
      ))}
    </div>
  );
}
