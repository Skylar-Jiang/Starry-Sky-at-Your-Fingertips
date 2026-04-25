export function createRecordId() {
  return `record_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export function createStarId() {
  return `star_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}
