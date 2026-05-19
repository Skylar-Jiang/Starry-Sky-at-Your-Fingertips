import { useMemo, useRef } from "react";
import { gestureConfig } from "./gestureConfig";

export function smoothPointer(previous, current, alpha = gestureConfig.smoothing.pointerAlpha) {
  if (!current) return { status: "searching", x: 0, y: 0, progress: 0, confidence: 0 };
  if (!previous || previous.status === "searching") return current;
  return {
    ...current,
    x: previous.x * (1 - alpha) + current.x * alpha,
    y: previous.y * (1 - alpha) + current.y * alpha
  };
}

export function useHandPointer(rawPointer, options = {}) {
  const previousRef = useRef(null);
  return useMemo(() => {
    const smoothed = smoothPointer(previousRef.current, rawPointer, options.alpha ?? gestureConfig.smoothing.pointerAlpha);
    previousRef.current = smoothed;
    return smoothed;
  }, [options.alpha, rawPointer]);
}
