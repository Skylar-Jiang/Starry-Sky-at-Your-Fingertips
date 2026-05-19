import { Activity, Camera, Info } from "lucide-react";
import { useState } from "react";

function cameraLabel(status) {
  if (status === "ready") return "摄像头本地识别中";
  if (status === "loading") return "正在加载模型";
  if (status === "error") return "摄像头不可用";
  return "摄像头未开启";
}

export default function GestureHud({ status, debugOpen = false }) {
  const [open, setOpen] = useState(debugOpen);
  if (!status) return null;
  const progress = Math.round(Math.max(0, Math.min(1, status.progress || 0)) * 100);
  const confidence = Math.round(Math.max(0, Math.min(1, status.confidence || 0)) * 100);

  return (
    <aside className="gesture-hud" aria-live="polite">
      <div className="gesture-hud-main">
        <Activity size={16} />
        <div>
          <strong>{status.label || "手势实验已就绪"}</strong>
          <span>
            <Camera size={13} />
            {cameraLabel(status.cameraStatus)}
          </span>
        </div>
      </div>
      <div className="gesture-hud-metrics">
        <span>{confidence}%</span>
        <span className="gesture-hud-progress" style={{ "--gesture-hud-progress": progress / 100 }}>
          {progress}%
        </span>
      </div>
      {status.failureReason ? <p className="gesture-hud-reason">{status.failureReason}</p> : null}
      <p className="gesture-hud-fallback">摄像头只是实验入口，鼠标和触屏流程会一直保留。</p>
      <button className="gesture-hud-debug-toggle" type="button" onClick={() => setOpen((value) => !value)}>
        <Info size={14} />
        debug
      </button>
      {open ? <pre className="gesture-hud-debug">{JSON.stringify(status.debug || {}, null, 2)}</pre> : null}
    </aside>
  );
}
