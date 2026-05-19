import { useEffect, useMemo, useState } from "react";
import { microInteractionConfig } from "../config/microInteractionConfig";

function seeded(seed, min, max) {
  const value = Math.sin(seed * 997.3) * 10000;
  const ratio = value - Math.floor(value);
  return min + ratio * (max - min);
}

function chooseShowerDirection(triggerKey) {
  const options = microInteractionConfig.meteor.directionOptions || ["down-left", "down-right"];
  const index = Math.floor(seeded(triggerKey * 17 + 3, 0, options.length));
  return options[Math.min(index, options.length - 1)] || "down-left";
}

function alternateDirection(direction) {
  return direction === "down-left" ? "down-right" : "down-left";
}

function createMeteor(index, triggerKey, mainDirection, dominantCount) {
  const seed = (index + 1) * 37 + triggerKey * 53;
  const direction = index < dominantCount ? mainDirection : alternateDirection(mainDirection);
  const longMeteor = index < (microInteractionConfig.meteor.longMeteorCount || 0);
  const jitter = seeded(seed + 67, -microInteractionConfig.meteor.directionJitterDeg, microInteractionConfig.meteor.directionJitterDeg);

  const startX = direction === "down-left" ? seeded(seed, 72, 112) : seeded(seed, -12, 38);
  const startY = seeded(seed + 5, -12, 32);
  const travelX = direction === "down-left"
    ? -seeded(seed + 11, longMeteor ? 54 : 34, longMeteor ? 92 : 70)
    : seeded(seed + 11, longMeteor ? 54 : 34, longMeteor ? 92 : 70);
  const travelY = seeded(seed + 17, longMeteor ? 54 : 38, longMeteor ? 96 : 78);
  const angleRad = Math.atan2(travelY, travelX) + (jitter * Math.PI) / 180;
  const distance = Math.sqrt(travelX * travelX + travelY * travelY);
  const dx = Math.cos(angleRad) * distance;
  const dy = Math.max(28, Math.sin(angleRad) * distance);
  const endX = startX + dx;
  const endY = startY + dy;
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;

  return {
    id: `meteor-${triggerKey}-${index}`,
    direction,
    startX,
    startY,
    endX,
    endY,
    dx,
    dy,
    angle,
    delay: `${(index * 0.18 + seeded(seed + 23, 0, 0.24)).toFixed(2)}s`,
    duration: `${(longMeteor ? 1.45 : 1.05) + seeded(seed + 31, 0, 0.44)}s`,
    length: `${longMeteor ? seeded(seed + 41, 150, 210) : seeded(seed + 41, 82, 142)}px`,
    opacity: (longMeteor ? 0.72 : 0.42) + seeded(seed + 47, 0, 0.18)
  };
}

function createMeteors(count, triggerKey) {
  const mainDirection = chooseShowerDirection(triggerKey);
  const dominantRatio = microInteractionConfig.meteor.dominantRatio ?? 0.86;
  const dominantCount = Math.max(1, Math.ceil(count * dominantRatio));
  return {
    mainDirection,
    meteors: Array.from({ length: count }, (_, index) => createMeteor(index, triggerKey, mainDirection, dominantCount))
  };
}

export default function MeteorShowerLayer({
  triggerKey = 0,
  active,
  count = microInteractionConfig.meteor.defaultCount,
  durationMs = microInteractionConfig.meteor.durationMs,
  reducedMotion = false,
  variant = "wish",
  onComplete
}) {
  const resolvedTriggerKey = triggerKey || (active ? 1 : 0);
  const [visibleKey, setVisibleKey] = useState(resolvedTriggerKey > 0 ? resolvedTriggerKey : 0);
  const visibleCount = reducedMotion ? Math.min(count, microInteractionConfig.meteor.reducedMotionCount) : count;
  const shower = useMemo(
    () => (visibleKey > 0 ? createMeteors(visibleCount, visibleKey) : { mainDirection: "", meteors: [] }),
    [visibleCount, visibleKey]
  );
  const { mainDirection, meteors } = shower;

  useEffect(() => {
    if (resolvedTriggerKey > 0) {
      setVisibleKey(resolvedTriggerKey);
    }
  }, [resolvedTriggerKey]);

  useEffect(() => {
    if (!visibleKey) return undefined;
    const timer = window.setTimeout(() => {
      setVisibleKey(0);
      onComplete?.();
    }, durationMs);
    return () => window.clearTimeout(timer);
  }, [durationMs, onComplete, visibleKey]);

  if (!visibleKey) return null;

  return (
    <div
      className={`meteor-shower-layer meteor-variant-${variant}`}
      data-main-direction={mainDirection}
      aria-hidden="true"
    >
      {meteors.map((meteor) => (
        <span
          key={meteor.id}
          data-meteor-id={meteor.id}
          data-direction={meteor.direction}
          data-dx={meteor.dx.toFixed(2)}
          data-dy={meteor.dy.toFixed(2)}
          data-start-x={meteor.startX.toFixed(2)}
          data-start-y={meteor.startY.toFixed(2)}
          data-end-x={meteor.endX.toFixed(2)}
          data-end-y={meteor.endY.toFixed(2)}
          className="meteor-streak"
          style={{
            "--meteor-start-x": `${meteor.startX}vw`,
            "--meteor-start-y": `${meteor.startY}vh`,
            "--meteor-end-x": `${meteor.endX}vw`,
            "--meteor-end-y": `${meteor.endY}vh`,
            "--meteor-angle": `${meteor.angle}deg`,
            "--meteor-length": meteor.length,
            opacity: meteor.opacity,
            animationDelay: meteor.delay,
            animationDuration: meteor.duration
          }}
        >
          <span className="meteor-tail" />
          <span className="meteor-head" />
        </span>
      ))}
    </div>
  );
}
