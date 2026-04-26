import { emotionConfig, getEmotionLabel } from "../config/emotionConfig";

export default function CharacterActor({ emotion }) {
  const config = emotionConfig[emotion] || emotionConfig.calm;
  const label = getEmotionLabel(emotion);

  return (
    <div className={`character-actor character-actor-${emotion}`} aria-label={`${label}角色状态`}>
      <img className="character-actor-image" src={config.character} alt={`${label}状态的小王子`} />
    </div>
  );
}
