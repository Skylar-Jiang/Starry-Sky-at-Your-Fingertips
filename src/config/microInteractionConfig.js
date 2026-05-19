export const microInteractionConfig = {
  wish: {
    holdMs: 1200,
    durationMs: 2400,
    defaultMessage: "愿望已经被星空轻轻收下。",
    emotionMessages: {
      happy: "这份开心，被星空放大了一点。",
      calm: "愿望安静地落进了星河。",
      wronged: "那些没说出口的话，星空听见了。",
      angry: "火光慢慢落下，愿望还在发亮。",
      verySad: "很轻的一颗星，也可以陪你很久。",
      anxious: "乱云后面，愿望还在闪光。"
    }
  },
  wishTrail: {
    enabled: true,
    mode: "drawTrail",
    minTrailLengthDesktop: 200,
    minTrailLengthMobile: 150,
    maxPoints: 56,
    minPointDistance: 4,
    smoothing: 0.35,
    collapseMs: 800,
    orbPulseMs: 500,
    orbFlyMs: 1000,
    wishMarkMs: 5200,
    stardustPerMove: 1,
    reducedMotionMaxPoints: 24,
    reducedMotionStardustPerMove: 0,
    messages: {
      idle: "按住星空，拖出一小段愿望的星轨。",
      drawing: "拖出一段星光，把愿望写进夜空。",
      tooShort: "再画长一点，星星就听见了。",
      ready: "松手，把愿望交给星空。",
      success: "这段星光，替你把愿望送远了一点。",
      failed: "星光太短了，再试一次也没关系。"
    }
  },
  wishHoldFallback: {
    enabled: true,
    holdMs: 1700,
    message: "也可以长按这颗星许愿。"
  },
  gesture: {
    prayer: {
      enabled: false,
      experimental: true,
      holdMs: 1000,
      cooldownMs: 3000,
      scoreThreshold: 0.75,
      maxPalmDistanceRatio: 1.5,
      maxPalmHeightDeltaRatio: 0.7,
      statusMessages: {
        noCamera: "摄像头手势仍是实验功能，鼠标和触屏体验更稳定。",
        noHands: "正在寻找手的位置。",
        oneHand: "单手捏合可以尝试触发当前阶段动作。",
        handsReady: "已识别到手势，实验功能可能不稳定。",
        tooFar: "手势距离还不太稳定。",
        praying: "实验手势正在保持...",
        success: "实验手势已触发当前阶段动作。"
      }
    },
    pinch: {
      enabled: true,
      startThreshold: 0.35,
      endThreshold: 0.48,
      smoothing: 0.75,
      selectRadius: 180
    }
  },
  meteor: {
    durationMs: 7000,
    defaultCount: 22,
    reducedMotionCount: 4,
    directionMode: "per-shower",
    directionOptions: ["down-left", "down-right"],
    directionJitterDeg: 8,
    dominantRatio: 0.86,
    longMeteorCount: 3,
    cooldownMs: 800
  },
  celebration: {
    defaultParticleCount: 18,
    reducedMotionParticleCount: 6,
    durationMs: 1200,
    emotionVariants: {
      happy: "warmStarburst"
    }
  },
  cloudKnead: {
    mode: "mistReveal",
    enabledEmotions: ["anxious"],
    holdToStartMs: 120,
    progressPerPixel: 0.003,
    progressPerSecond: 0.08,
    requiredProgress: 1,
    maxCloudScaleDelta: 0.04,
    stardustPerMove: 2,
    pinchProgressPerFrame: 0.34,
    dissolveParticleCount: 18,
    completeDelayMs: 650,
    promptByEmotion: {
      anxious: "在乱云上轻轻揉一揉。"
    },
    completeByEmotion: {
      anxious: "乱云散开了一点，星光进来了。"
    }
  },
  fallbackComplete: {
    enabled: true,
    showAfterIdleMs: 7000,
    variant: "subtle",
    text: "让星光帮我完成",
    hideDuringActiveGesture: true
  },
  drift: {
    enableLocalReplies: true,
    replyMaxLength: 120,
    replyStorageKey: "starry-sky-demo-drift-replies",
    sourceLabels: {
      local: "你的星星",
      sentDrift: "正在漂流",
      receivedDrift: "漂流而来",
      demoReceivedDrift: "漂流而来"
    }
  },
  recoveryInteractions: {
    happy: {
      interactionType: "swipeRelease",
      minDragDistance: 120,
      minUpwardDistance: 60,
      flyDurationMs: 900,
      burstParticleCount: 14,
      prompt: "按住星花，向上轻轻放飞。",
      readyPrompt: "松手，让它飞进星空。",
      shortPrompt: "再轻轻往上放一点。",
      progressLabel: "星花正在等你放飞。",
      complete: "星花已放飞。"
    },
    calm: {
      interactionType: "holdBreath",
      holdMs: 3800,
      pulseDurationMs: 1800,
      showNumericProgress: false,
      showRingProgress: true,
      prompt: "按住这颗光，陪它慢慢呼吸。",
      progressLabel: "正在呼吸...",
      complete: "一次慢慢的呼吸完成了。"
    },
    wronged: {
      interactionType: "dragTearsToTarget",
      requiredDrops: 2,
      prompt: "把雨滴拖到发光的湖面。",
      progressLabel: "已安放 0 / 2 滴雨。",
      complete: "雨滴被星空接住了。"
    },
    angry: {
      interactionType: "scrubCoolEmber",
      requiredDirectionChanges: 3,
      minTotalDistance: 280,
      prompt: "按住火星，来回擦一擦。",
      progressLabel: "火光正在慢慢降温...",
      complete: "火光散开了。"
    },
    verySad: {
      interactionType: "clickStardust",
      requiredStars: 3,
      prompt: "轻轻点亮湖底的星尘。",
      progressLabel: "已点亮 0 / 3 颗湖底星。",
      complete: "湖底的星星亮起来了。"
    },
    anxious: {
      interactionType: "cloudMistReveal",
      settleMs: 4200,
      prompt: "在乱云上轻轻揉一揉。",
      progressLabel: "星光正在透出来...",
      complete: "乱云散开了一点。"
    }
  }
};

export function getWishMessage(emotion) {
  return microInteractionConfig.wish.emotionMessages[emotion] || microInteractionConfig.wish.defaultMessage;
}

export function isCloudKneadEmotion(emotion) {
  return microInteractionConfig.cloudKnead.enabledEmotions.includes(emotion);
}
