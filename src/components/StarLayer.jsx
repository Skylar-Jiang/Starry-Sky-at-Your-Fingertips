import { useRef } from "react";
import StarItem from "./StarItem";

export default function StarLayer({ records, onSelectStar, sceneSize, skyBounds, constellationKey }) {
  const legacyRatioCache = useRef(new Map());

  return (
    <div className="star-layer" aria-label="星星层">
      {records.map((record) => (
        <StarItem
          key={record.id}
          record={record}
          onClick={onSelectStar}
          sceneSize={sceneSize}
          skyBounds={skyBounds}
          constellationKey={constellationKey}
          legacyRatioCache={legacyRatioCache.current}
        />
      ))}
    </div>
  );
}
