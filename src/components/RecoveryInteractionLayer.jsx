import { useEffect, useMemo, useState } from "react";
import { getRecoveryInteractionConfig, recoveryPointPositions } from "../config/recoveryInteractionConfig";

export default function RecoveryInteractionLayer({ emotion, active, targetStar, onComplete }) {
  const config = getRecoveryInteractionConfig(emotion);
  const [resolvedIds, setResolvedIds] = useState([]);
  const [isComplete, setIsComplete] = useState(false);

  const points = useMemo(
    () =>
      recoveryPointPositions.slice(0, config.count).map((position, index) => ({
        ...position,
        id: `${emotion || "calm"}-${index}`
      })),
    [config.count, emotion]
  );

  useEffect(() => {
    setResolvedIds([]);
    setIsComplete(false);
  }, [emotion, active]);

  useEffect(() => {
    if (!isComplete) return undefined;
    const timer = window.setTimeout(() => {
      onComplete?.();
    }, 1100);
    return () => window.clearTimeout(timer);
  }, [isComplete, onComplete]);

  if (!active || !config) return null;

  function handleResolve(pointId) {
    if (isComplete || resolvedIds.includes(pointId)) return;

    const nextResolvedIds = [...resolvedIds, pointId];
    setResolvedIds(nextResolvedIds);
    if (nextResolvedIds.length >= config.requiredCount) {
      setIsComplete(true);
    }
  }

  const targetX = targetStar?.x || 72;
  const targetY = targetStar?.y || 28;
  const progressText = `${config.progressLabel} ${Math.min(resolvedIds.length, config.requiredCount)}/${config.requiredCount}`;

  return (
    <div
      className={`recovery-interaction-layer ${config.sceneClassName} ${isComplete ? "is-complete" : ""}`}
      aria-label="点击恢复平静"
      style={{ "--target-x": `${targetX}px`, "--target-y": `${targetY}px` }}
    >
      <div className="recovery-guidance">
        <p>{isComplete ? config.completedText : config.promptText}</p>
        {!isComplete ? <span>{progressText}</span> : null}
      </div>
      {points.map((point) => {
        const isResolved = resolvedIds.includes(point.id);

        return (
          <button
            key={point.id}
            className={`recovery-object ${config.className} ${isResolved ? "is-resolved" : ""}`}
            type="button"
            style={{ left: `${point.x}%`, top: `${point.y}%`, "--i": point.id.split("-").at(-1) }}
            onClick={() => handleResolve(point.id)}
            aria-label={`${config.actionLabel} ${Number(point.id.split("-").at(-1)) + 1}`}
            disabled={isResolved}
          >
            <img src={isResolved ? config.resolvedAsset : config.asset} alt="" aria-hidden="true" />
            <span className="recovery-object-dust" />
          </button>
        );
      })}
    </div>
  );
}
