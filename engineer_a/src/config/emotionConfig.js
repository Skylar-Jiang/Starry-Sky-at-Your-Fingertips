export const emotionConfig = {
  calm: {
    label: "平静",
    background: "/assets/background/bg_calm.png",
    planet: "/assets/background/planet_ground.png",
    character: "/assets/character/traveler_calm.png",
    fox: "/assets/fox/fox_calm.png",
    rose: "/assets/rose/rose_normal.png",
    star: "/assets/objects/star_calm.png",
    starColor: "#b9e6ff",
    accentColor: "#8fd3ff",
    effects: [],
    feedbackText: "这颗星星已经替你收下了今天的心情。"
  },
  happy: {
    label: "开心",
    background: "/assets/background/bg_happy.png",
    planet: "/assets/background/planet_ground.png",
    character: "/assets/character/traveler_happy.png",
    fox: "/assets/fox/fox_calm.png",
    rose: "/assets/rose/rose_bloom.png",
    star: "/assets/objects/star_happy.png",
    starColor: "#ffd76d",
    accentColor: "#ffe6a0",
    effects: ["glow"],
    feedbackText: "这份开心正在夜空里闪闪发光。"
  },
  sad: {
    label: "难过",
    background: "/assets/background/bg_sad.png",
    planet: "/assets/background/planet_ground.png",
    character: "/assets/character/traveler_sad.png",
    fox: "/assets/fox/fox_comfort.png",
    rose: "/assets/rose/rose_wilt.png",
    star: "/assets/objects/star_sad.png",
    starColor: "#8fb7ff",
    accentColor: "#9ec5ff",
    effects: ["rain"],
    feedbackText: "这颗星星会替你暂时收藏这份难过。"
  }
};

export const emotionOptions = Object.entries(emotionConfig).map(([key, value]) => ({
  key,
  label: value.label
}));

export function getEmotionLabel(emotion) {
  return emotionConfig[emotion]?.label || "平静";
}
