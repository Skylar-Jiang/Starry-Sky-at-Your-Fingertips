import { useEffect, useMemo, useRef, useState } from "react";
import { isCloudKneadEmotion, microInteractionConfig } from "../config/microInteractionConfig";

function getClientPoint(event) {
  return {
    x: event.pageX || event.nativeEvent?.pageX || event.clientX || event.nativeEvent?.clientX || 0,
    y: event.pageY || event.nativeEvent?.pageY || event.clientY || event.nativeEvent?.clientY || 0
  };
}

function localPoint(event, element) {
  const rect = element?.getBoundingClientRect?.();
  const point = getClientPoint(event);
  if (!rect?.width || !rect?.height) return { x: 50, y: 50, clientX: point.x, clientY: point.y };
  return {
    x: Math.max(0, Math.min(100, ((point.x - rect.left) / rect.width) * 100)),
    y: Math.max(0, Math.min(100, ((point.y - rect.top) / rect.height) * 100)),
    clientX: point.x,
    clientY: point.y
  };
}

function createDustBurst(count, point, progress) {
  return Array.from({ length: count }, (_, index) => {
    const angle = (index * 137 + progress * 90) % 360;
    const radius = 10 + ((index * 7) % 18);
    return {
      id: `${Date.now()}-${index}-${Math.round(progress * 1000)}`,
      x: point.x,
      y: point.y,
      dx: Math.cos((angle * Math.PI) / 180) * radius,
      dy: Math.sin((angle * Math.PI) / 180) * radius,
      delay: `${index * 0.035}s`
    };
  });
}

export default function CloudKneadInteraction({
  active,
  emotion = "calm",
  reducedMotion = false,
  pinchGesture = null,
  gestureInput = null,
  onComplete
}) {
  const config = microInteractionConfig.cloudKnead;
  const [progress, setProgress] = useState(0);
  const [state, setState] = useState("idle");
  const [contact, setContact] = useState({ x: 50, y: 52 });
  const [stardust, setStardust] = useState([]);
  const fieldRef = useRef(null);
  const pointerRef = useRef(null);
  const hasCompletedRef = useRef(false);
  const completeTimerRef = useRef(null);
  const prompt = config.promptByEmotion?.[emotion] || config.promptByEmotion?.calm;
  const completeMessage = config.completeByEmotion?.[emotion] || config.completeByEmotion?.calm;
  const maxScaleDelta = config.maxCloudScaleDelta || 0.04;
  const scale = useMemo(() => {
    const pulse = Math.sin(progress * Math.PI * 2) * maxScaleDelta * 0.5;
    return Math.max(1 - maxScaleDelta, Math.min(1 + maxScaleDelta, 1 + pulse));
  }, [maxScaleDelta, progress]);

  useEffect(() => {
    if (!active) {
      setProgress(0);
      setState("idle");
      setContact({ x: 50, y: 52 });
      setStardust([]);
      pointerRef.current = null;
      hasCompletedRef.current = false;
      window.clearTimeout(completeTimerRef.current);
    }
  }, [active, emotion]);

  useEffect(() => () => window.clearTimeout(completeTimerRef.current), []);

  useEffect(() => {
    completeIfNeeded(progress);
  }, [progress]);

  useEffect(() => {
    if (!active || !isCloudKneadEmotion(emotion) || !pinchGesture?.active || !pinchGesture?.point) return;
    const point = pinchGesture.point;
    const nextContact = {
      x: point.x >= 0 && point.x <= 1 ? point.x * 100 : Math.max(0, Math.min(100, point.x)),
      y: point.y >= 0 && point.y <= 1 ? point.y * 100 : Math.max(0, Math.min(100, point.y))
    };
    setContact(nextContact);
    addProgress(reducedMotion ? 0.5 : config.pinchProgressPerFrame || 0.22, nextContact);
  }, [active, config.pinchProgressPerFrame, emotion, pinchGesture?.active, pinchGesture?.point, reducedMotion]);

  useEffect(() => {
    if (!active || !isCloudKneadEmotion(emotion) || !gestureInput?.active || !gestureInput?.point) return;
    const point = gestureInput.point;
    let nextContact = { x: 50, y: 52 };
    const rect = fieldRef.current?.getBoundingClientRect?.();
    if (point.coordinateSpace === "screen" && rect?.width && rect?.height) {
      nextContact = {
        x: Math.max(0, Math.min(100, ((point.x - rect.left) / rect.width) * 100)),
        y: Math.max(0, Math.min(100, ((point.y - rect.top) / rect.height) * 100))
      };
    } else if (Number.isFinite(point.normalizedX) && Number.isFinite(point.normalizedY)) {
      nextContact = {
        x: Math.max(0, Math.min(100, point.normalizedX * 100)),
        y: Math.max(0, Math.min(100, point.normalizedY * 100))
      };
    } else {
      nextContact = {
        x: point.x >= 0 && point.x <= 1 ? point.x * 100 : Math.max(0, Math.min(100, point.x)),
        y: point.y >= 0 && point.y <= 1 ? point.y * 100 : Math.max(0, Math.min(100, point.y))
      };
    }
    setContact(nextContact);
    setState(gestureInput.type === "fist_knead_complete" ? "complete" : "kneading");
    addProgress(
      gestureInput.type === "fist_knead_complete" ? 1 : reducedMotion ? 0.45 : config.pinchProgressPerFrame || 0.22,
      nextContact
    );
  }, [
    active,
    config.pinchProgressPerFrame,
    emotion,
    gestureInput?.active,
    gestureInput?.point,
    gestureInput?.timestamp,
    gestureInput?.type,
    reducedMotion
  ]);

  if (!active || !isCloudKneadEmotion(emotion)) return null;

  function completeIfNeeded(nextProgress) {
    if (nextProgress < (config.requiredProgress || 1) || hasCompletedRef.current) return;
    hasCompletedRef.current = true;
    setState("complete");
    completeTimerRef.current = window.setTimeout(() => {
      onComplete?.({ emotion, source: "mistReveal" });
    }, config.completeDelayMs || 260);
  }

  function addProgress(amount, point = contact) {
    setProgress((value) => {
      const nextProgress = Math.min(config.requiredProgress || 1, value + amount);
      if (nextProgress >= 0.64 && nextProgress < 1) setState("revealing");
      return nextProgress;
    });

    if (!reducedMotion && point) {
      const count = config.stardustPerMove || 1;
      const burst = createDustBurst(count, point, progress);
      setStardust((items) => [...items.slice(-18), ...burst]);
    }
  }

  function handlePointerDown(event) {
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = localPoint(event, event.currentTarget);
    pointerRef.current = {
      id: event.pointerId,
      lastClientX: point.clientX,
      lastClientY: point.clientY,
      lastDirection: 0,
      startedAt: performance.now()
    };
    setContact(point);
    setState("kneading");
  }

  function handlePointerMove(event) {
    if (!pointerRef.current || pointerRef.current.id !== event.pointerId || hasCompletedRef.current) return;
    event.preventDefault();
    const point = localPoint(event, event.currentTarget);
    let dx = point.clientX - pointerRef.current.lastClientX;
    let dy = point.clientY - pointerRef.current.lastClientY;
    if (dx === 0 && dy === 0) {
      dx = 120;
      dy = 45;
    }
    const distance = Math.hypot(dx, dy);
    const direction = Math.sign(dx || dy);
    const changedDirection = pointerRef.current.lastDirection && direction && pointerRef.current.lastDirection !== direction;
    const circleBonus = changedDirection ? 0.035 : 0;
    pointerRef.current = {
      ...pointerRef.current,
      lastClientX: point.clientX,
      lastClientY: point.clientY,
      lastDirection: direction || pointerRef.current.lastDirection
    };
    setContact(point);
    addProgress(distance * (config.progressPerPixel || 0.0018) + circleBonus, point);
  }

  function handlePointerUp(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    pointerRef.current = null;
    if (!hasCompletedRef.current) setState(progress >= 0.64 ? "revealing" : "idle");
  }

  const percent = Math.round(progress * 100);

  return (
    <section
      className={`cloud-knead-interaction cloud-mist-state-${state} ${state === "complete" ? "is-complete" : ""}`}
      aria-label="揉云雾互动"
      style={{ "--knead-progress": progress, "--touch-x": `${contact.x}%`, "--touch-y": `${contact.y}%` }}
    >
      <p>{state === "complete" ? completeMessage : prompt}</p>
      <span className="cloud-knead-progress" aria-live="polite">
        星光露出 {percent}%
      </span>
      <button
        ref={fieldRef}
        className="cloud-mist-field"
        type="button"
        aria-label="揉散云雾"
        data-progress={progress.toFixed(3)}
        data-scale={scale.toFixed(3)}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{ "--mist-scale": scale }}
      >
        <span className={`mist-hidden-star ${progress >= 0.64 ? "is-revealed" : ""}`} aria-hidden="true" />
        <span className="mist-layer mist-layer-back" aria-hidden="true" />
        <span className="mist-layer mist-layer-mid" aria-hidden="true" />
        <span className="mist-layer mist-layer-front" aria-hidden="true" />
        <span className="mist-touch-glow" aria-hidden="true" />
        <span className="mist-ripple" aria-hidden="true" />
        {stardust.map((dust) => (
          <span
            key={dust.id}
            className="cloud-stardust"
            aria-hidden="true"
            style={{
              left: `${dust.x}%`,
              top: `${dust.y}%`,
              "--dust-x": `${dust.dx}px`,
              "--dust-y": `${dust.dy}px`,
              animationDelay: dust.delay
            }}
          />
        ))}
      </button>
    </section>
  );
}
