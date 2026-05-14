import { getConstellationByKey } from "../config/presetConstellationConfig";
import { projectConstellationNodes } from "./constellationProjection";

const DEFAULT_SCENE_SIZE = { width: 1200, height: 800 };

function finitePositive(value) {
  return Number.isFinite(value) && value > 0;
}

function finiteRatio(value) {
  return Number.isFinite(value) ? value : null;
}

function getStarCacheKey(star) {
  return star?.id || `${star?.x ?? "x"}:${star?.y ?? "y"}`;
}

export function resolveSceneSize(sceneSize = {}) {
  return {
    width: finitePositive(sceneSize.width) ? Math.round(sceneSize.width) : DEFAULT_SCENE_SIZE.width,
    height: finitePositive(sceneSize.height) ? Math.round(sceneSize.height) : DEFAULT_SCENE_SIZE.height
  };
}

export function addStarRatios(star, sceneSize = {}) {
  if (!star) return star;
  const { width, height } = resolveSceneSize(sceneSize);
  return {
    ...star,
    xRatio: finiteRatio(star.xRatio) ?? star.x / width,
    yRatio: finiteRatio(star.yRatio) ?? star.y / height,
    sourceWidth: finitePositive(star.sourceWidth) ? star.sourceWidth : width,
    sourceHeight: finitePositive(star.sourceHeight) ? star.sourceHeight : height
  };
}

export function resolveStarRenderPosition(star, options = {}) {
  const { width, height } = resolveSceneSize(options);
  const constellationKey = star?.constellationKey || options.constellationKey;

  if (constellationKey && (star?.constellationNodeId || Number.isFinite(star?.constellationIndex))) {
    const constellation = getConstellationByKey(constellationKey);
    const projectedNodes = projectConstellationNodes(
      constellation,
      options.skyBounds,
      width,
      height,
      star.constellationLayout
    );
    const projectedNode = projectedNodes.find((node) =>
      star.constellationNodeId ? node.id === star.constellationNodeId : node.index === star.constellationIndex
    );
    if (projectedNode) {
      return {
        x: projectedNode.x,
        y: projectedNode.y,
        xRatio: projectedNode.x / width,
        yRatio: projectedNode.y / height
      };
    }
  }

  const cachedRatio = options.legacyRatioCache?.get(getStarCacheKey(star));
  let xRatio = finiteRatio(star?.xRatio) ?? finiteRatio(cachedRatio?.xRatio);
  let yRatio = finiteRatio(star?.yRatio) ?? finiteRatio(cachedRatio?.yRatio);

  if (xRatio === null && Number.isFinite(star?.x)) {
    const sourceWidth = finitePositive(star.sourceWidth) ? star.sourceWidth : width;
    xRatio = star.x / sourceWidth;
  }
  if (yRatio === null && Number.isFinite(star?.y)) {
    const sourceHeight = finitePositive(star.sourceHeight) ? star.sourceHeight : height;
    yRatio = star.y / sourceHeight;
  }

  xRatio = finiteRatio(xRatio) ?? 0.5;
  yRatio = finiteRatio(yRatio) ?? 0.3;

  if (options.legacyRatioCache && cachedRatio === undefined && !Number.isFinite(star?.xRatio)) {
    options.legacyRatioCache.set(getStarCacheKey(star), { xRatio, yRatio });
  }

  return {
    x: Math.round(xRatio * width),
    y: Math.round(yRatio * height),
    xRatio,
    yRatio
  };
}
