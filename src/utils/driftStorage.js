const DRIFT_CACHE_KEY = "fingertip_drift_star_cache";
const DRIFT_CACHE_TIME_KEY = "fingertip_drift_star_cache_time";
const DRIFT_EXPIRY_MS = 5 * 60 * 1000;

export function loadCachedDriftStars() {
  try {
    const cachedTime = localStorage.getItem(DRIFT_CACHE_TIME_KEY);
    if (!cachedTime) return null;

    const elapsed = Date.now() - Number(cachedTime);
    if (elapsed > DRIFT_EXPIRY_MS) {
      clearDriftCache();
      return null;
    }

    const raw = localStorage.getItem(DRIFT_CACHE_KEY);
    if (!raw) return null;

    const stars = JSON.parse(raw);
    return Array.isArray(stars) ? stars : null;
  } catch (error) {
    console.error("loadCachedDriftStars failed:", error);
    return null;
  }
}

export function saveCachedDriftStars(stars) {
  try {
    localStorage.setItem(DRIFT_CACHE_KEY, JSON.stringify(stars));
    localStorage.setItem(DRIFT_CACHE_TIME_KEY, String(Date.now()));
  } catch (error) {
    console.error("saveCachedDriftStars failed:", error);
  }
}

export function clearDriftCache() {
  try {
    localStorage.removeItem(DRIFT_CACHE_KEY);
    localStorage.removeItem(DRIFT_CACHE_TIME_KEY);
  } catch (error) {
    console.error("clearDriftCache failed:", error);
  }
}
