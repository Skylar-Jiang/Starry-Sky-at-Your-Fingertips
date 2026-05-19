import { Hand, MousePointer2, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useHandGestureEngine } from "../gesture/useHandGestureEngine";
import { useGestureExperiment } from "../hooks/useGestureExperiment";
import GestureHud from "./GestureHud";
import GestureOnboardingCard from "./GestureOnboardingCard";
import HandPointerLayer from "./HandPointerLayer";

const gestureHints = {
  idle: "OK 手势：打开记录情绪的信纸。",
  calm: "OK 手势：打开记录情绪的信纸。",
  writing: "OK 手势：提交这张纸条。",
  paperReady: "五指合拢：把信纸折成纸团。",
  paperFolded: "五指抓住纸团后会锁定，轻轻上推或点击投出。",
  throwing: "纸团正在飞向星空。",
  recoveryPrompt: "五指合拢并揉动：推动当前恢复互动。",
  wishTrail: "单指在星空区域画出愿望星轨。"
};

export default function GestureExperimentPanel({
  onClose,
  flowPhase = "idle",
  sceneRef,
  gestureContext,
  onGestureEvent
}) {
  const gesture = useGestureExperiment();
  const videoRef = useRef(null);
  const [actionMessage, setActionMessage] = useState("");

  useEffect(() => {
    if (videoRef.current) videoRef.current.srcObject = gesture.stream;
  }, [gesture.stream]);

  const handleGestureEvent = useCallback(
    (event) => {
      setActionMessage("");
      onGestureEvent?.(event);
    },
    [onGestureEvent]
  );

  const engine = useHandGestureEngine({
    enabled: gesture.status === "live",
    videoRef,
    sceneRef,
    context: gestureContext,
    onGestureEvent: handleGestureEvent,
    numHands: 2
  });

  function simulate(type, message) {
    engine.simulateGesture(type);
    setActionMessage(message);
  }

  function handleStopCamera() {
    gesture.stopCamera();
    setActionMessage("摄像头已停止，模拟按钮和鼠标/触屏仍可继续。");
  }

  const statusMessage = actionMessage || engine.message || gesture.message;
  const currentHint = gestureContext?.wishTrailMode ? gestureHints.wishTrail : gestureHints[flowPhase] || gestureHints.idle;

  return (
    <>
      <HandPointerLayer pointer={engine.pointer} />
      <GestureHud status={engine.hudStatus} />
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
              {gesture.status === "live" && gesture.stream ? (
                <video ref={videoRef} className="gesture-video" aria-label="摄像头实时预览" autoPlay muted playsInline />
              ) : (
                <div className="gesture-camera-placeholder">
                  {gesture.status === "requesting" ? "正在请求摄像头..." : "摄像头未开启"}
                </div>
              )}
              <span className={`gesture-preview-state is-${engine.pointer.status || "searching"}`} />
            </div>

            <div className="gesture-panel-copy">
              <p className="gesture-phase-hint">{currentHint}</p>
              <GestureOnboardingCard />
              <div className="gesture-actions">
                <button className="primary-button" type="button" onClick={gesture.startCamera}>
                  <Hand size={18} />
                  {gesture.status === "live" ? "重启摄像头" : "开启摄像头实验"}
                </button>
                <button className="secondary-button" type="button" onClick={handleStopCamera}>
                  停止摄像头
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => simulate("ok_open_letter", "已模拟 OK 手势。")}
                >
                  OK
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    simulate(
                      flowPhase === "recoveryPrompt" ? "fist_knead_complete" : "fist_hold_start",
                      flowPhase === "recoveryPrompt" ? "已模拟五指合拢揉云。" : "已模拟五指合拢。"
                    )
                  }
                >
                  五指合拢
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() =>
                    simulate("star_throw_release", "已模拟锁定后投掷。")
                  }
                >
                  投掷
                </button>
                <button
                  className="secondary-button"
                  type="button"
                  onClick={() => simulate("wish_pose_complete", "已模拟 V 手势开启许愿。")}
                >
                  V 手势许愿
                </button>
              </div>

              {statusMessage ? (
                <p className={`gesture-status gesture-status-${gesture.status}`}>
                  <MousePointer2 size={16} />
                  {statusMessage}
                </p>
              ) : null}
              <p className="gesture-debug-line">
                hands: {engine.hudStatus.debug?.handsCount || 0} / source: {engine.hudStatus.source}
              </p>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
