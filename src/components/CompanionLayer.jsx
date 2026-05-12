import { getEmotionLabel } from "../config/emotionConfig";
import { getSceneAssets } from "../config/sceneAssetConfig";
import { defaultAvatarVariants, flowerVariants, getVariantAsset, petVariants } from "../config/avatarVariantConfig";

export default function CompanionLayer({
  emotion,
  companionPlacement,
  flowerPlacement,
  petVariantKey = defaultAvatarVariants.pet,
  flowerVariantKey = defaultAvatarVariants.flower,
  foxAssetOverride,
  roseAssetOverride
}) {
  const assets = getSceneAssets(emotion);
  const label = getEmotionLabel(emotion);
  const fox = foxAssetOverride || getVariantAsset(petVariants, petVariantKey, emotion) || assets.fox;
  const rose = roseAssetOverride || getVariantAsset(flowerVariants, flowerVariantKey, emotion) || assets.rose;
  const style = {
    "--companion-x": `${companionPlacement?.x ?? 68}%`,
    "--companion-y": `${companionPlacement?.y ?? 88}%`,
    "--companion-width": `${companionPlacement?.width ?? 12}%`,
    "--flower-x": `${flowerPlacement?.x ?? 32}%`,
    "--flower-y": `${flowerPlacement?.y ?? 88}%`,
    "--flower-width": `${flowerPlacement?.width ?? 8}%`
  };

  return (
    <div className={`companion-layer companion-layer-${emotion}`} aria-label={`${label}陪伴素材`} style={style}>
      <img
        className="companion-fox"
        src={fox}
        alt={`${label}状态的狐狸`}
        style={{
          left: `${companionPlacement?.x ?? 68}%`,
          bottom: `${100 - (companionPlacement?.y ?? 88)}%`
        }}
      />
      <img
        className="companion-rose"
        src={rose}
        alt={`${label}状态的玫瑰`}
        style={{
          left: `${flowerPlacement?.x ?? 32}%`,
          bottom: `${100 - (flowerPlacement?.y ?? 88)}%`
        }}
      />
    </div>
  );
}
