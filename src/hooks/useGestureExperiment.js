import { useState } from "react";

export function useGestureExperiment() {
  const [status, setStatus] = useState("idle");
  const [message, setMessage] = useState("");

  async function startCameraExperiment() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setMessage("摄像头权限不可用，请继续使用鼠标。");
      return;
    }

    setStatus("requesting");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      for (const track of stream.getTracks?.() || []) {
        track.stop();
      }
      setStatus("ready");
      setMessage("摄像头已可用；当前版本使用模拟手势事件验证流程。");
    } catch {
      setStatus("blocked");
      setMessage("摄像头权限不可用，请继续使用鼠标。");
    }
  }

  function simulatePinch() {
    setMessage("已模拟 OK/捏合：等价于点击当前高亮按钮。");
  }

  function simulateFold() {
    setMessage("已模拟五指合拢：等价于折成纸团。");
  }

  return {
    status,
    message,
    startCameraExperiment,
    simulatePinch,
    simulateFold
  };
}
