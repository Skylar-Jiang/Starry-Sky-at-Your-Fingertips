import { getConstellationByKey, zodiacConstellations } from "../config/presetConstellationConfig";
import {
  getBoxOverlapArea,
  getConstellationLayoutCandidates,
  getProjectedNodeBounds,
  projectConstellationNodes
} from "./constellationProjection";

export const CONSTELLATION_COLLISION_DISTANCE = 34;
const CONSTELLATION_BOX_PADDING = 42;
const BOX_OVERLAP_WEIGHT = 8;

function getExistingPoints(records = []) {
  return records
    .map((record) => record?.star)
    .filter((star) => star && Number.isFinite(star.x) && Number.isFinite(star.y));
}

function getExistingConstellationGroups(records = []) {
  const groups = new Map();
  for (const record of records) {
    const star = record?.star;
    if (!star?.constellationKey) continue;
    const current = groups.get(star.constellationKey) || [];
    current.push(record);
    groups.set(star.constellationKey, current);
  }
  return [...groups.entries()].map(([key, groupRecords]) => ({
    constellation: getConstellationByKey(key),
    records: groupRecords
  }));
}

function getGroupLayout(records = []) {
  return records.find((record) => record?.star?.constellationLayout)?.star.constellationLayout || null;
}

function getStarPointBounds(records = [], padding = CONSTELLATION_BOX_PADDING) {
  const points = getExistingPoints(records);
  if (!points.length) return null;
  const minX = Math.min(...points.map((point) => point.x)) - padding;
  const maxX = Math.max(...points.map((point) => point.x)) + padding;
  const minY = Math.min(...points.map((point) => point.y)) - padding;
  const maxY = Math.max(...points.map((point) => point.y)) + padding;
  return { minX, minY, maxX, maxY, width: maxX - minX, height: maxY - minY };
}

function getExistingConstellationBounds(records, skyBounds, viewportWidth, viewportHeight) {
  return getExistingConstellationGroups(records)
    .map(({ constellation, records: groupRecords }) => {
      const layout = getGroupLayout(groupRecords);
      if (layout) {
        return getProjectedNodeBounds(
          projectConstellationNodes(constellation, skyBounds, viewportWidth, viewportHeight, layout),
          CONSTELLATION_BOX_PADDING
        );
      }
      return getStarPointBounds(groupRecords);
    })
    .filter(Boolean);
}

function getCollisionScore(projectedNodes, existingPoints, minDistance) {
  return projectedNodes.reduce((score, projected) => {
    const nearestDistance = existingPoints.length
      ? Math.min(...existingPoints.map((point) => Math.hypot(projected.x - point.x, projected.y - point.y)))
      : Infinity;

    return nearestDistance < minDistance ? score + (minDistance - nearestDistance) : score;
  }, 0);
}

function scoreConstellationLayout({
  constellation,
  layout,
  records,
  skyBounds,
  viewportWidth,
  viewportHeight,
  minDistance
}) {
  const projectedNodes = projectConstellationNodes(constellation, skyBounds, viewportWidth, viewportHeight, layout);
  const candidateBounds = getProjectedNodeBounds(projectedNodes, CONSTELLATION_BOX_PADDING);
  const existingBounds = getExistingConstellationBounds(records, skyBounds, viewportWidth, viewportHeight);
  const existingPoints = getExistingPoints(records);
  const overlapScore =
    existingBounds.reduce((score, bounds) => score + getBoxOverlapArea(candidateBounds, bounds), 0) *
    BOX_OVERLAP_WEIGHT;

  return overlapScore + getCollisionScore(projectedNodes, existingPoints, minDistance);
}

function chooseBestLayout({
  constellation,
  records = [],
  skyBounds,
  viewportWidth,
  viewportHeight,
  minDistance = CONSTELLATION_COLLISION_DISTANCE,
  random = Math.random
}) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 1200;
  const height = Number.isFinite(viewportHeight) ? viewportHeight : 800;
  const scoredLayouts = getConstellationLayoutCandidates(skyBounds, width, height).map((layout) => ({
    layout,
    score: scoreConstellationLayout({
      constellation,
      layout,
      records,
      skyBounds,
      viewportWidth: width,
      viewportHeight: height,
      minDistance
    })
  }));
  const bestScore = Math.min(...scoredLayouts.map((candidate) => candidate.score));
  const bestLayouts = scoredLayouts.filter((candidate) => candidate.score === bestScore);
  const selectedIndex = Math.min(bestLayouts.length - 1, Math.floor(random() * bestLayouts.length));

  return bestLayouts[selectedIndex];
}

export function chooseConstellationLayout(options = {}) {
  return chooseBestLayout(options).layout;
}

export function chooseNextConstellationKey({
  records = [],
  currentKey,
  skyBounds,
  viewportWidth,
  viewportHeight,
  minDistance = CONSTELLATION_COLLISION_DISTANCE,
  random = Math.random
} = {}) {
  const width = Number.isFinite(viewportWidth) ? viewportWidth : 1200;
  const height = Number.isFinite(viewportHeight) ? viewportHeight : 800;
  const candidates = zodiacConstellations.filter((constellation) => constellation.key !== currentKey);

  if (!candidates.length) return getConstellationByKey(currentKey).key;

  const scoredCandidates = candidates.map((constellation) => ({
    constellation,
    score: chooseBestLayout({
      constellation,
      records,
      skyBounds,
      viewportWidth: width,
      viewportHeight: height,
      minDistance,
      random
    }).score
  }));
  const cleanCandidates = scoredCandidates.filter((candidate) => candidate.score === 0);
  const pool = cleanCandidates.length ? cleanCandidates : scoredCandidates;
  const bestScore = Math.min(...pool.map((candidate) => candidate.score));
  const bestCandidates = pool.filter((candidate) => candidate.score === bestScore);
  const selectedIndex = Math.min(bestCandidates.length - 1, Math.floor(random() * bestCandidates.length));

  return bestCandidates[selectedIndex].constellation.key;
}
