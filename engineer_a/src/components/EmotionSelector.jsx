import { emotionOptions } from "../config/emotionConfig";

export default function EmotionSelector({ value, onChange }) {
  return (
    <div className="emotion-selector" role="group" aria-label="选择情绪">
      {emotionOptions.map((emotion) => (
        <button
          className={emotion.key === value ? "emotion-option is-active" : "emotion-option"}
          key={emotion.key}
          type="button"
          onClick={() => onChange(emotion.key)}
          aria-pressed={emotion.key === value}
        >
          {emotion.label}
        </button>
      ))}
    </div>
  );
}
