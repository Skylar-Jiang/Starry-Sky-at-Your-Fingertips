import { emotionConfig, getEmotionLabel } from "../config/emotionConfig";
import { characterVariants, defaultAvatarVariants, getVariantAsset } from "../config/avatarVariantConfig";

export default function CharacterActor({ emotion, placement, variantKey = defaultAvatarVariants.character, assetOverride }) {
  const config = emotionConfig[emotion] || emotionConfig.calm;
  const label = getEmotionLabel(emotion);
  const character = assetOverride || getVariantAsset(characterVariants, variantKey, emotion) || config.character;
  const style = placement
    ? {
        "--actor-x": `${placement.x}%`,
        "--actor-y": `${placement.y}%`,
        "--actor-width": `${placement.width}%`,
        left: `${placement.x}%`,
        bottom: `${100 - placement.y}%`,
        width: `${placement.width}%`
      }
    : undefined;

  return (
    <div className={`character-actor character-actor-${emotion}`} aria-label={`${label}角色状态`} style={style}>
      <img className="character-actor-image" src={character} alt={`${label}状态的小王子`} />
    </div>
  );
}
