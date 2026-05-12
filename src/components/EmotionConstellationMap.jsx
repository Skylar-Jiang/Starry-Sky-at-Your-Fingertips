import { constellationConfig, shouldShowTearLake } from "../config/constellationConfig";
import { buildEmotionConstellationGroups, buildGlowPoints, buildSmoothLinePath } from "../utils/constellationGroups";

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
          <svg className="constellation-lines shared-tear-lines" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <path d={buildSmoothLinePath(tearLakeRecords)} />
            <g className="constellation-glow-points">
              {buildGlowPoints(tearLakeRecords).map((point, index) => (
                <circle key={`${point.x}-${point.y}-${index}`} cx={point.x} cy={point.y} r={point.radius} />
              ))}
            </g>
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
          <svg className="constellation-lines" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet">
            <path d={group.linePath} />
            <g className="constellation-glow-points">
              {group.glowPoints.map((point, pointIndex) => (
                <circle key={`${point.x}-${point.y}-${pointIndex}`} cx={point.x} cy={point.y} r={point.radius} />
              ))}
            </g>
          </svg>
        </div>
      ))}
    </div>
  );
}
