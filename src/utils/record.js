import { emotionConfig } from "../config/emotionConfig";
import { createRecordId } from "./id";
import { getCurrentTimeText } from "./time";

export function createEmotionRecord({ text, emotion }) {
  const safeEmotion = emotionConfig[emotion] ? emotion : "calm";

  return {
    id: createRecordId(),
    text: text.trim(),
    emotion: safeEmotion,
    createdAt: getCurrentTimeText(),
    star: null,
    title: "",
    aiSuggestedEmotion: "",
    aiFeedback: "这颗星星已经替你收下了今天的心情。",
    favorite: false,
    deleted: false,
    audioUrl: "",
    imageUrl: "",
    diaryBookId: "default",
    gestureCreated: false
  };
}
