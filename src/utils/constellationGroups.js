import { constellationConfig } from "../config/constellationConfig";

export function getEmotionConstellationConfigs() {
  return Object.values(constellationConfig).filter((config) => config.emotion);
}

export function emotionHasConstellation(records, emotion) {
  const config = getEmotionConstellationConfigs().find((item) => item.emotion === emotion);
  if (!config) return false;
  return records.filter((record) => record.emotion === emotion && record.star).length >= config.minimumStars;
}

export function buildEmotionConstellationGroups(records) {
  return getEmotionConstellationConfigs()
    .map((config) => {
      const emotionRecords = records.filter((record) => record.emotion === config.emotion && record.star);
      return {
        ...config,
        records: emotionRecords,
        active: emotionRecords.length >= config.minimumStars,
        linePoints: buildLinePoints(emotionRecords)
      };
    })
    .filter((group) => group.records.length);
}

export function buildLinePoints(records) {
  return records
    .slice(0, 8)
    .map((record) => `${record.star.x},${record.star.y}`)
    .join(" ");
}
