import { emotionConfig, getEmotionLabel } from "../config/emotionConfig";
import { resolveStarRenderPosition } from "../utils/starCoordinates";

export default function DriftStarItem({
  star,
  onClick,
  sceneSize,
  skyBounds,
  legacyRatioCache
}) {
  const config = emotionConfig[star.emotion] || emotionConfig.calm;

  const position = resolveStarRenderPosition(
    { id: star.id, x: star.star_x, y: star.star_y, constellationKey: star.constellation_key },
    { ...sceneSize, skyBounds, constellationKey: star.constellation_key || "", legacyRatioCache }
  );

  const style = {
    left: `${position.xRatio * 100}%`,
    top: `${position.yRatio * 100}%`,
    "--star-color": config.starColor
  };

  return (
    <button
      className="star-item star-item--drifting"
      type="button"
      style={style}
      onClick={() => onClick(star)}
      aria-label={`查看漂流星：${getEmotionLabel(star.emotion)}`}
    >
      <img src={config.star} alt="" aria-hidden="true" />
      <span className="drift-star-badge" aria-hidden="true">🫧</span>
    </button>
  );
}
