import PresetConstellationLayer from "./PresetConstellationLayer";
import StarLayer from "./StarLayer";

export default function ConstellationView({ records, onSelectStar, constellationKey, skyBounds, sceneSize }) {
  if (!records.length) {
    return (
      <section className="constellation-view" role="region" aria-label="观测星空">
        <p className="constellation-empty">还没有可观测的星星。</p>
      </section>
    );
  }

  return (
    <section className="constellation-view" role="region" aria-label="观测星空">
      <PresetConstellationLayer
        records={records}
        mode="observation"
        constellationKey={constellationKey}
        skyBounds={skyBounds}
        sceneSize={sceneSize}
      />
      <StarLayer
        records={records}
        onSelectStar={onSelectStar}
        sceneSize={sceneSize}
        skyBounds={skyBounds}
        constellationKey={constellationKey}
      />
    </section>
  );
}
