import SceneEffects from "./SceneEffects";

export default function SceneEffectLayer({ emotion, composition }) {
  return (
    <div className={`scene-effect-layer scene-effect-${composition?.sceneKey || "none"}`} aria-hidden="true">
      <SceneEffects emotion={emotion} preset={composition?.effectPreset} />
    </div>
  );
}
