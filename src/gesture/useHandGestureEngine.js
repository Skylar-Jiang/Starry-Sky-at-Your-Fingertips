import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { gestureConfig as defaultGestureConfig } from "./gestureConfig";
import { createGestureStateMachine } from "./gestureStateMachine";
import { gestureSources } from "./gestureTypes";
import { formatFailureReason, formatGestureEventLabel, formatGestureLabel } from "./gestureDebugFormatters";

const HAND_MODEL_URL =
  "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/latest/hand_landmarker.task";
const WASM_BASE_URL = "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.35/wasm";

function resolveRect(ref) {
  return ref?.current?.getBoundingClientRect?.() || {
    left: 0,
    top: 0,
    width: typeof window === "undefined" ? 1000 : window.innerWidth,
    height: typeof window === "undefined" ? 800 : window.innerHeight
  };
}

function normalizeMediaPipeHands(result) {
  const landmarks = result?.landmarks || [];
  const handedness = result?.handednesses || result?.handedness || [];
  return landmarks.map((handLandmarks, index) => ({
    landmarks: handLandmarks,
    handedness:
      handedness[index]?.[0]?.categoryName ||
      handedness[index]?.[0]?.displayName ||
      handedness[index]?.categoryName ||
      "unknown"
  }));
}

export function useHandGestureEngine({
  enabled,
  videoRef,
  sceneRef,
  context = {},
  onGestureEvent,
  config = defaultGestureConfig,
  modelUrl = HAND_MODEL_URL,
  wasmBaseUrl = WASM_BASE_URL,
  numHands = 2
} = {}) {
  const machineRef = useRef(createGestureStateMachine(config));
  const contextRef = useRef(context);
  const onGestureEventRef = useRef(onGestureEvent);
  const [cameraStatus, setCameraStatus] = useState("idle");
  const [message, setMessage] = useState("");
  const [lastEvent, setLastEvent] = useState(null);
  const [engineState, setEngineState] = useState({
    pointerStatus: "searching",
    pointer: null,
    confidence: 0,
    progress: {},
    debug: { handsCount: 0 }
  });

  useEffect(() => {
    contextRef.current = context;
  }, [context]);

  useEffect(() => {
    onGestureEventRef.current = onGestureEvent;
  }, [onGestureEvent]);

  useEffect(() => {
    machineRef.current = createGestureStateMachine(config);
  }, [config]);

  const emitEvent = useCallback((event) => {
    setLastEvent(event);
    setMessage(formatGestureEventLabel(event.type));
    onGestureEventRef.current?.(event);
  }, []);

  const processHands = useCallback(
    ({ hands, timestamp = performance.now(), source = gestureSources.MEDIAPIPE }) => {
      const result = machineRef.current.updateFrame({
        hands,
        sceneRect: resolveRect(sceneRef),
        timestamp,
        context: contextRef.current,
        source
      });
      setEngineState(result.state);
      result.events.forEach(emitEvent);
      return result;
    },
    [emitEvent, sceneRef]
  );

  useEffect(() => {
    let isCancelled = false;
    let animationFrameId = 0;
    let handLandmarker = null;

    async function start() {
      if (!enabled || !videoRef?.current) {
        setCameraStatus("idle");
        setEngineState((value) => ({ ...value, pointerStatus: "searching", pointer: null }));
        return;
      }

      setCameraStatus("loading");
      setMessage("正在加载手势识别模型。");

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
        setCameraStatus("ready");
        setMessage("摄像头只在浏览器本地提取手部关键点。");

        const readFrame = () => {
          const video = videoRef?.current;
          if (!video || isCancelled) return;
          if (video.readyState >= 2) {
            const timestamp = performance.now();
            const result = handLandmarker.detectForVideo(video, timestamp);
            processHands({ hands: normalizeMediaPipeHands(result), timestamp, source: gestureSources.MEDIAPIPE });
          }
          animationFrameId = requestAnimationFrame(readFrame);
        };
        animationFrameId = requestAnimationFrame(readFrame);
      } catch (error) {
        if (!isCancelled) {
          setCameraStatus("error");
          setMessage("摄像头手势暂时不可用，鼠标/触屏和模拟按钮仍可继续。");
        }
      }
    }

    start();
    return () => {
      isCancelled = true;
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      handLandmarker?.close?.();
    };
  }, [enabled, modelUrl, numHands, processHands, videoRef, wasmBaseUrl]);

  const pointer = useMemo(
    () => ({
      ...(engineState.pointer || { x: 0, y: 0 }),
      status: engineState.pointerStatus || "searching",
      confidence: engineState.confidence || 0,
      progress:
        engineState.progress?.fistKnead ||
        engineState.progress?.trail ||
        engineState.progress?.wishPose ||
        engineState.progress?.prayer ||
        0
    }),
    [engineState]
  );

  const hudStatus = useMemo(
    () => ({
      label: lastEvent ? formatGestureEventLabel(lastEvent.type) : formatGestureLabel(pointer.status),
      cameraStatus,
      confidence: pointer.confidence || 0,
      progress: pointer.progress || 0,
      failureReason: formatFailureReason(lastEvent) || (cameraStatus === "error" ? "摄像头不可用时，请继续使用鼠标或触屏。" : ""),
      source: lastEvent?.source || config.defaultSource,
      debug: {
        ...engineState.debug,
        event: lastEvent?.type,
        videoStaysLocal: config.camera.videoStaysLocal,
        sendRawVideoToBackend: config.camera.sendRawVideoToBackend
      }
    }),
    [cameraStatus, config, engineState.debug, lastEvent, pointer.confidence, pointer.progress, pointer.status]
  );

  const simulateGesture = useCallback(
    (type, payload = {}) => {
      const event = {
        type,
        confidence: payload.confidence ?? 0.85,
        source: gestureSources.SIMULATION,
        hand: payload.hand || "unknown",
        pointer: payload.pointer || pointer,
        velocity: payload.velocity || { x: 0, y: 0, speed: 0 },
        timestamp: payload.timestamp || performance.now(),
        debug: payload.debug || {}
      };
      emitEvent(event);
    },
    [emitEvent, pointer]
  );

  return {
    cameraStatus,
    message,
    pointer,
    hudStatus,
    lastEvent,
    engineState,
    processHands,
    simulateGesture
  };
}
