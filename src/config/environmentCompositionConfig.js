import { emotionOptionKeys } from "./emotionConfig";

const sceneRoot = "/assets/environment/scenes";
const sceneKeys = ["rain", "campfire", "waves", "lullaby"];

const sourceEmotionByEmotion = {
  happy: "calm",
  calm: "calm",
  wronged: "wronged",
  angry: "angry",
  verySad: "wronged",
  anxious: "anxious"
};

const baseSceneComposition = {
  rain: {
    label: "雨夜星空",
    skyBounds: { x: 9, y: 5, width: 82, height: 44, unit: "%" },
    foregroundClassName: "environment-foreground-rain",
    objectClassName: "environment-object-umbrella",
    effectPreset: "rain",
    characterPlacement: { x: 36, y: 82, width: 24 },
    companionPlacement: { x: 57, y: 84, width: 13 },
    flowerPlacement: { x: 24, y: 85, width: 9 }
  },
  campfire: {
    label: "炉边星空",
    skyBounds: { x: 12, y: 6, width: 76, height: 38, unit: "%" },
    foregroundClassName: "environment-foreground-ground",
    objectClassName: "environment-object-campfire",
    effectPreset: "campfire",
    characterPlacement: { x: 35, y: 80, width: 24 },
    companionPlacement: { x: 57, y: 82, width: 13 },
    flowerPlacement: { x: 23, y: 84, width: 9 }
  },
  waves: {
    label: "海浪星空",
    skyBounds: { x: 10, y: 6, width: 80, height: 43, unit: "%" },
    foregroundClassName: "environment-foreground-waves",
    objectClassName: "environment-object-moon-reflection",
    effectPreset: "waves",
    characterPlacement: { x: 36, y: 80, width: 24 },
    companionPlacement: { x: 58, y: 83, width: 13 },
    flowerPlacement: { x: 24, y: 84, width: 9 }
  },
  lullaby: {
    label: "摇篮星空",
    skyBounds: { x: 14, y: 7, width: 72, height: 40, unit: "%" },
    foregroundClassName: "environment-foreground-cloud",
    objectClassName: "environment-object-lullaby",
    effectPreset: "lullaby",
    characterPlacement: { x: 35, y: 79, width: 24 },
    companionPlacement: { x: 56, y: 81, width: 13 },
    flowerPlacement: { x: 23, y: 82, width: 9 }
  }
};

export const environmentCompositionConfig = emotionOptionKeys.reduce((acc, emotion) => {
  acc[emotion] = sceneKeys.reduce((sceneAcc, sceneKey) => {
    const sourceEmotion = sourceEmotionByEmotion[emotion] || "calm";
    sceneAcc[sceneKey] = {
      ...baseSceneComposition[sceneKey],
      emotion,
      sceneKey,
      backgroundImage: `${sceneRoot}/${sourceEmotion}_${sceneKey}.png`,
      colorWashClassName: `environment-wash-${emotion}`
    };
    return sceneAcc;
  }, {});
  return acc;
}, {});

export function getEnvironmentComposition(emotion = "calm", sceneKey = "rain") {
  return (
    environmentCompositionConfig[emotion]?.[sceneKey] ||
    environmentCompositionConfig.calm?.[sceneKey] ||
    environmentCompositionConfig.calm.rain
  );
}

export function skyBoundsToPlacementArea(skyBounds, viewportWidth, viewportHeight) {
  if (!skyBounds) return undefined;
  const isPercent = skyBounds.unit === "%" || skyBounds.width <= 100;
  if (!isPercent) return skyBounds;

  return {
    x: Math.round((skyBounds.x / 100) * viewportWidth),
    y: Math.round((skyBounds.y / 100) * viewportHeight),
    width: Math.round((skyBounds.width / 100) * viewportWidth),
    height: Math.round((skyBounds.height / 100) * viewportHeight)
  };
}
