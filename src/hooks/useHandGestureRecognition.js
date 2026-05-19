import { useEffect, useRef, useState } from "react";
import { microInteractionConfig } from "../config/microInteractionConfig";
import {
  createPrayerHoldTracker,
  detectPinch as detectPinchState,
  detectPrayerGesture,
  getPalmCenter as getGesturePalmCenter,
  landmarkDistance,
  mapLandmarkToElementPoint
} from "../utils/gestureUtils";

const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DEFAULT_COOLDOWN_MS = 900;
const fingerTipIndexes = [4, 8, 12, 16, 20];

export { landmarkDistance };

export function detectPinch(landmarks, threshold = 0.075) {
  return landmarkDistance(landmarks?.[4], landmarks?.[8]) < threshold;
}

export function getPalmCenter(landmarks) {
  return getGesturePalmCenter(landmarks);
}

export function detectFiveFingerClose(landmarks, averageThreshold = 0.18) {
  const palmCenter = getPalmCenter(landmarks || []);
  if (!palmCenter) return false;

  const averageTipDistance =
    fingerTipIndexes.reduce((total, index) => total + landmarkDistance(landmarks[index], palmCenter), 0) /
    fingerTipIndexes.length;

  return averageTipDistance < averageThreshold;
}

function detectGesture(landmarks) {
  if (detectFiveFingerClose(landmarks)) return "fiveFingerClose";
  if (detectPinch(landmarks)) return "pinch";
  return "";
}

export function useHandGestureRecognition({
  videoRef,
  enabled,
  onGesture,
  onPrayerDetected,
  onFrameGesture,
  overlayRef,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  modelUrl = HAND_MODEL_URL,
  wasmBaseUrl = WASM_BASE_URL,
  numHands = 2
}) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [lastGesture, setLastGesture] = useState("");
  const [gestureDebug, setGestureDebug] = useState({
    handsCount: 0,
    prayerScore: 0,
    prayerProgress: 0,
    pinchDetected: false,
    message: microInteractionConfig.gesture.prayer.statusMessages.noCamera
  });
  const lastTriggerRef = useRef(0);
  const prayerTrackerRef = useRef(createPrayerHoldTracker(microInteractionConfig.gesture.prayer));
  const previousPinchingRef = useRef(false);
  const smoothedPinchRef = useRef(null);

  useEffect(() => {
    let isCancelled = false;
    let animationFrameId = 0;
    let handLandmarker = null;

    async function startRecognition() {
      if (!enabled || !videoRef.current) {
        setStatus("idle");
        setMessage("");
        setLastGesture("");
        setGestureDebug((value) => ({
          ...value,
          handsCount: 0,
          prayerProgress: 0,
          message: microInteractionConfig.gesture.prayer.statusMessages.noCamera
        }));
        return;
      }

      setStatus("loading");
      setMessage("正在加载手势识别模型");

      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");
        if (isCancelled) return;

        const vision = await FilesetResolver.forVisionTasks(wasmBaseUrl);
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands
        });

        if (isCancelled) {
          await handLandmarker.close?.();
          return;
        }

        setStatus("ready");
        setMessage("真实手势识别已开启");

        const readFrame = () => {
          const video = videoRef.current;
          if (!video || isCancelled) return;

          if (video.readyState >= 2) {
            const timestamp = performance.now();
            const result = handLandmarker.detectForVideo(video, timestamp);
            const hands = result.landmarks || [];
            const gestureName = detectGesture(hands[0]);
            const prayerEnabled = microInteractionConfig.gesture.prayer.enabled;
            const prayerState = prayerEnabled
              ? detectPrayerGesture(hands, microInteractionConfig.gesture.prayer)
              : {
                  handsCount: hands.length,
                  prayerScore: 0,
                  isPraying: false,
                  reason: "disabled"
                };
            const prayerHoldState = prayerEnabled
              ? prayerTrackerRef.current.update({
                  prayerScore: prayerState.prayerScore,
                  timestamp
                })
              : { holdProgress: 0, triggered: false };
            const pinchState = detectPinchState(hands[0] || [], {
              previousPinching: previousPinchingRef.current,
              startThreshold: microInteractionConfig.gesture.pinch.startThreshold,
              endThreshold: microInteractionConfig.gesture.pinch.endThreshold
            });
            previousPinchingRef.current = pinchState.isPinching;

            let pinchPoint = null;
            if (pinchState.midpoint && overlayRef?.current) {
              const rect = overlayRef.current.getBoundingClientRect();
              const mapped = mapLandmarkToElementPoint(pinchState.midpoint, rect);
              const smoothing = microInteractionConfig.gesture.pinch.smoothing;
              pinchPoint = smoothedPinchRef.current
                ? {
                    x: smoothedPinchRef.current.x * smoothing + mapped.x * (1 - smoothing),
                    y: smoothedPinchRef.current.y * smoothing + mapped.y * (1 - smoothing)
                  }
                : mapped;
              smoothedPinchRef.current = pinchPoint;
            }

            const messages = microInteractionConfig.gesture.prayer.statusMessages;
            const debugMessage = !prayerEnabled
              ? hands.length === 0
                ? messages.noHands
                : pinchState.isPinching
                  ? "已看到 OK/捏合，准备触发当前阶段动作。"
                  : "已识别到手的位置，可以尝试 OK/捏合。"
              : prayerHoldState.triggered
                ? messages.success
                : prayerState.handsCount === 0
                  ? messages.noHands
                  : prayerState.handsCount === 1
                    ? messages.oneHand
                    : prayerState.reason === "tooFar"
                      ? messages.tooFar
                      : prayerState.isPraying
                        ? `保持实验手势 ${Math.round(prayerHoldState.holdProgress * 100)}%`
                        : messages.handsReady;

            const nextDebug = {
              handsCount: prayerState.handsCount,
              prayerScore: prayerState.prayerScore,
              prayerProgress: prayerHoldState.holdProgress,
              pinchDetected: pinchState.isPinching,
              pinchPoint,
              message: debugMessage
            };
            setGestureDebug(nextDebug);
            onFrameGesture?.({
              hands,
              prayerState,
              prayerHoldState,
              pinchState,
              pinchPoint,
              pinchPointNormalized: pinchState.midpoint || null
            });

            if (prayerEnabled && prayerHoldState.triggered) onPrayerDetected?.("gesture");

            if (gestureName && timestamp - lastTriggerRef.current >= cooldownMs) {
              lastTriggerRef.current = timestamp;
              setLastGesture(gestureName);
              onGesture?.(gestureName);
            }
          }

          animationFrameId = requestAnimationFrame(readFrame);
        };

        animationFrameId = requestAnimationFrame(readFrame);
      } catch (error) {
        if (!isCancelled) {
          setStatus("error");
          setMessage("手势识别暂时不可用，模拟按钮仍可测试流程");
        }
      }
    }

    startRecognition();

    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      handLandmarker?.close?.();
    };
  }, [cooldownMs, enabled, modelUrl, numHands, onFrameGesture, onGesture, onPrayerDetected, overlayRef, videoRef, wasmBaseUrl]);

  return {
    status,
    message,
    lastGesture,
    gestureDebug
  };
}
