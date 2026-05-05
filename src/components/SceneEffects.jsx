import { emotionConfig } from "../config/emotionConfig";

export default function SceneEffects({ emotion }) {
  const effects = emotionConfig[emotion]?.effects || [];

  return (
    <div className="effects-layer" aria-hidden="true">
      {effects.includes("rain")
        ? Array.from({ length: 32 }).map((_, index) => (
            <span className="rain-drop" key={`rain-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {effects.includes("glow")
        ? Array.from({ length: 24 }).map((_, index) => (
            <span className="glow-dot" key={`glow-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {effects.includes("softGlow")
        ? Array.from({ length: 12 }).map((_, index) => (
            <span className="soft-glow-dot" key={`soft-glow-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {effects.includes("spark")
        ? Array.from({ length: 18 }).map((_, index) => (
            <span className="spark-particle" key={`spark-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {effects.includes("dust")
        ? Array.from({ length: 18 }).map((_, index) => (
            <span className="dust-bubble" key={`dust-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {effects.includes("tearLakeHint") ? <span className="tear-lake-hint" /> : null}
    </div>
  );
}
