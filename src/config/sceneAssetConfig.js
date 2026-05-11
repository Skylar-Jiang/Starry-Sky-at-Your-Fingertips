export const sceneAssetConfig = {
  happy: {
    fox: "/assets/companions/fox/fox_happy.png?v=cutout3",
    rose: "/assets/companions/rose/rose_bloom.png?v=cutout3"
  },
  calm: {
    fox: "/assets/companions/fox/fox_sleep.png?v=cutout3",
    rose: "/assets/companions/rose/rose_soft.png?v=cutout3"
  },
  wronged: {
    fox: "/assets/companions/fox/fox_comfort.png?v=cutout3",
    rose: "/assets/companions/rose/rose_wilt.png?v=cutout3"
  },
  angry: {
    fox: "/assets/companions/fox/fox_comfort.png?v=cutout3",
    rose: "/assets/companions/rose/rose_recover.png?v=cutout3"
  },
  verySad: {
    fox: "/assets/companions/fox/fox_sad.png?v=cutout3",
    rose: "/assets/companions/rose/rose_wilt.png?v=cutout3"
  },
  anxious: {
    fox: "/assets/companions/fox/fox_idle.png?v=cutout3",
    rose: "/assets/companions/rose/rose_bud.png?v=cutout3"
  },
  sad: {
    fox: "/assets/companions/fox/fox_comfort.png?v=cutout3",
    rose: "/assets/companions/rose/rose_wilt.png?v=cutout3"
  }
};

export const environmentAssetConfig = {
  rain: "/assets/environment/env_rain.png",
  campfire: "/assets/environment/env_campfire.png",
  waves: "/assets/environment/env_waves.png",
  lullaby: "/assets/environment/env_lullaby.png"
};

const sceneRoot = "/assets/environment/scenes";

const baseEnvironmentScenes = [
  {
    key: "rain",
    label: "雨夜星空",
    audioPreset: "rain",
    audioLabel: "雨声",
    description: "一片被雨声轻轻接住的星空"
  },
  {
    key: "campfire",
    label: "炉边星空",
    audioPreset: "campfire",
    audioLabel: "篝火",
    description: "带一点暖光，但仍然安静的星空"
  },
  {
    key: "waves",
    label: "海浪星空",
    audioPreset: "waves",
    audioLabel: "海浪",
    description: "像潮汐一样慢慢松开的星空"
  },
  {
    key: "lullaby",
    label: "摇篮星空",
    audioPreset: "lullaby",
    audioLabel: "摇篮曲",
    description: "适合把心事放低一点的星空"
  }
];

const environmentSceneEmotions = ["wronged", "angry", "anxious", "calm"];

export const environmentSceneConfig = environmentSceneEmotions.reduce((scenes, emotion) => {
  scenes[emotion] = baseEnvironmentScenes.map((scene) => ({
    ...scene,
    id: `${emotion}_${scene.key}`,
    image: `${sceneRoot}/${emotion}_${scene.key}.png`
  }));
  return scenes;
}, {});

export function getEnvironmentScenes(emotion) {
  return environmentSceneConfig[emotion] || environmentSceneConfig.calm;
}

export function getDefaultEnvironmentSceneKey(emotion, recommendedPreset = "rain") {
  const scenes = getEnvironmentScenes(emotion);
  return scenes.find((scene) => scene.audioPreset === recommendedPreset)?.key || scenes[0].key;
}

export function getSceneAssets(emotion) {
  return sceneAssetConfig[emotion] || sceneAssetConfig.calm;
}
