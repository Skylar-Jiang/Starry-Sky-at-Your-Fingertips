import EmotionConstellationMap from "./EmotionConstellationMap";
import StarItem from "./StarItem";

export default function ConstellationView({ records, onSelectStar }) {
  if (!records.length) {
    return (
      <section className="constellation-view" role="region" aria-label="观测星空">
        <p className="constellation-empty">还没有可观测的星星。</p>
      </section>
    );
  }

  return (
    <section className="constellation-view" role="region" aria-label="观测星空">
      <EmotionConstellationMap records={records} />

      <div className="constellation-stars" aria-label="观测星星层">
        {records.map((record) => (
          <StarItem key={record.id} record={record} onClick={onSelectStar} />
        ))}
      </div>
    </section>
  );
}
