import { getForegroundEmotionConfig, getForegroundSceneConfig } from "../config/foregroundMatrixConfig";

export default function SceneCharacterLayer({ emotion = "calm", composition }) {
  const sceneKey = composition?.sceneKey || "lullaby";
  const scene = getForegroundSceneConfig(sceneKey);
  const emotionState = getForegroundEmotionConfig(emotion);
  const completeComposite = scene.useCompleteEmotionComposite ? emotionState.campfireGroup : "";

  return (
    <div
      className={`scene-character-layer ${scene.className} ${emotionState.className}`}
      aria-label={`${emotionState.label} ${scene.label} foreground`}
    >
      <div className="scene-foreground-stage">
        {completeComposite ? (
          <img
            className="scene-complete-foreground"
            src={completeComposite}
            alt={`${emotionState.label} campfire foreground`}
          />
        ) : (
          <>
            <img className="scene-foreground-platform" src={scene.platform} alt="" aria-hidden="true" />
            <img
              className="scene-emotion-group"
              src={emotionState.group}
              alt={`${emotionState.label} prince fox rose group`}
            />
          </>
        )}
      </div>
    </div>
  );
}
