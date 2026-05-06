import { Hand, MousePointer2, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useGestureExperiment } from "../hooks/useGestureExperiment";
import { useHandGestureRecognition } from "../hooks/useHandGestureRecognition";
import { createGestureActionDispatcher } from "../utils/gestureActions";

const gestureHints = {
  idle: "OK/捏合：打开记录弹窗",
  calm: "OK/捏合：打开记录弹窗",
  writing: "OK/捏合：完成这张纸条",
  paperReady: "五指合拢：把信纸捏成纸团",
  paperFolded: "OK/捏合：投向星空",
  throwing: "纸团正在飞向星空",
  recoveryPrompt: "OK/捏合：点亮星空微光"
};

export default function GestureExperimentPanel({ onClose, flowPhase = "idle", onSimulatePinch, onSimulateFold }) {
  const gesture = useGestureExperiment();
  const videoRef = useRef(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.srcObject = gesture.stream;
    }
  }, [gesture.stream]);

  const triggerPinch = useCallback(
    (source = "simulation") => {
      onSimulatePinch?.();
      setActionMessage(
        source === "camera" ? "识别到 OK/捏合：已触发当前阶段动作。" : "已模拟 OK/捏合：已触发当前阶段动作。"
      );
    },
    [onSimulatePinch]
  );

  const triggerFold = useCallback(
    (source = "simulation") => {
      onSimulateFold?.();
      setActionMessage(
        source === "camera" ? "识别到五指合拢：已触发折成纸团动作。" : "已模拟五指合拢：已触发折成纸团动作。"
      );
    },
    [onSimulateFold]
  );

  const dispatchCameraGesture = useMemo(
    () =>
      createGestureActionDispatcher({
        onPinch: () => triggerPinch("camera"),
        onFold: () => triggerFold("camera")
      }),
    [triggerFold, triggerPinch]
  );

  const recognition = useHandGestureRecognition({
    videoRef,
    enabled: gesture.status === "live",
    onGesture: dispatchCameraGesture
  });

  function handleStopCamera() {
    gesture.stopCamera();
    setActionMessage("摄像头已停止，模拟按钮仍可继续测试。");
  }

  function renderCameraPreview() {
    if (gesture.status === "live" && gesture.stream) {
      return (
        <video
          ref={videoRef}
          className="gesture-video"
          aria-label="摄像头实时预览"
          autoPlay
          muted
          playsInline
        />
      );
    }

    const previewText = gesture.status === "requesting" ? "正在请求摄像头..." : "摄像头未开启";

    return <div className="gesture-camera-placeholder">{previewText}</div>;
  }

  const statusMessage = actionMessage || recognition.message || gesture.message;

  return (
    <div className="gesture-monitor-shell">
      <section className="gesture-monitor-panel" role="dialog" aria-label="手势实验">
        <div className="gesture-monitor-heading">
          <div>
            <p className="eyebrow">Gesture Lab</p>
            <h2>手势实验</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭手势实验">
            <X size={20} />
          </button>
        </div>

        <div className="gesture-layout">
          <div className="gesture-camera-preview" aria-label="摄像头预览区域">
            {renderCameraPreview()}
          </div>

          <div>
            <p className="gesture-phase-hint">{gestureHints[flowPhase] || gestureHints.idle}</p>
            <div className="gesture-actions">
              <button className="primary-button" type="button" onClick={gesture.startCamera}>
                <Hand size={18} />
                {gesture.status === "live" ? "重启摄像头" : "开启摄像头实验"}
              </button>
              <button className="secondary-button" type="button" onClick={handleStopCamera}>
                停止摄像头
              </button>
              <button className="secondary-button" type="button" onClick={() => triggerPinch("simulation")}>
                OK/捏合
              </button>
              <button className="secondary-button" type="button" onClick={() => triggerFold("simulation")}>
                五指合拢
              </button>
            </div>

            {statusMessage ? (
              <p className={`gesture-status gesture-status-${gesture.status}`}>
                <MousePointer2 size={16} />
                {statusMessage}
              </p>
            ) : null}
          </div>
        </div>
      </section>
    </div>
  );
}
