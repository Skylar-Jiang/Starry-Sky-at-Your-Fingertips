import { Sparkle } from "lucide-react";
import { emotionConfig, getEmotionLabel } from "../config/emotionConfig";

export default function StarItem({ record, onClick }) {
  const config = emotionConfig[record.emotion] || emotionConfig.calm;
  const style = {
    left: `${record.star.x}px`,
    top: `${record.star.y}px`,
    "--star-color": config.starColor
  };

  return (
    <button
      className="star-item"
      type="button"
      style={style}
      onClick={() => onClick(record)}
      aria-label={`查看星星：${getEmotionLabel(record.emotion)}`}
    >
      <Sparkle size={28} fill="currentColor" />
      <span>{config.star.replace("/assets/objects/", "")}</span>
    </button>
  );
}
