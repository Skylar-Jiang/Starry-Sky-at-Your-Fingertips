import { microInteractionConfig } from "../config/microInteractionConfig";

const STORAGE_KEY = microInteractionConfig.drift.replyStorageKey;

export function loadDriftReplies(starId) {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const allReplies = raw ? JSON.parse(raw) : {};
    return Array.isArray(allReplies[starId]) ? allReplies[starId] : [];
  } catch (error) {
    console.error("loadDriftReplies failed:", error);
    return [];
  }
}

export function saveDriftReply(starId, text) {
  const reply = {
    id: `reply-${Date.now()}`,
    text,
    createdAt: new Date().toISOString(),
    localOnly: true
  };

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const allReplies = raw ? JSON.parse(raw) : {};
    const nextReplies = [...(Array.isArray(allReplies[starId]) ? allReplies[starId] : []), reply];
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...allReplies, [starId]: nextReplies }));
    return nextReplies;
  } catch (error) {
    console.error("saveDriftReply failed:", error);
    return [reply];
  }
}
