import { useMemo } from "react";
import { useHandPointer } from "../gesture/useHandPointer";

export default function HandPointerLayer({ pointer }) {
  const smoothedPointer = useHandPointer(pointer);
  const visible = smoothedPointer?.status && smoothedPointer.status !== "searching";
  const progress = Math.max(0, Math.min(1, smoothedPointer?.progress || 0));
  const style = useMemo(
    () => ({
      left: `${smoothedPointer?.x || 0}px`,
      top: `${smoothedPointer?.y || 0}px`,
      "--gesture-progress": progress
    }),
    [progress, smoothedPointer?.x, smoothedPointer?.y]
  );

  return (
    <div className="hand-pointer-layer" aria-hidden="true" style={{ pointerEvents: "none" }}>
      {visible ? (
        <span className={`hand-pointer is-${smoothedPointer.status}`} style={style}>
          <span className="hand-pointer-ring" />
          <span className="hand-pointer-core" />
          <span className="hand-pointer-dust hand-pointer-dust-one" />
          <span className="hand-pointer-dust hand-pointer-dust-two" />
        </span>
      ) : null}
    </div>
  );
}
