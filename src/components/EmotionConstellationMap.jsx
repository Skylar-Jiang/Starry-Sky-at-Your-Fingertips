import { constellationConfig, shouldShowTearLake } from "../config/constellationConfig";
import { buildEmotionConstellationGroups, buildLinePoints } from "../utils/constellationGroups";

export default function EmotionConstellationMap({ records }) {
  const groups = buildEmotionConstellationGroups(records).filter((group) => group.active);
  const tearLake = constellationConfig.tearLake;
  const tearLakeRecords = records.filter((record) => tearLake.emotions.includes(record.emotion));
  const showSharedTearLake = shouldShowTearLake(records);

  return (
    <div className="emotion-constellation-map">
      {showSharedTearLake ? (
        <>
          <img className="tear-lake-constellation" src={tearLake.image} alt={tearLake.label} />
          <svg className="constellation-lines shared-tear-lines" viewBox="0 0 520 260">
            <polyline points={buildLinePoints(tearLakeRecords)} />
          </svg>
        </>
      ) : null}

      {groups.map((group, index) => (
        <div
          key={group.emotion}
          className={`emotion-constellation emotion-constellation-${group.emotion}`}
          style={{
            "--constellation-color": group.lineColor,
            "--constellation-index": index
          }}
        >
          <img src={group.image} alt="" />
          <svg className="constellation-lines" viewBox="0 0 520 260">
            <polyline points={group.linePoints} />
          </svg>
        </div>
      ))}
    </div>
  );
}
