export const foregroundSceneConfig = {
  lullaby: {
    label: "lullaby",
    platform: "/assets/scene-layers/platforms/lullaby_platform.png",
    className: "foreground-scene-lullaby"
  },
  waves: {
    label: "waves",
    platform: "/assets/scene-layers/platforms/waves_platform.png",
    className: "foreground-scene-waves"
  },
  campfire: {
    label: "campfire",
    platform: "/assets/scene-layers/platforms/campfire_platform.png",
    className: "foreground-scene-campfire",
    useCompleteEmotionComposite: true
  },
  rain: {
    label: "rain",
    platform: "/assets/scene-layers/platforms/rain_platform.png",
    className: "foreground-scene-rain"
  }
};

export const foregroundEmotionConfig = {
  happy: {
    label: "happy",
    group: "/assets/scene-layers/emotion-groups/happy_group.png",
    campfireGroup: "/assets/scene-layers/campfire-emotions/happy_campfire.png",
    className: "foreground-emotion-happy"
  },
  calm: {
    label: "calm",
    group: "/assets/scene-layers/emotion-groups/calm_group.png",
    campfireGroup: "/assets/scene-layers/campfire-emotions/calm_campfire.png",
    className: "foreground-emotion-calm"
  },
  wronged: {
    label: "wronged",
    group: "/assets/scene-layers/emotion-groups/wronged_group.png",
    campfireGroup: "/assets/scene-layers/campfire-emotions/wronged_campfire.png",
    className: "foreground-emotion-wronged"
  },
  angry: {
    label: "angry",
    group: "/assets/scene-layers/emotion-groups/angry_group.png",
    campfireGroup: "/assets/scene-layers/campfire-emotions/angry_campfire.png",
    className: "foreground-emotion-angry"
  },
  verySad: {
    label: "very sad",
    group: "/assets/scene-layers/emotion-groups/verySad_group.png",
    campfireGroup: "/assets/scene-layers/campfire-emotions/verySad_campfire.png",
    className: "foreground-emotion-verySad"
  },
  anxious: {
    label: "anxious",
    group: "/assets/scene-layers/emotion-groups/anxious_group.png",
    campfireGroup: "/assets/scene-layers/campfire-emotions/anxious_campfire.png",
    className: "foreground-emotion-anxious"
  }
};

export function getForegroundSceneConfig(sceneKey) {
  return foregroundSceneConfig[sceneKey] || foregroundSceneConfig.lullaby;
}

export function getForegroundEmotionConfig(emotion) {
  return foregroundEmotionConfig[emotion] || foregroundEmotionConfig.calm;
}
