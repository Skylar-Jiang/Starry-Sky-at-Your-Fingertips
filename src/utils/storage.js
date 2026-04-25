export const STORAGE_KEY = "fingertip_starry_sky_records";

export function loadRecords() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const records = JSON.parse(raw);
    return Array.isArray(records) ? records : [];
  } catch (error) {
    console.error("loadRecords failed:", error);
    return [];
  }
}

export function saveRecords(records) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch (error) {
    console.error("saveRecords failed:", error);
  }
}

export function clearRecords() {
  localStorage.removeItem(STORAGE_KEY);
}
