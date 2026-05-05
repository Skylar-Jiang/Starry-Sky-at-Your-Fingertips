import { Hand, MousePointer2, X } from "lucide-react";
import { useGestureExperiment } from "../hooks/useGestureExperiment";

export default function GestureExperimentPanel({ onClose }) {
  const gesture = useGestureExperiment();

  return (
    <div className="modal-backdrop gesture-backdrop">
      <section className="gesture-panel" role="dialog" aria-label="手势实验">
        <div className="modal-heading">
          <div>
            <p className="eyebrow">Gesture Lab</p>
            <h2>手势实验</h2>
          </div>
          <button className="icon-button" type="button" onClick={onClose} aria-label="关闭手势实验">
            <X size={20} />
          </button>
        </div>

        <p className="gesture-note">实验功能，失败时请使用鼠标。</p>

        <div className="gesture-actions">
          <button className="primary-button" type="button" onClick={gesture.startCameraExperiment}>
            <Hand size={18} />
            开启摄像头实验
          </button>
          <button className="secondary-button" type="button" onClick={gesture.simulatePinch}>
            OK/捏合
          </button>
          <button className="secondary-button" type="button" onClick={gesture.simulateFold}>
            五指合拢
          </button>
        </div>

        {gesture.message ? (
          <p className={`gesture-status gesture-status-${gesture.status}`}>
            <MousePointer2 size={16} />
            {gesture.message}
          </p>
        ) : null}
      </section>
    </div>
  );
}
