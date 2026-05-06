import { useState } from "react";
import { emotionConfig } from "../config/emotionConfig";

const starPoints = [
  { x: 18, y: 42 },
  { x: 38, y: 24 },
  { x: 58, y: 48 },
  { x: 78, y: 30 },
  { x: 66, y: 70 }
];

export default function RecoveryConstellationCue({ emotion, active, onComplete }) {
  const [isFading, setIsFading] = useState(false);
  const config = emotionConfig[emotion] || emotionConfig.calm;

  if (!active) return null;

  function handleClick() {
    if (isFading) return;
    setIsFading(true);
    window.setTimeout(() => {
      onComplete?.();
    }, 260);
  }

  return (
    <div className={isFading ? "recovery-constellation-cue is-fading" : "recovery-constellation-cue"}>
      <button
        className="recovery-constellation-button"
        type="button"
        onClick={handleClick}
        aria-label="点亮星空微光"
        style={{ "--cue-color": config.starColor, "--cue-accent": config.accentColor }}
      >
        <svg viewBox="0 0 96 96" aria-hidden="true" focusable="false">
          <polyline points="18,42 38,24 58,48 78,30 66,70 58,48" />
          {starPoints.map((point, index) => (
            <circle key={index} cx={point.x} cy={point.y} r={index === 1 ? 5 : 4} />
          ))}
        </svg>
      </button>
      <p>{emotion === "verySad" ? "点击泪湖座的光，让难过被星空收好" : "点击星空里的微光，让场景慢慢平静"}</p>
    </div>
  );
}
