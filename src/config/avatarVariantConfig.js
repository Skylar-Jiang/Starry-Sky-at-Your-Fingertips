import { emotionConfig } from "./emotionConfig";
import { sceneAssetConfig } from "./sceneAssetConfig";

export const characterVariants = {
  classic: {
    label: "经典小王子",
    anchor: { x: 50, y: 100 },
    widthScale: 1,
    byEmotion: Object.fromEntries(Object.entries(emotionConfig).map(([emotion, config]) => [emotion, config.character]))
  },
  neutralTraveler: {
    label: "安静旅人",
    anchor: { x: 50, y: 100 },
    widthScale: 0.96,
    byEmotion: Object.fromEntries(Object.entries(emotionConfig).map(([emotion, config]) => [emotion, config.character]))
  }
};

export const petVariants = {
  fox: {
    label: "狐狸",
    anchor: { x: 50, y: 100 },
    widthScale: 1,
    byEmotion: Object.fromEntries(Object.entries(sceneAssetConfig).map(([emotion, assets]) => [emotion, assets.fox]))
  },
  smallStarPet: {
    label: "星光小兽",
    anchor: { x: 50, y: 100 },
    widthScale: 0.9,
    byEmotion: Object.fromEntries(Object.entries(sceneAssetConfig).map(([emotion, assets]) => [emotion, assets.fox]))
  }
};

export const flowerVariants = {
  roseRed: {
    label: "玫瑰",
    anchor: { x: 50, y: 100 },
    widthScale: 1,
    byEmotion: Object.fromEntries(Object.entries(sceneAssetConfig).map(([emotion, assets]) => [emotion, assets.rose]))
  },
  glowBud: {
    label: "微光花苞",
    anchor: { x: 50, y: 100 },
    widthScale: 0.92,
    byEmotion: Object.fromEntries(Object.entries(sceneAssetConfig).map(([emotion, assets]) => [emotion, assets.rose]))
  }
};

export const defaultAvatarVariants = {
  character: "classic",
  pet: "fox",
  flower: "roseRed"
};

export function getVariantAsset(variants, variantKey, emotion) {
  const variant = variants[variantKey] || variants[Object.keys(variants)[0]];
  return variant.byEmotion[emotion] || variant.byEmotion.calm;
}
