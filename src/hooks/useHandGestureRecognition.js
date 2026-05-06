import { useEffect, useRef, useState } from "react";

const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@latest/wasm";
const DEFAULT_COOLDOWN_MS = 900;

const fingerTipIndexes = [4, 8, 12, 16, 20];

export function landmarkDistance(a, b) {
  if (!a || !b) {
    return Number.POSITIVE_INFINITY;
  }

  return Math.hypot(a.x - b.x, a.y - b.y, (a.z || 0) - (b.z || 0));
}

export function detectPinch(landmarks, threshold = 0.075) {
  return landmarkDistance(landmarks?.[4], landmarks?.[8]) < threshold;
}

export function getPalmCenter(landmarks) {
  const palmPoints = [landmarks?.[0], landmarks?.[5], landmarks?.[9], landmarks?.[13], landmarks?.[17]].filter(Boolean);

  if (!palmPoints.length) {
    return null;
  }

  return palmPoints.reduce(
    (center, point) => ({
      x: center.x + point.x / palmPoints.length,
      y: center.y + point.y / palmPoints.length,
      z: center.z + (point.z || 0) / palmPoints.length
    }),
    { x: 0, y: 0, z: 0 }
  );
}

export function detectFiveFingerClose(landmarks, averageThreshold = 0.18) {
  const palmCenter = getPalmCenter(landmarks || []);

  if (!palmCenter) {
    return false;
  }

  const averageTipDistance =
    fingerTipIndexes.reduce((total, index) => total + landmarkDistance(landmarks[index], palmCenter), 0) /
    fingerTipIndexes.length;

  return averageTipDistance < averageThreshold;
}

function detectGesture(landmarks) {
  if (detectFiveFingerClose(landmarks)) {
    return "fiveFingerClose";
  }

  if (detectPinch(landmarks)) {
    return "pinch";
  }

  return "";
}

export function useHandGestureRecognition({
  videoRef,
  enabled,
  onGesture,
  cooldownMs = DEFAULT_COOLDOWN_MS,
  modelUrl = HAND_MODEL_URL,
  wasmBaseUrl = WASM_BASE_URL
}) {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [lastGesture, setLastGesture] = useState("");
  const lastTriggerRef = useRef(0);

  useEffect(() => {
    let isCancelled = false;
    let animationFrameId = 0;
    let handLandmarker = null;

    async function startRecognition() {
      if (!enabled || !videoRef.current) {
        setStatus("idle");
        setMessage("");
        setLastGesture("");
        return;
      }

      setStatus("loading");
      setMessage("正在加载手势识别模型");

      try {
        const { FilesetResolver, HandLandmarker } = await import("@mediapipe/tasks-vision");

        if (isCancelled) {
          return;
        }

        const vision = await FilesetResolver.forVisionTasks(wasmBaseUrl);
        handLandmarker = await HandLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: modelUrl,
            delegate: "GPU"
          },
          runningMode: "VIDEO",
          numHands: 1
        });

        if (isCancelled) {
          await handLandmarker.close?.();
          return;
        }

        setStatus("ready");
        setMessage("真实手势识别已开启");

        const readFrame = () => {
          const video = videoRef.current;

          if (!video || isCancelled) {
            return;
          }

          if (video.readyState >= 2) {
            const result = handLandmarker.detectForVideo(video, performance.now());
            const gestureName = detectGesture(result.landmarks?.[0]);
            const now = performance.now();

            if (gestureName && now - lastTriggerRef.current >= cooldownMs) {
              lastTriggerRef.current = now;
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
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      handLandmarker?.close?.();
    };
  }, [cooldownMs, enabled, modelUrl, onGesture, videoRef, wasmBaseUrl]);

  return {
    status,
    message,
    lastGesture
  };
}
