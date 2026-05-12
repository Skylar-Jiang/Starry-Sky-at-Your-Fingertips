const recoveryAssetRoot = "/assets/recovery";

const completedText = "这颗星星已经被你安放好了。";

export const recoveryInteractionConfig = {
  wronged: {
    label: "雨滴",
    progressLabel: "轻轻点亮雨滴",
    actionLabel: "轻点雨滴，把它安放成星尘",
    className: "recovery-raindrop",
    sceneClassName: "recovery-scene-rain",
    asset: `${recoveryAssetRoot}/raindrop_wronged.png`,
    resolvedAsset: `${recoveryAssetRoot}/raindrop_light_dust.png`,
    count: 7,
    requiredCount: 5,
    size: "clamp(34px, 4.8vw, 52px)",
    points: [
      { x: 18, y: 28 },
      { x: 31, y: 46 },
      { x: 43, y: 23 },
      { x: 58, y: 50 },
      { x: 72, y: 30 },
      { x: 82, y: 45 },
      { x: 27, y: 66 }
    ],
    promptText: "雨滴落下来了。轻轻点它们，让委屈变成一点点星光。",
    completedText
  },
  angry: {
    label: "星尘",
    progressLabel: "收拢发热星尘",
    actionLabel: "轻点星尘，让它慢慢安静",
    className: "recovery-soft-light",
    sceneClassName: "recovery-scene-soft",
    asset: `${recoveryAssetRoot}/calm_soft_mote.png`,
    resolvedAsset: `${recoveryAssetRoot}/raindrop_light_dust.png`,
    count: 7,
    requiredCount: 5,
    size: "clamp(30px, 4.4vw, 48px)",
    points: [
      { x: 20, y: 55 },
      { x: 34, y: 32 },
      { x: 48, y: 62 },
      { x: 60, y: 28 },
      { x: 75, y: 48 },
      { x: 84, y: 34 },
      { x: 42, y: 44 }
    ],
    promptText: "有些星尘还在发热。点一点，让它们安静成柔和的光。",
    completedText
  },
  anxious: {
    label: "泡泡",
    progressLabel: "轻轻点破泡泡",
    actionLabel: "轻点泡泡，让它散成星尘",
    className: "recovery-bubble",
    sceneClassName: "recovery-scene-bubble",
    asset: `${recoveryAssetRoot}/anxiety_bubble.png`,
    resolvedAsset: `${recoveryAssetRoot}/bubble_stardust_pop.png`,
    count: 6,
    requiredCount: 5,
    size: "clamp(32px, 4.9vw, 54px)",
    points: [
      { x: 19, y: 38 },
      { x: 33, y: 62 },
      { x: 46, y: 31 },
      { x: 62, y: 58 },
      { x: 76, y: 35 },
      { x: 84, y: 57 }
    ],
    promptText: "泡泡和沙尘在漂浮。慢慢点破它们，把焦虑交给星空。",
    completedText
  },
  verySad: {
    label: "湖光",
    progressLabel: "点亮泪湖微光",
    actionLabel: "轻点湖光，让水面变亮",
    className: "recovery-lake-light",
    sceneClassName: "recovery-scene-lake",
    asset: `${recoveryAssetRoot}/lake_light_very_sad.png`,
    resolvedAsset: `${recoveryAssetRoot}/raindrop_light_dust.png`,
    count: 6,
    requiredCount: 4,
    size: "clamp(38px, 5.2vw, 58px)",
    points: [
      { x: 21, y: 58 },
      { x: 36, y: 48 },
      { x: 50, y: 66 },
      { x: 64, y: 45 },
      { x: 76, y: 61 },
      { x: 84, y: 51 }
    ],
    promptText: "泪湖里有很小的光。点亮它们，让水面慢慢安静。",
    completedText
  },
  happy: {
    label: "光点",
    progressLabel: "送出开心光点",
    actionLabel: "轻点光点，让它扩散",
    className: "recovery-glow",
    sceneClassName: "recovery-scene-glow",
    asset: `${recoveryAssetRoot}/happy_glow_seed.png`,
    resolvedAsset: `${recoveryAssetRoot}/raindrop_light_dust.png`,
    count: 6,
    requiredCount: 4,
    size: "clamp(28px, 4.2vw, 44px)",
    points: [
      { x: 18, y: 34 },
      { x: 32, y: 24 },
      { x: 46, y: 42 },
      { x: 61, y: 25 },
      { x: 74, y: 44 },
      { x: 83, y: 30 }
    ],
    promptText: "把这份开心分成小小光点，轻轻送进星空。",
    completedText
  },
  calm: {
    label: "柔光",
    progressLabel: "收拢柔光微粒",
    actionLabel: "轻点柔光，让它回到星星旁边",
    className: "recovery-soft-light",
    sceneClassName: "recovery-scene-soft",
    asset: `${recoveryAssetRoot}/calm_soft_mote.png`,
    resolvedAsset: `${recoveryAssetRoot}/raindrop_light_dust.png`,
    count: 6,
    requiredCount: 4,
    size: "clamp(28px, 4vw, 42px)",
    points: [
      { x: 22, y: 32 },
      { x: 36, y: 51 },
      { x: 50, y: 30 },
      { x: 63, y: 54 },
      { x: 76, y: 34 },
      { x: 82, y: 50 }
    ],
    promptText: "星空里有柔和的微光。点一点，让它们回到星星旁边。",
    completedText
  }
};

export const recoveryPointPositions = [
  { x: 20, y: 30 },
  { x: 34, y: 50 },
  { x: 47, y: 28 },
  { x: 61, y: 55 },
  { x: 75, y: 32 },
  { x: 83, y: 47 },
  { x: 29, y: 68 }
];

export function getRecoveryInteractionConfig(emotion) {
  return recoveryInteractionConfig[emotion] || recoveryInteractionConfig.calm;
}
