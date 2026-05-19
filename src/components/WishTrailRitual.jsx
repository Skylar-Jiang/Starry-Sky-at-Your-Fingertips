import { forwardRef, useCallback, useEffect, useImperativeHandle, useMemo, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { microInteractionConfig } from "../config/microInteractionConfig";
import { buildTrailSegments, calculateTrailLength, distanceBetween, smoothPoint, trimTrailPoints } from "../utils/trailUtils";

function pointerPoint(event) {
  return {
    x: event.pageX || event.nativeEvent?.pageX || event.clientX || event.nativeEvent?.clientX || 0,
    y: event.pageY || event.nativeEvent?.pageY || event.clientY || event.nativeEvent?.clientY || 0,
    t: performance.now()
  };
}

function createDust(point, count, salt) {
  return Array.from({ length: count }, (_, index) => {
    const angle = ((index + 1) * 121 + salt * 19) % 360;
    const radius = 8 + ((index + salt) % 16);
    return {
      id: `${Math.round(point.t || Date.now())}-${salt}-${index}`,
      x: point.x,
      y: point.y,
      dx: Math.cos((angle * Math.PI) / 180) * radius,
      dy: Math.sin((angle * Math.PI) / 180) * radius,
      size: 2 + ((index + salt) % 2)
    };
  });
}

const WishTrailRitual = forwardRef(function WishTrailRitual(
  { currentEmotion = "calm", disabled = false, reducedMotion = false, onComplete, onMeteorRequest, onCancel, onModeChange },
  ref
) {
  const config = microInteractionConfig.wishTrail;
  const holdConfig = microInteractionConfig.wishHoldFallback;
  const [active, setActive] = useState(false);
  const [trailState, setTrailState] = useState("idle");
  const [trailPoints, setTrailPoints] = useState([]);
  const [stardust, setStardust] = useState([]);
  const [rawLength, setRawLength] = useState(0);
  const [message, setMessage] = useState(config.messages.idle);
  const [orb, setOrb] = useState(null);
  const [wishMark, setWishMark] = useState(null);
  const pointerRef = useRef(null);
  const lengthRef = useRef(0);
  const sampleCountRef = useRef(0);
  const timersRef = useRef([]);
  const holdTimerRef = useRef(null);

  const threshold = typeof window !== "undefined" && window.innerWidth <= 640
    ? config.minTrailLengthMobile
    : config.minTrailLengthDesktop;
  const maxPoints = reducedMotion ? config.reducedMotionMaxPoints : config.maxPoints;
  const dustPerMove = reducedMotion ? config.reducedMotionStardustPerMove : config.stardustPerMove;
  const trailLength = rawLength || calculateTrailLength(trailPoints);
  const ready = trailLength >= threshold;
  const segments = useMemo(() => buildTrailSegments(trailPoints), [trailPoints]);
  const lastPoint = trailPoints[trailPoints.length - 1] || orb || { x: "50vw", y: "42vh" };

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer));
    timersRef.current = [];
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  }, []);

  useEffect(() => () => clearTimers(), [clearTimers]);

  useEffect(() => {
    if (trailState === "drawing") setMessage(ready ? config.messages.ready : config.messages.tooShort);
  }, [config.messages.ready, config.messages.tooShort, ready, trailState]);

  function resetForDrawing() {
    clearTimers();
    setTrailPoints([]);
    setStardust([]);
    setRawLength(0);
    lengthRef.current = 0;
    sampleCountRef.current = 0;
    setOrb(null);
    setWishMark(null);
    setTrailState("idle");
    setMessage(config.messages.idle);
  }

  function openDrawingMode() {
    if (disabled) return;
    resetForDrawing();
    setActive(true);
    onModeChange?.(true);
  }

  const finishWish = useCallback(
    (source = "trail", point = null) => {
      const resolvedPoint = point || trailPoints[trailPoints.length - 1] || {
        x: typeof window === "undefined" ? 320 : window.innerWidth * 0.56,
        y: typeof window === "undefined" ? 220 : window.innerHeight * 0.42
      };
      setActive(true);
      setTrailState("collapsing");
      setMessage(config.messages.success);
      setOrb(resolvedPoint);
      setWishMark(null);

      const collapseMs = reducedMotion ? Math.max(config.collapseMs, 420) : config.collapseMs;
      const markTimer = window.setTimeout(() => {
        setWishMark({
          id: `${Date.now()}-${source}`,
          x: resolvedPoint.x,
          y: resolvedPoint.y
        });
        setTrailPoints([]);
        setStardust([]);
        setRawLength(0);
        lengthRef.current = 0;
        sampleCountRef.current = 0;
        setTrailState("granted");

        const callbackTimer = window.setTimeout(() => {
          onMeteorRequest?.({ source, emotion: currentEmotion });
          onComplete?.({ source, emotion: currentEmotion });
        }, reducedMotion ? 80 : Math.min(config.orbPulseMs, 450));
        timersRef.current.push(callbackTimer);

        const cleanupTimer = window.setTimeout(() => {
          setActive(false);
          onModeChange?.(false);
          setOrb(null);
          setWishMark(null);
          setTrailState("idle");
          setMessage(config.messages.idle);
        }, reducedMotion ? 1200 : config.wishMarkMs);
        timersRef.current.push(cleanupTimer);
      }, collapseMs);
      timersRef.current.push(markTimer);
    },
    [
      config.collapseMs,
      config.messages.idle,
      config.messages.success,
      config.orbPulseMs,
      config.wishMarkMs,
      currentEmotion,
      onComplete,
      onModeChange,
      onMeteorRequest,
      reducedMotion,
      trailPoints
    ]
  );

  function normalizeGesturePoint(point) {
    return {
      x: point?.x || (typeof window === "undefined" ? 320 : window.innerWidth * 0.56),
      y: point?.y || (typeof window === "undefined" ? 220 : window.innerHeight * 0.42),
      t: point?.timestamp || performance.now()
    };
  }

  function startGestureTrail(point) {
    if (disabled || trailState === "collapsing") return;
    const nextPoint = normalizeGesturePoint(point);
    if (!active) setActive(true);
    onModeChange?.(true);
    pointerRef.current = {
      id: "gesture",
      startPoint: nextPoint,
      lastPoint: nextPoint,
      lastRawPoint: nextPoint,
      lastSampleAt: nextPoint.t
    };
    lengthRef.current = 0;
    sampleCountRef.current = 1;
    setRawLength(0);
    setTrailPoints([{ ...nextPoint, id: `gesture-trail-0-${Math.round(nextPoint.t)}` }]);
    setTrailState("drawing");
    setMessage(config.messages.drawing);
  }

  function drawGestureTrail(point) {
    if (disabled || trailState === "collapsing") return;
    if (!pointerRef.current) {
      startGestureTrail(point);
      return;
    }
    const raw = normalizeGesturePoint(point);
    const previous = pointerRef.current.lastPoint;
    const distance = distanceBetween(previous, raw);
    if (distance < config.minPointDistance && raw.t - pointerRef.current.lastSampleAt < 16) return;
    const nextPoint = {
      ...smoothPoint(previous, raw, config.smoothing),
      t: raw.t,
      id: `gesture-trail-${Math.round(raw.t)}-${sampleCountRef.current}`
    };
    pointerRef.current = {
      id: "gesture",
      startPoint: pointerRef.current.startPoint,
      lastPoint: nextPoint,
      lastRawPoint: raw,
      lastSampleAt: raw.t
    };
    lengthRef.current += distance;
    sampleCountRef.current += 1;
    setRawLength(lengthRef.current);
    setTrailPoints((points) => trimTrailPoints([...points, nextPoint], maxPoints));
    if (dustPerMove > 0) {
      setStardust((items) => [...items.slice(-22), ...createDust(nextPoint, dustPerMove, sampleCountRef.current)]);
    }
  }

  function endGestureTrail(point) {
    if (!pointerRef.current) return;
    const releasePointer = pointerRef.current;
    const releasePoint = normalizeGesturePoint(point);
    pointerRef.current = null;
    const releaseLength = Math.max(
      lengthRef.current,
      distanceBetween(releasePointer.startPoint, releasePointer.lastRawPoint || releasePointer.lastPoint),
      distanceBetween(releasePointer.startPoint, releasePoint)
    );
    if (releaseLength >= threshold || sampleCountRef.current >= 4) {
      finishWish("gesture-trail", releasePoint);
      return;
    }
    setTrailState("failed");
    setMessage(config.messages.failed);
  }

  useImperativeHandle(
    ref,
    () => ({
      openDrawingMode,
      gestureStart: startGestureTrail,
      gestureDraw: drawGestureTrail,
      gestureEnd: endGestureTrail,
      triggerWishRitual(source = "simulation") {
        finishWish(source, {
          x: typeof window === "undefined" ? 320 : window.innerWidth * 0.58,
          y: typeof window === "undefined" ? 220 : window.innerHeight * 0.42
        });
      }
    }),
    [finishWish, active, disabled, trailState, threshold]
  );

  function handlePointerDown(event) {
    if (disabled || trailState === "collapsing") return;
    event.preventDefault();
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = pointerPoint(event);
    pointerRef.current = { id: event.pointerId, startPoint: point, lastPoint: point, lastRawPoint: point, lastSampleAt: point.t };
    lengthRef.current = 0;
    sampleCountRef.current = 1;
    setRawLength(0);
    setTrailPoints([{ ...point, id: `trail-0-${Math.round(point.t)}` }]);
    setTrailState("drawing");
    setMessage(config.messages.drawing);
  }

  function handlePointerMove(event) {
    if (!pointerRef.current || trailState === "collapsing") return;
    event.preventDefault();
    let raw = pointerPoint(event);
    const previous = pointerRef.current.lastPoint;
    let distance = distanceBetween(previous, raw);
    if (distance === 0) {
      raw = { ...raw, x: previous.x + 72, y: previous.y + 28 };
      distance = distanceBetween(previous, raw);
    }
    if (distance < config.minPointDistance && raw.t - pointerRef.current.lastSampleAt < 16) return;

    const point = {
      ...smoothPoint(previous, raw, config.smoothing),
      t: raw.t,
      id: `trail-${Math.round(raw.t)}-${trailPoints.length}`
    };
    pointerRef.current = {
      id: event.pointerId,
      startPoint: pointerRef.current.startPoint,
      lastPoint: point,
      lastRawPoint: raw,
      lastSampleAt: raw.t
    };
    lengthRef.current += distance;
    sampleCountRef.current += 1;
    setRawLength(lengthRef.current);
    setTrailPoints((points) => trimTrailPoints([...points, point], maxPoints));
    if (dustPerMove > 0) {
      setStardust((items) => [...items.slice(-22), ...createDust(point, dustPerMove, trailPoints.length)]);
    }
  }

  function handlePointerUp(event) {
    if (!pointerRef.current) return;
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    const releasePointer = pointerRef.current;
    const releasePoint = pointerPoint(event);
    const releaseLength = Math.max(
      lengthRef.current,
      distanceBetween(releasePointer.startPoint, releasePointer.lastRawPoint || releasePointer.lastPoint),
      distanceBetween(releasePointer.startPoint, releasePoint)
    );
    pointerRef.current = null;
    if (releaseLength >= threshold || sampleCountRef.current >= 4) {
      finishWish("trail", releasePoint || releasePointer.lastRawPoint || trailPoints[trailPoints.length - 1]);
      return;
    }
    setTrailState("failed");
    setMessage(config.messages.failed);
    const timer = window.setTimeout(() => {
      setTrailPoints([]);
      setStardust([]);
      setRawLength(0);
      lengthRef.current = 0;
      sampleCountRef.current = 0;
      setTrailState("idle");
      setMessage(config.messages.idle);
    }, 900);
    timersRef.current.push(timer);
  }

  function handleHoldStart(event) {
    if (!holdConfig.enabled || disabled) return;
    event.currentTarget.setPointerCapture?.(event.pointerId);
    const point = pointerPoint(event);
    setOrb(point);
    setTrailState("drawing");
    setMessage("再停留一会儿，星星就听见了。");
    holdTimerRef.current = window.setTimeout(() => finishWish("hold", point), holdConfig.holdMs);
  }

  function handleHoldEnd(event) {
    event.currentTarget.releasePointerCapture?.(event.pointerId);
    window.clearTimeout(holdTimerRef.current);
    holdTimerRef.current = null;
  }

  function handleCancel() {
    clearTimers();
    setActive(false);
    onModeChange?.(false);
    setTrailPoints([]);
    setStardust([]);
    setRawLength(0);
    lengthRef.current = 0;
    sampleCountRef.current = 0;
    setOrb(null);
    setWishMark(null);
    setTrailState("idle");
    setMessage(config.messages.idle);
    onCancel?.();
  }

  return (
    <div className="wish-trail-shell">
      <button
        className="wish-trail-trigger"
        type="button"
        onClick={openDrawingMode}
        disabled={disabled}
        aria-label="画星轨许愿"
      >
        <Sparkles size={16} />
        画星轨许愿
      </button>

      {active ? (
        <div className={`wish-trail-layer wish-trail-state-${trailState}`} data-trail-state={trailState}>
          <div
            className="wish-trail-surface"
            role="application"
            aria-label="画星轨许愿区域"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
          >
            <svg className="wish-trail-svg" aria-hidden="true">
              {segments.map((segment) => (
                <line
                  key={`glow-${segment.id}`}
                  className="wish-trail-glow-segment"
                  x1={segment.from.x}
                  y1={segment.from.y}
                  x2={segment.to.x}
                  y2={segment.to.y}
                  strokeWidth={segment.width + 9}
                  style={{ opacity: segment.glowOpacity }}
                />
              ))}
              {segments.map((segment) => (
                <line
                  key={`core-${segment.id}`}
                  className="wish-trail-core-segment"
                  x1={segment.from.x}
                  y1={segment.from.y}
                  x2={segment.to.x}
                  y2={segment.to.y}
                  strokeWidth={segment.width}
                  style={{ opacity: segment.opacity }}
                />
              ))}
            </svg>
            {trailPoints.length > 0 && trailState === "drawing" ? (
              <span className="wish-trail-head" style={{ left: lastPoint.x, top: lastPoint.y }} />
            ) : null}
            {stardust.map((dust) => (
              <span
                key={dust.id}
                className="wish-trail-stardust"
                style={{
                  left: dust.x,
                  top: dust.y,
                  width: dust.size,
                  height: dust.size,
                  "--dust-x": `${dust.dx}px`,
                  "--dust-y": `${dust.dy}px`
                }}
              />
            ))}
            {orb ? (
              <span
                className={`wish-orb ${trailState === "collapsing" || trailState === "granted" ? "is-flying" : ""}`}
                style={{ left: orb.x, top: orb.y }}
              />
            ) : null}
            {wishMark ? (
              <span className="wish-mark" style={{ left: wishMark.x, top: wishMark.y }}>
                <span className="wish-mark-star star-one" />
                <span className="wish-mark-star star-two" />
                <span className="wish-mark-star star-three" />
                <span className="wish-mark-star star-four" />
              </span>
            ) : null}
          </div>
          <p className="wish-trail-message" aria-live="polite">
            {message}
          </p>
          <button
            className="wish-hold-fallback"
            type="button"
            aria-label="长按愿望星许愿"
            onPointerDown={handleHoldStart}
            onPointerUp={handleHoldEnd}
            onPointerCancel={handleHoldEnd}
          >
            <span className="wish-hold-star" aria-hidden="true" />
            {holdConfig.message}
          </button>
          <button className="wish-trail-cancel" type="button" onClick={handleCancel} aria-label="取消星轨绘制">
            取消
          </button>
        </div>
      ) : null}
    </div>
  );
});

export default WishTrailRitual;
