import { getEmotionLabel } from "../config/emotionConfig";
import { getSceneAssets } from "../config/sceneAssetConfig";

export default function CompanionLayer({ emotion }) {
  const assets = getSceneAssets(emotion);
  const label = getEmotionLabel(emotion);

  return (
    <div className={`companion-layer companion-layer-${emotion}`} aria-label={`${label}陪伴素材`}>
      <img className="companion-fox" src={assets.fox} alt={`${label}状态的狐狸`} />
      <img className="companion-rose" src={assets.rose} alt={`${label}状态的玫瑰`} />
    </div>
  );
}
