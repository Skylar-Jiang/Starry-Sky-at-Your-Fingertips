import { emotionConfig } from "../config/emotionConfig";

export default function SceneEffects({ emotion, preset }) {
  const effects = emotionConfig[emotion]?.effects || [];
  const activeEffects = new Set(effects);
  if (preset === "rain") activeEffects.add("rain");
  if (preset === "campfire") activeEffects.add("spark");
  if (preset === "waves") activeEffects.add("softGlow");
  if (preset === "lullaby") activeEffects.add("glow");

  return (
    <div className={`effects-layer effects-preset-${preset || "none"}`} aria-hidden="true">
      {activeEffects.has("rain")
        ? Array.from({ length: 32 }).map((_, index) => (
            <span className="rain-drop" key={`rain-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {activeEffects.has("glow")
        ? Array.from({ length: 24 }).map((_, index) => (
            <span className="glow-dot" key={`glow-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {activeEffects.has("softGlow")
        ? Array.from({ length: 12 }).map((_, index) => (
            <span className="soft-glow-dot" key={`soft-glow-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {activeEffects.has("spark")
        ? Array.from({ length: 18 }).map((_, index) => (
            <span className="spark-particle" key={`spark-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {activeEffects.has("dust")
        ? Array.from({ length: 18 }).map((_, index) => (
            <span className="dust-bubble" key={`dust-${index}`} style={{ "--i": index }} />
          ))
        : null}
      {activeEffects.has("tearLakeHint") ? <span className="tear-lake-hint" /> : null}
    </div>
  );
}
