import { emotionConfig, getEmotionLabel } from "../config/emotionConfig";
import { resolveStarRenderPosition } from "../utils/starCoordinates";

export default function DriftStarItem({ star, onClick, sceneSize, skyBounds, legacyRatioCache }) {
  const config = emotionConfig[star.emotion] || emotionConfig.calm;
  const starX = star.star_x ?? star.starX ?? star.x;
  const starY = star.star_y ?? star.starY ?? star.y;
  const constellationKey = star.constellation_key || star.constellationKey || "";
  const sourceType = star.sourceType || (star.driftDirection === "sent" ? "sentDrift" : "receivedDrift");

  const position = resolveStarRenderPosition(
    { id: star.id, x: starX, y: starY, constellationKey },
    { ...sceneSize, skyBounds, constellationKey, legacyRatioCache }
  );

  const style = {
    left: `${position.xRatio * 100}%`,
    top: `${position.yRatio * 100}%`,
    "--star-color": config.starColor
  };

  return (
    <button
      className={`star-item star-item--drifting drift-source-${sourceType}`}
      type="button"
      style={style}
      onClick={() => onClick(star)}
      aria-label={`查看漂流星星：${getEmotionLabel(star.emotion)}`}
    >
      <img src={config.star} alt="" aria-hidden="true" />
      <span className="drift-star-badge" aria-hidden="true">🫧</span>
    </button>
  );
}
