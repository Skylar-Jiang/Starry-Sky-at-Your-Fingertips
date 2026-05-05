import { useEffect, useMemo, useState } from "react";
import { recoveryInteractionConfig, recoveryPointPositions } from "../config/recoveryInteractionConfig";

export default function RecoveryInteractionLayer({ emotion, active }) {
  const config = recoveryInteractionConfig[emotion];
  const initialPoints = useMemo(
    () => recoveryPointPositions.slice(0, config?.count || 0).map((position, index) => ({ ...position, id: index })),
    [config]
  );
  const [points, setPoints] = useState(initialPoints);

  useEffect(() => {
    setPoints(initialPoints);
  }, [initialPoints, emotion]);

  if (!active || !config) return null;

  return (
    <div className="recovery-interaction-layer" aria-label="情绪恢复互动">
      {points.map((point) => (
        <button
          key={point.id}
          className={`recovery-point ${config.className}`}
          type="button"
          style={{ left: `${point.x}%`, top: `${point.y}%`, "--i": point.id }}
          onClick={() => setPoints((current) => current.filter((item) => item.id !== point.id))}
          aria-label={`${config.actionLabel} ${point.id + 1}`}
        >
          <span />
        </button>
      ))}
      {!points.length ? <p className="recovery-complete">{config.completedText}</p> : null}
    </div>
  );
}
