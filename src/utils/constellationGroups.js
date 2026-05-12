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
        stage: getConstellationStage(emotionRecords.length, config.minimumStars),
        active: emotionRecords.length >= config.minimumStars,
        linePoints: buildLinePoints(emotionRecords),
        linePath: buildSmoothLinePath(emotionRecords),
        glowPoints: buildGlowPoints(emotionRecords)
      };
    })
    .filter((group) => group.records.length);
}

export function getConstellationStage(count, minimumStars = 3) {
  if (count >= minimumStars + 1) return "stable";
  if (count >= minimumStars) return "formed";
  if (count === minimumStars - 1) return "preview";
  return "seed";
}

export function getPreferredConstellationGroup(records, preferredEmotion) {
  const groups = buildEmotionConstellationGroups(records);
  return (
    groups.find((group) => group.emotion === preferredEmotion && group.records.length >= 2) ||
    [...groups].sort((a, b) => {
      const latestA = Math.max(...a.records.map((record) => Date.parse(record.createdAt || "") || 0));
      const latestB = Math.max(...b.records.map((record) => Date.parse(record.createdAt || "") || 0));
      return latestB - latestA;
    })[0] ||
    null
  );
}

export function buildLinePoints(records) {
  return records
    .slice(0, 8)
    .map((record) => `${record.star.x},${record.star.y}`)
    .join(" ");
}

function normalizeStarPoints(records) {
  const points = records
    .slice(0, 8)
    .map((record) => record.star)
    .filter((star) => star && Number.isFinite(star.x) && Number.isFinite(star.y));

  if (!points.length) return [];

  const minX = Math.min(...points.map((point) => point.x));
  const maxX = Math.max(...points.map((point) => point.x));
  const minY = Math.min(...points.map((point) => point.y));
  const maxY = Math.max(...points.map((point) => point.y));
  const width = Math.max(1, maxX - minX);
  const height = Math.max(1, maxY - minY);
  const padding = 12;
  const drawable = 100 - padding * 2;

  return points.map((point) => ({
    x: Number((padding + ((point.x - minX) / width) * drawable).toFixed(2)),
    y: Number((padding + ((point.y - minY) / height) * drawable).toFixed(2))
  }));
}

export function buildGlowPoints(records) {
  return normalizeStarPoints(records).map((point, index) => ({
    ...point,
    radius: index === 0 ? 1.45 : 1.15
  }));
}

export function buildSmoothLinePath(records) {
  const points = normalizeStarPoints(records);
  if (!points.length) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;
  if (points.length === 2) return `M ${points[0].x} ${points[0].y} L ${points[1].x} ${points[1].y}`;

  const commands = [`M ${points[0].x} ${points[0].y}`];
  for (let index = 1; index < points.length - 1; index += 1) {
    const current = points[index];
    const next = points[index + 1];
    const midX = Number(((current.x + next.x) / 2).toFixed(2));
    const midY = Number(((current.y + next.y) / 2).toFixed(2));
    commands.push(`Q ${current.x} ${current.y} ${midX} ${midY}`);
  }
  const finalPoint = points[points.length - 1];
  commands.push(`T ${finalPoint.x} ${finalPoint.y}`);
  return commands.join(" ");
}
