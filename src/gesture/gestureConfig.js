export const gestureConfig = {
  enabled: true,
  backendMode: "optional",
  defaultSource: "mediapipe",

  camera: {
    videoStaysLocal: true,
    sendRawVideoToBackend: false
  },

  smoothing: {
    pointerAlpha: 0.25,
    velocityWindowMs: 450,
    minVisibility: 0.55,
    mirrorX: true
  },

  ok: {
    enabled: true,
    stableMs: 600,
    cooldownMs: 1500,
    thumbIndexRatio: 0.35,
    requireOtherFingersExtended: true
  },

  fistKnead: {
    enabled: true,
    stableMs: 300,
    minMovementPx: 60,
    directionChangeBonus: true,
    targetModes: ["cloudMistReveal"],
    cooldownMs: 1200
  },

  throw: {
    enabled: true,
    grabRadiusPx: 140,
    minHoldMs: 250,
    releaseWindowMs: 450,
    minSpeedPxPerSec: 850,
    minUpwardVelocityPxPerSec: 500,
    releaseRequiresOpenHand: false,
    fallbackReleaseOnFastFlick: true,
    cooldownMs: 2000,
    lockPointerOnCharge: true,
    preferredGesture: "grab-lock-open-palm-upward-push"
  },

  prayer: {
    enabled: false,
    experimental: true,
    stableMs: 1000,
    cooldownMs: 2500,
    palmDistanceRatio: 1.6,
    heightDeltaRatio: 0.75,
    startsWishTrailMode: true
  },

  wishPose: {
    enabled: true,
    stableMs: 700,
    cooldownMs: 1800,
    preferredGesture: "one-hand-victory",
    startsWishTrailMode: true
  },

  pointingTrail: {
    enabled: true,
    stableMs: 200,
    minPointDistancePx: 5,
    minTrailLengthPx: 160,
    maxTrailTimeMs: 9000,
    endOnOpenPalm: true,
    endOnOk: true
  },

  hud: {
    enabled: true,
    showConfidence: true,
    showDebugInDev: true,
    showHandPointer: true
  }
};
