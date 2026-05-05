import { environmentAssetConfig } from "./sceneAssetConfig";

export const audioPresets = {
  rain: {
    label: "雨声",
    description: "低通细雨噪声",
    image: environmentAssetConfig.rain,
    defaultVolume: 28,
    recommendedFor: ["wronged", "verySad", "sad"]
  },
  campfire: {
    label: "篝火",
    description: "轻短噼啪火星",
    image: environmentAssetConfig.campfire,
    defaultVolume: 24,
    recommendedFor: ["angry"]
  },
  waves: {
    label: "海浪",
    description: "缓慢起伏白噪声",
    image: environmentAssetConfig.waves,
    defaultVolume: 30,
    recommendedFor: ["anxious"]
  },
  lullaby: {
    label: "摇篮曲",
    description: "很低音量柔和振荡",
    image: environmentAssetConfig.lullaby,
    defaultVolume: 16,
    recommendedFor: ["calm", "happy"]
  }
};

export const audioPresetOptions = Object.entries(audioPresets).map(([key, preset]) => ({
  key,
  ...preset
}));

export function getRecommendedAudioPreset(emotion) {
  return audioPresetOptions.find((preset) => preset.recommendedFor.includes(emotion))?.key || "lullaby";
}
