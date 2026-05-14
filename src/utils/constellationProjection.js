const DEFAULT_SKY_BOUNDS = {
  marginX: 120,
  top: 96,
  bottomRatio: 0.55
};

export function normalizeSkyBounds(skyBounds, viewportWidth = 1200, viewportHeight = 800) {
  if (!skyBounds) {
    return {
      minX: DEFAULT_SKY_BOUNDS.marginX,
      maxX: viewportWidth - DEFAULT_SKY_BOUNDS.marginX,
      minY: DEFAULT_SKY_BOUNDS.top,
      maxY: Math.round(viewportHeight * DEFAULT_SKY_BOUNDS.bottomRatio)
    };
  }

  const isPercent = skyBounds.unit === "%" || (skyBounds.width <= 100 && skyBounds.height <= 100);
  if (!isPercent) {
    return {
      minX: skyBounds.x,
      maxX: skyBounds.x + skyBounds.width,
      minY: skyBounds.y,
      maxY: skyBounds.y + skyBounds.height
    };
  }

  return {
    minX: Math.round((skyBounds.x / 100) * viewportWidth),
    maxX: Math.round(((skyBounds.x + skyBounds.width) / 100) * viewportWidth),
    minY: Math.round((skyBounds.y / 100) * viewportHeight),
    maxY: Math.round(((skyBounds.y + skyBounds.height) / 100) * viewportHeight)
  };
}

export function getConstellationLayoutBounds(skyBounds) {
  const skyWidth = Math.max(1, skyBounds.maxX - skyBounds.minX);
  const skyHeight = Math.max(1, skyBounds.maxY - skyBounds.minY);
  return {
    x: Math.round(skyBounds.minX + skyWidth * 0.18),
    y: Math.round(skyBounds.minY + skyHeight * 0.18),
    width: Math.round(skyWidth * 0.45),
    height: Math.round(skyHeight * 0.42)
  };
}

export function getConstellationLayoutCandidates(skyBounds, viewportWidth = 1200, viewportHeight = 800) {
  const normalizedSkyBounds = normalizeSkyBounds(skyBounds, viewportWidth, viewportHeight);
  const skyWidth = Math.max(1, normalizedSkyBounds.maxX - normalizedSkyBounds.minX);
  const skyHeight = Math.max(1, normalizedSkyBounds.maxY - normalizedSkyBounds.minY);
  const layoutWidth = Math.round(skyWidth * 0.31);
  const layoutHeight = Math.round(skyHeight * 0.46);
  const columns = [0.1, 0.345, 0.59];
  const rows = [0.08, 0.46];

  return rows.flatMap((row, rowIndex) =>
    columns.map((column, columnIndex) => ({
      id: `slot-${rowIndex + 1}-${columnIndex + 1}`,
      x: Math.round(normalizedSkyBounds.minX + skyWidth * column),
      y: Math.round(normalizedSkyBounds.minY + skyHeight * row),
      width: layoutWidth,
      height: layoutHeight
    }))
  );
}

export function getConstellationLayoutById(skyBounds, viewportWidth, viewportHeight, layoutId) {
  return (
    getConstellationLayoutCandidates(skyBounds, viewportWidth, viewportHeight).find((layout) => layout.id === layoutId) ||
    null
  );
}

function normalizeLayoutBounds(layout, skyBounds, viewportWidth, viewportHeight) {
  if (layout?.id) {
    const matchingLayout = getConstellationLayoutById(skyBounds, viewportWidth, viewportHeight, layout.id);
    if (matchingLayout) return matchingLayout;
  }
  if (
    Number.isFinite(layout?.x) &&
    Number.isFinite(layout?.y) &&
    Number.isFinite(layout?.width) &&
    Number.isFinite(layout?.height)
  ) {
    return layout;
  }
  return getConstellationLayoutBounds(normalizeSkyBounds(skyBounds, viewportWidth, viewportHeight));
}

export function getProjectedNodeBounds(projectedNodes = [], padding = 28) {
  if (!projectedNodes.length) return { minX: 0, minY: 0, maxX: 0, maxY: 0, width: 0, height: 0 };
  const minX = Math.min(...projectedNodes.map((node) => node.x)) - padding;
  const maxX = Math.max(...projectedNodes.map((node) => node.x)) + padding;
  const minY = Math.min(...projectedNodes.map((node) => node.y)) - padding;
  const maxY = Math.max(...projectedNodes.map((node) => node.y)) + padding;
  return {
    minX,
    minY,
    maxX,
    maxY,
    width: maxX - minX,
    height: maxY - minY
  };
}

export function getBoxOverlapArea(a, b) {
  const width = Math.max(0, Math.min(a.maxX, b.maxX) - Math.max(a.minX, b.minX));
  const height = Math.max(0, Math.min(a.maxY, b.maxY) - Math.max(a.minY, b.minY));
  return width * height;
}

export function projectConstellationNodes(
  constellation,
  skyBounds,
  viewportWidth = 1200,
  viewportHeight = 800,
  layout = null
) {
  const nodes = constellation.nodes || constellation.stars || [];
  if (!nodes.length) return [];

  const layoutBounds = normalizeLayoutBounds(layout, skyBounds, viewportWidth, viewportHeight);
  const minRawX = Math.min(...nodes.map((node) => node.x));
  const maxRawX = Math.max(...nodes.map((node) => node.x));
  const minRawY = Math.min(...nodes.map((node) => node.y));
  const maxRawY = Math.max(...nodes.map((node) => node.y));
  const rawWidth = Math.max(1, maxRawX - minRawX);
  const rawHeight = Math.max(1, maxRawY - minRawY);
  const scale = Math.min(layoutBounds.width / rawWidth, layoutBounds.height / rawHeight);
  const projectedWidth = rawWidth * scale;
  const projectedHeight = rawHeight * scale;
  const offsetX = layoutBounds.x + (layoutBounds.width - projectedWidth) / 2 - minRawX * scale;
  const offsetY = layoutBounds.y + (layoutBounds.height - projectedHeight) / 2 - minRawY * scale;

  return nodes.map((node, index) => ({
    id: node.id,
    index,
    rawX: node.x,
    rawY: node.y,
    x: Math.round(node.x * scale + offsetX),
    y: Math.round(node.y * scale + offsetY)
  }));
}

export function indexProjectedNodesById(projectedNodes = []) {
  return Object.fromEntries(projectedNodes.map((node) => [node.id, node]));
}

export function shouldDebugConstellationProjection() {
  if (typeof window === "undefined") return false;
  return (
    window.__CONSTELLATION_DEBUG__ === true ||
    new URLSearchParams(window.location.search).get("debugConstellation") === "1"
  );
}

export function logConstellationProjection(label, { constellation, projectedNodes, filledNodeIds = [], edges = [] }) {
  if (!shouldDebugConstellationProjection()) return;
  console.log(label, {
    currentConstellation: constellation.id || constellation.key,
    projectedNodes,
    filledNodeIds,
    outlineEdges: edges
  });
}
