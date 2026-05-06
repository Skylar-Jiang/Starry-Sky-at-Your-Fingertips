import { useCallback, useEffect, useRef, useState } from "react";

function stopTracks(stream) {
  for (const track of stream?.getTracks?.() || []) {
    track.stop();
  }
}

export function useGestureExperiment() {
  const [status, setStatus] = useState("idle");
  const [stream, setStream] = useState(null);
  const [message, setMessage] = useState("");
  const streamRef = useRef(null);

  const stopCamera = useCallback(() => {
    stopTracks(streamRef.current);
    streamRef.current = null;
    setStream(null);
    setStatus("idle");
    setMessage("");
  }, []);

  useEffect(() => {
    return () => {
      stopTracks(streamRef.current);
      streamRef.current = null;
    };
  }, []);

  async function startCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      setStatus("unavailable");
      setMessage("摄像头能力不可用，请继续使用鼠标或模拟按钮。");
      return;
    }

    setStatus("requesting");
    setMessage("正在请求摄像头权限。");

    try {
      stopTracks(streamRef.current);
      const nextStream = await navigator.mediaDevices.getUserMedia({ video: true });
      streamRef.current = nextStream;
      setStream(nextStream);
      setStatus("live");
      setMessage("摄像头已开启，真实手势识别会在模型加载后接入当前流程。");
    } catch {
      streamRef.current = null;
      setStream(null);
      setStatus("blocked");
      setMessage("摄像头权限不可用，请继续使用鼠标或模拟按钮。");
    }
  }

  return {
    status,
    stream,
    message,
    startCamera,
    stopCamera
  };
}
