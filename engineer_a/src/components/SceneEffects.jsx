import { emotionConfig } from "../config/emotionConfig";

export default function SceneEffects({ emotion }) {
  const effects = emotionConfig[emotion]?.effects || [];

  return (
    <div className="effects-layer" aria-hidden="true">
      {effects.includes("rain") ? <span className="effect-label">assets/effects/rain_drop.png</span> : null}
      {effects.includes("glow") ? <span className="effect-label">assets/effects/glow_particle.png</span> : null}
      {effects.includes("rain")
        ? Array.from({ length: 18 }).map((_, index) => (
            <span className="rain-drop" key={`rain-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {effects.includes("glow")
        ? Array.from({ length: 14 }).map((_, index) => (
            <span className="glow-dot" key={`glow-${index}`} style={{ "--i": index }} />
          ))
        : null}
    </div>
  );
}
