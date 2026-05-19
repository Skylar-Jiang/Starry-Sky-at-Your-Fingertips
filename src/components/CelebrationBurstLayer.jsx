import { useEffect, useMemo } from "react";
import { microInteractionConfig } from "../config/microInteractionConfig";

function normalizeOrigin(origin) {
  if (origin && typeof origin === "object") {
    return { x: `${origin.x}px`, y: `${origin.y}px` };
  }
  if (origin === "star") return { x: "56%", y: "30%" };
  return { x: "50%", y: "28%" };
}

function createParticles(count) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (360 / count) * index;
    const distance = 42 + (index % 5) * 9;
    return {
      id: `celebration-${index}`,
      angle,
      distance,
      size: 4 + (index % 4),
      delay: `${(index % 6) * 0.035}s`
    };
  });
}

export default function CelebrationBurstLayer({
  active,
  origin = "center",
  variant = "soft",
  reducedMotion = false,
  onComplete
}) {
  const particleCount = reducedMotion
    ? microInteractionConfig.celebration.reducedMotionParticleCount
    : microInteractionConfig.celebration.defaultParticleCount;
  const particles = useMemo(() => createParticles(particleCount), [particleCount, active]);
  const normalizedOrigin = normalizeOrigin(origin);

  useEffect(() => {
    if (!active) return undefined;
    const timer = window.setTimeout(() => {
      onComplete?.();
    }, microInteractionConfig.celebration.durationMs);
    return () => window.clearTimeout(timer);
  }, [active, onComplete]);

  if (!active) return null;

  return (
    <div
      className={`celebration-burst-layer celebration-variant-${variant}`}
      aria-hidden="true"
      style={{ "--burst-x": normalizedOrigin.x, "--burst-y": normalizedOrigin.y }}
    >
      {particles.map((particle) => (
        <span
          key={particle.id}
          className="celebration-particle"
          style={{
            "--particle-angle": `${particle.angle}deg`,
            "--particle-distance": `${particle.distance}px`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animationDelay: particle.delay
          }}
        />
      ))}
    </div>
  );
}
