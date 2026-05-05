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

export function getSceneAssets(emotion) {
  return sceneAssetConfig[emotion] || sceneAssetConfig.calm;
}
