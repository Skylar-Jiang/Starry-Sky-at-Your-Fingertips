import { emotionConfig, getEmotionLabel } from "../config/emotionConfig";
import { resolveStarRenderPosition } from "../utils/starCoordinates";

export default function StarItem({
  record,
  onClick,
  sceneSize,
  skyBounds,
  constellationKey,
  legacyRatioCache
}) {
  const config = emotionConfig[record.emotion] || emotionConfig.calm;
  const position = resolveStarRenderPosition(record.star, {
    ...sceneSize,
    skyBounds,
    constellationKey,
    legacyRatioCache
  });
  const style = {
    left: `${position.xRatio * 100}%`,
    top: `${position.yRatio * 100}%`,
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
      <img src={config.star} alt="" aria-hidden="true" />
    </button>
  );
}
