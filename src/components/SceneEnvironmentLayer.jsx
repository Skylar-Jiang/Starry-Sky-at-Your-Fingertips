export default function SceneEnvironmentLayer({ composition }) {
  const sceneKey = composition?.sceneKey || "lullaby";

  return (
    <div className={`scene-environment-layer scene-environment-${sceneKey}`} aria-hidden="true">
      <div className={`environment-color-wash ${composition?.colorWashClassName || ""}`} />
    </div>
  );
}
