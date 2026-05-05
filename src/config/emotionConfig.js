export const emotionConfig = {
  happy: {
    label: "开心",
    background: "/assets/background/bg_happy.png",
    character: "/assets/character/traveler_happy.png?v=cutout4",
    star: "/assets/objects/star_happy.png",
    starColor: "#ffd76d",
    accentColor: "#ffe6a0",
    effects: ["glow"],
    feedbackText: "这份开心正在夜空里闪闪发光。"
  },
  calm: {
    label: "平静",
    background: "/assets/background/bg_calm.png",
    character: "/assets/character/traveler_calm.png?v=cutout4",
    star: "/assets/objects/star_calm.png",
    starColor: "#b9e6ff",
    accentColor: "#8fd3ff",
    effects: ["softGlow"],
    feedbackText: "这颗星星已经替你收下了今天的心情，场景正在慢慢恢复平静。"
  },
  wronged: {
    label: "委屈",
    background: "/assets/background/bg_sad.png",
    character: "/assets/character/traveler_wronged.png?v=stage3",
    star: "/assets/objects/star_sad.png",
    starColor: "#a9c8ff",
    accentColor: "#b8d7ff",
    effects: ["rain", "tearLakeHint"],
    feedbackText: "这份委屈被星空轻轻接住了，场景正在慢慢恢复平静。"
  },
  angry: {
    label: "生气",
    background: "/assets/background/bg_happy.png",
    character: "/assets/character/traveler_angry.png?v=stage3",
    star: "/assets/objects/star_happy.png",
    starColor: "#ff9a68",
    accentColor: "#ffc08a",
    effects: ["warmFilter", "spark"],
    feedbackText: "这团火光被放进星空里了，场景正在慢慢恢复平静。"
  },
  verySad: {
    label: "非常难过",
    background: "/assets/background/bg_sad.png",
    character: "/assets/character/traveler_sad.png?v=cutout4",
    star: "/assets/objects/star_sad.png",
    starColor: "#7fa7ff",
    accentColor: "#9ec5ff",
    effects: ["rain", "heavyRain", "tearLakeHint"],
    feedbackText: "这颗星星会替你暂时收藏这份难过，场景正在慢慢恢复平静。"
  },
  anxious: {
    label: "焦虑",
    background: "/assets/background/bg_calm.png",
    character: "/assets/character/traveler_anxious.png?v=stage3",
    star: "/assets/objects/star_calm.png",
    starColor: "#b8f2e6",
    accentColor: "#f4d48b",
    effects: ["fastTwinkle", "dust"],
    feedbackText: "这份焦虑先被放在星光旁边，场景正在慢慢恢复平静。"
  },
  sad: {
    label: "难过",
    background: "/assets/background/bg_sad.png",
    character: "/assets/character/traveler_sad.png?v=cutout4",
    star: "/assets/objects/star_sad.png",
    starColor: "#8fb7ff",
    accentColor: "#9ec5ff",
    effects: ["rain"],
    feedbackText: "这颗星星会替你暂时收藏这份难过。"
  }
};

export const emotionOptionKeys = ["happy", "calm", "wronged", "angry", "verySad", "anxious"];

export const emotionOptions = emotionOptionKeys.map((key) => ({
  key,
  label: emotionConfig[key].label
}));

export function getEmotionLabel(emotion) {
  return emotionConfig[emotion]?.label || "平静";
}
