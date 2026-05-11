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
    promptText: "雨滴落下来了。轻轻点它们，让委屈变成一点点星光。",
    completedText
  },
  angry: {
    label: "火星",
    progressLabel: "慢慢冷却火星",
    actionLabel: "轻点火星，让它慢慢冷却",
    className: "recovery-ember",
    sceneClassName: "recovery-scene-ember",
    asset: `${recoveryAssetRoot}/ember_angry.png`,
    resolvedAsset: `${recoveryAssetRoot}/ember_cooling.png`,
    count: 7,
    requiredCount: 5,
    promptText: "有些火星还在发热。点一点，让它们冷却成柔和的光。",
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
