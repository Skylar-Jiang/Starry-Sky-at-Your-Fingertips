import { gestureSources, handLabels } from "./gestureTypes";
import {
  calculateVelocity,
  classifyHands,
  landmarkDistance,
  mapNormalizedPointToScreen,
  resolvePointerPoint
} from "./landmarkUtils";

function makeEvent(type, state, overrides = {}) {
  const timestamp = overrides.timestamp ?? state.timestamp ?? performance.now();
  return {
    type,
    confidence: overrides.confidence ?? state.confidence ?? 0.7,
    source: overrides.source || gestureSources.MEDIAPIPE,
    hand: overrides.hand || state.hand || handLabels.UNKNOWN,
    pointer: overrides.pointer || state.pointer || null,
    velocity: overrides.velocity || state.velocity || { x: 0, y: 0, speed: 0 },
    timestamp,
    debug: overrides.debug || state.debug || {}
  };
}

function distancePx(a, b) {
  if (!a || !b) return 0;
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function isKneadContext(context, config) {
  if (context.recoveryInteractionType && config.fistKnead.targetModes.includes(context.recoveryInteractionType)) return true;
  return context.flowPhase === "recoveryPrompt";
}

export function createGestureStateMachine(config) {
  const stableSince = {};
  const cooldowns = {};
  let lastPointer = null;
  let trajectory = [];
  let fistActive = false;
  let kneadProgress = 0;
  let kneadDirection = 0;
  let throwGrab = null;
  let trailActive = false;
  let trailStartedAt = 0;
  let trailLength = 0;
  let lastPointingPoint = null;

  function cooldownReady(name, timestamp, cooldownMs) {
    return timestamp - (cooldowns[name] || -Number.POSITIVE_INFINITY) >= cooldownMs;
  }

  function markTriggered(name, timestamp) {
    cooldowns[name] = timestamp;
  }

  function stable(name, active, timestamp, stableMs) {
    if (!active) {
      stableSince[name] = null;
      return false;
    }
    if (stableSince[name] == null) stableSince[name] = timestamp;
    return timestamp - stableSince[name] >= stableMs;
  }

  function resetTransientWhenNoHand() {
    stableSince.ok = null;
    stableSince.fist = null;
    stableSince.pointing = null;
    stableSince.wishPose = null;
    fistActive = false;
    throwGrab = null;
    lastPointer = null;
    trajectory = [];
    if (trailActive) {
      trailActive = false;
      trailLength = 0;
      lastPointingPoint = null;
    }
  }

  function updateFrame({ hands = [], sceneRect, timestamp = performance.now(), context = {}, source = gestureSources.MEDIAPIPE } = {}) {
    const classified = classifyHands(hands, {
      thumbIndexRatio: config.ok.thumbIndexRatio,
      requireOtherFingersExtended: config.ok.requireOtherFingersExtended
    });
    const events = [];
    const primary = classified[0];
    const state = {
      timestamp,
      hand: primary?.handedness || handLabels.UNKNOWN,
      pointer: null,
      velocity: { x: 0, y: 0, speed: 0 },
      confidence: 0,
      progress: { fistKnead: kneadProgress, wishPose: 0, trail: trailLength },
      debug: {
        handsCount: classified.length,
        reason: "searching"
      }
    };

    if (!primary || !sceneRect) {
      if (trailActive) {
        events.push(makeEvent("wish_trail_end", state, {
          source,
          confidence: 0.62,
          debug: { reason: "handLost", trailLength }
        }));
      }
      resetTransientWhenNoHand();
      return { events, state: { ...state, pointerStatus: "searching" } };
    }

    const shape = primary.shape;
    let pointerStatus = "tracking";
    if (shape.isOk) pointerStatus = "ok";
    else if (shape.isFist) pointerStatus = throwGrab ? "throwing" : "fist";
    else if (shape.isPinching) pointerStatus = "pinching";
    else if (shape.isWishPose) pointerStatus = "wish";
    else if (trailActive || shape.isPointing) pointerStatus = "drawing";

    const normalizedPointer = resolvePointerPoint(primary.landmarks, { status: pointerStatus });
    const pointer = mapNormalizedPointToScreen(normalizedPointer, sceneRect, { mirrorX: config.smoothing.mirrorX });
    state.pointer = pointer;
    state.pointerStatus = pointerStatus;
    state.confidence = Math.max(shape.openScore, shape.fistScore, shape.isOk ? 0.9 : 0.55);
    state.debug = {
      handsCount: classified.length,
      pointerStatus,
      fistScore: shape.fistScore,
      openScore: shape.openScore,
      thumbIndexRatio: shape.thumbIndexRatio,
      isWishPose: shape.isWishPose,
      reason: "tracking"
    };

    trajectory = [...trajectory, { ...pointer, timestamp }].filter(
      (point) => timestamp - point.timestamp <= Math.max(config.smoothing.velocityWindowMs, 700)
    );
    state.velocity = calculateVelocity(trajectory, config.smoothing.velocityWindowMs);

    if (config.ok.enabled && shape.isOk) {
      const okStable = stable("ok", true, timestamp, config.ok.stableMs);
      if (okStable && cooldownReady("ok", timestamp, config.ok.cooldownMs)) {
        markTriggered("ok", timestamp);
        events.push(makeEvent("ok_open_letter", state, { source, confidence: 0.9 }));
      }
    } else {
      stable("ok", false, timestamp, config.ok.stableMs);
    }

    const pinchCandidate = shape.isPinching && !shape.isOk && !shape.isFist;
    if (pinchCandidate && !stableSince.pinching) {
      stableSince.pinching = timestamp;
      events.push(makeEvent("pinch_start", state, { source, confidence: 0.74 }));
    } else if (pinchCandidate) {
      events.push(makeEvent("pinch_move", state, { source, confidence: 0.7 }));
    } else if (stableSince.pinching) {
      stableSince.pinching = null;
      events.push(makeEvent("pinch_end", state, { source, confidence: 0.68 }));
    }

    if (config.fistKnead.enabled && shape.isFist) {
      if (!fistActive) {
        fistActive = true;
        kneadProgress = 0;
        kneadDirection = 0;
        events.push(makeEvent("fist_hold_start", state, { source, confidence: shape.fistScore }));
      }
      const movement = distancePx(lastPointer, pointer);
      if (movement > 0 && isKneadContext(context, config)) {
        const direction = Math.sign((pointer.x - (lastPointer?.x || pointer.x)) || (pointer.y - (lastPointer?.y || pointer.y)));
        const directionBonus = config.fistKnead.directionChangeBonus && kneadDirection && direction && direction !== kneadDirection ? 0.18 : 0;
        kneadDirection = direction || kneadDirection;
        kneadProgress = Math.min(1, kneadProgress + movement / config.fistKnead.minMovementPx * 0.25 + directionBonus);
        state.progress.fistKnead = kneadProgress;
        events.push(makeEvent("fist_knead", state, { source, confidence: shape.fistScore, debug: { progress: kneadProgress } }));
        if (kneadProgress >= 1 && cooldownReady("fistKnead", timestamp, config.fistKnead.cooldownMs)) {
          markTriggered("fistKnead", timestamp);
          events.push(makeEvent("fist_knead_complete", state, { source, confidence: shape.fistScore }));
        }
      }
    } else {
      fistActive = false;
      kneadDirection = 0;
    }

    if (config.throw.enabled && context.flowPhase === "paperFolded") {
      const isGrabShape = shape.isFist || shape.isPinching;
      const target = context.throwTarget || pointer;
      const nearTarget = !target || distancePx(pointer, target) <= config.throw.grabRadiusPx;
      if (isGrabShape && nearTarget && !throwGrab && cooldownReady("throw", timestamp, config.throw.cooldownMs)) {
        throwGrab = { startedAt: timestamp, lastFastAt: null };
        events.push(makeEvent("star_throw_charge", state, { source, confidence: shape.isFist ? shape.fistScore : 0.78 }));
      }
      if (throwGrab) {
        const heldLongEnough = timestamp - throwGrab.startedAt >= config.throw.minHoldMs;
        const velocity = state.velocity;
        const fastUp =
          velocity.speed >= config.throw.minSpeedPxPerSec &&
          velocity.y <= -config.throw.minUpwardVelocityPxPerSec;
        if (fastUp) throwGrab.lastFastAt = timestamp;
        const released =
          heldLongEnough &&
          (shape.isOpen || (!isGrabShape && config.throw.fallbackReleaseOnFastFlick)) &&
          throwGrab.lastFastAt != null &&
          timestamp - throwGrab.lastFastAt <= config.throw.releaseWindowMs;
        if (released) {
          markTriggered("throw", timestamp);
          events.push(makeEvent("star_throw_release", state, { source, confidence: 0.86, velocity }));
          throwGrab = null;
        } else if (!isGrabShape && timestamp - throwGrab.startedAt > config.throw.releaseWindowMs) {
          events.push(makeEvent("gesture_cancel", state, { source, confidence: 0.45, debug: { reason: "throwTooSlow" } }));
          throwGrab = null;
        }
      }
    } else {
      throwGrab = null;
    }

    if (config.wishPose?.enabled) {
      const wishPoseActive = shape.isWishPose;
      state.progress.wishPose = wishPoseActive
        ? Math.min(1, (timestamp - (stableSince.wishPose ?? timestamp)) / config.wishPose.stableMs)
        : 0;
      if (
        stable("wishPose", wishPoseActive, timestamp, config.wishPose.stableMs) &&
        cooldownReady("wishPose", timestamp, config.wishPose.cooldownMs)
      ) {
        markTriggered("wishPose", timestamp);
        events.push(
          makeEvent("wish_pose_complete", state, {
            source,
            confidence: 0.82,
            debug: { reason: "oneHandVictory", preferredGesture: config.wishPose.preferredGesture }
          })
        );
      }
    } else {
      stable("wishPose", false, timestamp, config.wishPose?.stableMs || 0);
    }

    if (config.pointingTrail.enabled && context.wishTrailMode) {
      const pointingReady = stable("pointing", shape.isPointing, timestamp, config.pointingTrail.stableMs);
      if (pointingReady && !trailActive) {
        trailActive = true;
        trailStartedAt = timestamp;
        trailLength = 0;
        lastPointingPoint = pointer;
        events.push(makeEvent("wish_trail_start", state, { source, confidence: 0.78 }));
      } else if (trailActive && shape.isPointing) {
        const movement = distancePx(lastPointingPoint, pointer);
        if (movement >= config.pointingTrail.minPointDistancePx) {
          trailLength += movement;
          lastPointingPoint = pointer;
          state.progress.trail = Math.min(1, trailLength / config.pointingTrail.minTrailLengthPx);
          events.push(makeEvent("wish_trail_draw", state, { source, confidence: 0.76, debug: { trailLength } }));
        }
        if (timestamp - trailStartedAt >= config.pointingTrail.maxTrailTimeMs) {
          trailActive = false;
          events.push(makeEvent("wish_trail_end", state, { source, confidence: 0.72, debug: { reason: "maxTrailTime" } }));
        }
      } else if (trailActive && (shape.isOpen || shape.isOk)) {
        trailActive = false;
        events.push(makeEvent("wish_trail_end", state, { source, confidence: 0.8, debug: { trailLength } }));
      }
    } else {
      trailActive = false;
      stableSince.pointing = null;
    }

    lastPointer = pointer;
    state.progress = {
      fistKnead: kneadProgress,
      wishPose: state.progress.wishPose,
      trail: Math.min(1, trailLength / config.pointingTrail.minTrailLengthPx)
    };
    return { events, state };
  }

  return {
    updateFrame,
    reset() {
      Object.keys(stableSince).forEach((key) => {
        stableSince[key] = null;
      });
      Object.keys(cooldowns).forEach((key) => {
        cooldowns[key] = null;
      });
      lastPointer = null;
      trajectory = [];
      fistActive = false;
      kneadProgress = 0;
      kneadDirection = 0;
      throwGrab = null;
      trailActive = false;
      trailStartedAt = 0;
      trailLength = 0;
      lastPointingPoint = null;
    }
  };
}
