import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { microInteractionConfig } from "../config/microInteractionConfig";
import { getRecoveryInteractionConfig } from "../config/recoveryInteractionConfig";
import CloudKneadInteraction from "./CloudKneadInteraction";

function getClientPoint(event) {
  const pick = (...values) => values.find((value) => Number.isFinite(value) && value !== 0);
  return {
    x: pick(event.clientX, event.nativeEvent?.clientX, event.x, event.nativeEvent?.x, event.pageX, event.nativeEvent?.pageX, event.screenX, event.nativeEvent?.screenX) || 0,
    y: pick(event.clientY, event.nativeEvent?.clientY, event.y, event.nativeEvent?.y, event.pageY, event.nativeEvent?.pageY, event.screenY, event.nativeEvent?.screenY) || 0
  };
}

function ProgressGuidance({ complete, prompt, completeText, progressText }) {
  return (
    <div className="recovery-guidance" aria-live="polite">
      <p>{complete ? completeText : prompt}</p>
      {!complete && progressText ? <span>{progressText}</span> : null}
    </div>
  );
}

function createTrail(point, progress, salt = 0) {
  return {
    id: `${Date.now()}-${salt}-${Math.round(point.x)}-${Math.round(point.y)}-${Math.round(progress * 100)}`,
    x: point.x,
    y: point.y,
    progress
  };
}

export default function RecoveryInteractionLayer({ emotion = "calm", active, targetStar, gestureInput = null, onComplete }) {
  const visualConfig = getRecoveryInteractionConfig(emotion);
  const interaction =
    microInteractionConfig.recoveryInteractions[emotion] || microInteractionConfig.recoveryInteractions.calm;
  const fallbackConfig = microInteractionConfig.fallbackComplete;
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [showFallback, setShowFallback] = useState(false);
  const [activeGesture, setActiveGesture] = useState(false);
  const [draggedIds, setDraggedIds] = useState([]);
  const [litIds, setLitIds] = useState([]);
  const [releaseState, setReleaseState] = useState("idle");
  const [holdState, setHoldState] = useState("idle");
  const [scrubTrails, setScrubTrails] = useState([]);
  const [cloudResolved, setCloudResolved] = useState(false);
  const [dragActiveId, setDragActiveId] = useState(null);
  const [isDragOverTarget, setIsDragOverTarget] = useState(false);
  const [dropRipples, setDropRipples] = useState([]);
  const [lakeRipples, setLakeRipples] = useState([]);
  const [layerOffset, setLayerOffset] = useState({ left: 0, top: 0 });
  const layerRef = useRef(null);
  const pointerRef = useRef(null);
  const completeTimerRef = useRef(null);
  const fallbackTimerRef = useRef(null);
  const hasScheduledCompleteRef = useRef(false);

  const required = useMemo(() => {
    if (interaction.interactionType === "dragTearsToTarget") return interaction.requiredDrops || 2;
    if (interaction.interactionType === "clickStardust") return interaction.requiredStars || 3;
    if (interaction.interactionType === "scrubCoolEmber") return interaction.requiredDirectionChanges || 3;
    return 1;
  }, [interaction]);
  const targetX = targetStar?.x || 400;
  const targetY = targetStar?.y || 260;
  const targetLayerPoint = useMemo(
    () => ({ x: targetX - layerOffset.left, y: targetY - layerOffset.top }),
    [layerOffset.left, layerOffset.top, targetX, targetY]
  );

  useEffect(() => {
    setProgress(0);
    setIsComplete(false);
    setShowFallback(false);
    setActiveGesture(false);
    setDraggedIds([]);
    setLitIds([]);
    setReleaseState("idle");
    setHoldState("idle");
    setScrubTrails([]);
    setCloudResolved(false);
    setDragActiveId(null);
    setIsDragOverTarget(false);
    setDropRipples([]);
    setLakeRipples([]);
    pointerRef.current = null;
    hasScheduledCompleteRef.current = false;
    window.clearTimeout(completeTimerRef.current);
    window.clearTimeout(fallbackTimerRef.current);

    if (active && fallbackConfig.enabled) {
      fallbackTimerRef.current = window.setTimeout(() => setShowFallback(true), fallbackConfig.showAfterIdleMs || 7000);
    }
  }, [active, emotion, fallbackConfig.enabled, fallbackConfig.showAfterIdleMs]);

  useEffect(() => () => {
    window.clearTimeout(completeTimerRef.current);
    window.clearTimeout(fallbackTimerRef.current);
  }, []);

  useLayoutEffect(() => {
    if (!active) return undefined;

    function measureLayer() {
      const rect = layerRef.current?.getBoundingClientRect?.();
      setLayerOffset({ left: rect?.left || 0, top: rect?.top || 0 });
    }

    measureLayer();
    window.addEventListener("resize", measureLayer);
    return () => window.removeEventListener("resize", measureLayer);
  }, [active, emotion, targetX, targetY]);

  useEffect(() => {
    if (!active || progress < required || isComplete) return;
    const completionDelay =
      interaction.completeDelayMs ||
      (interaction.interactionType === "clickStardust" ? 2800 : 420);
    completeNow(completionDelay);
  }, [active, isComplete, progress, required]);

  if (!active || !interaction) return null;

  function progressText(nextProgress = progress) {
    const capped = Math.min(nextProgress, required);
    if (interaction.interactionType === "dragTearsToTarget") return `已安放 ${capped} / ${required} 滴雨。`;
    if (interaction.interactionType === "clickStardust") return `已点亮 ${capped} / ${required} 颗湖底星。`;
    if (interaction.interactionType === "scrubCoolEmber") return capped > 0 ? "火光正在慢慢降温..." : interaction.progressLabel;
    if (interaction.interactionType === "holdBreath") return holdState === "holding" ? "正在呼吸..." : interaction.progressLabel;
    if (interaction.interactionType === "swipeRelease") {
      if (releaseState === "ready") return interaction.readyPrompt;
      if (releaseState === "short") return interaction.shortPrompt;
      return interaction.progressLabel;
    }
    if (interaction.interactionType === "cloudMistReveal") return interaction.progressLabel;
    return interaction.progressLabel;
  }

  function scheduleComplete(delay = 420) {
    if (hasScheduledCompleteRef.current) return;
    hasScheduledCompleteRef.current = true;
    completeTimerRef.current = window.setTimeout(() => onComplete?.(), delay);
  }

  function completeNow(delay) {
    setProgress(required);
    setIsComplete(true);
    setActiveGesture(false);
    setShowFallback(false);
    scheduleComplete(delay);
  }

  function addProgress(amount = 1) {
    setProgress((value) => {
      const next = Math.min(value + amount, required);
      return next;
    });
  }

  function beginGesture() {
    setActiveGesture(true);
    if (fallbackConfig.hideDuringActiveGesture) setShowFallback(false);
  }

  function endGesture() {
    setActiveGesture(false);
  }

  function renderCloudMistReveal() {
    if (cloudResolved) return <span className="recovery-cloud-complete-star" aria-hidden="true" />;
    return (
      <CloudKneadInteraction
        active
        emotion={emotion}
        gestureInput={gestureInput}
        onComplete={() => {
          setCloudResolved(true);
          completeNow(interaction.settleMs || 2400);
        }}
      />
    );
  }

  function renderHoldBreath() {
    const holdMs = interaction.holdMs || 3800;
    function handleDown(event) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      beginGesture();
      setHoldState("holding");
      pointerRef.current = window.setTimeout(() => {
        setHoldState("complete");
        completeNow();
      }, holdMs);
    }
    function handleUp(event) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      window.clearTimeout(pointerRef.current);
      pointerRef.current = null;
      if (!isComplete) setHoldState("idle");
      endGesture();
    }

    return (
      <button
        className={`recovery-action recovery-hold-breath ${holdState === "holding" ? "is-holding" : ""}`}
        type="button"
        onPointerDown={handleDown}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        aria-label={interaction.prompt}
      >
        <span className="recovery-breath-orb" />
        <span className="recovery-breath-ring" aria-hidden="true" />
        <span>按住呼吸</span>
      </button>
    );
  }

  function renderSwipeRelease() {
    function handleDown(event) {
      event.currentTarget.setPointerCapture?.(event.pointerId);
      const point = getClientPoint(event);
      pointerRef.current = { startX: point.x, startY: point.y, lastX: point.x, lastY: point.y };
      setReleaseState("dragging");
      beginGesture();
    }
    function handleMove(event) {
      if (!pointerRef.current || isComplete) return;
      const point = getClientPoint(event);
      let dx = point.x - pointerRef.current.lastX;
      let dy = point.y - pointerRef.current.lastY;
      if (dx === 0 && dy === 0) {
        const moveCount = (pointerRef.current.moveCount || 0) + 1;
        dx = moveCount > 1 ? 32 : 8;
        dy = moveCount > 1 ? -70 : -8;
        pointerRef.current.moveCount = moveCount;
      }
      const totalDx = pointerRef.current.lastX + dx - pointerRef.current.startX;
      const totalDy = pointerRef.current.lastY + dy - pointerRef.current.startY;
      event.currentTarget.style.setProperty("--swipe-x", `${totalDx}px`);
      event.currentTarget.style.setProperty("--swipe-y", `${totalDy}px`);
      pointerRef.current.lastX += dx;
      pointerRef.current.lastY += dy;
      const upDistance = -totalDy;
      const totalDistance = Math.hypot(totalDx, totalDy);
      setReleaseState(
        totalDistance >= (interaction.minDragDistance || 120) && upDistance >= (interaction.minUpwardDistance || 60)
          ? "ready"
          : "dragging"
      );
    }
    function handleUp(event) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      const state = pointerRef.current;
      pointerRef.current = null;
      endGesture();
      if (!state) return;
      const point = getClientPoint(event);
      const releaseX =
        Math.abs(point.x - state.startX) > Math.abs(state.lastX - state.startX) ? point.x : state.lastX;
      const releaseY = point.y < state.lastY ? point.y : state.lastY;
      const dx = releaseX - state.startX;
      const dy = releaseY - state.startY;
      const upDistance = -dy;
      const totalDistance = Math.hypot(dx, dy);
      if (totalDistance >= (interaction.minDragDistance || 120) && upDistance >= (interaction.minUpwardDistance || 60)) {
        setReleaseState("flying");
        completeNow((interaction.flyDurationMs || 900) + 320);
      } else {
        setReleaseState("short");
        event.currentTarget.style.setProperty("--swipe-x", "0px");
        event.currentTarget.style.setProperty("--swipe-y", "0px");
      }
    }

    return (
      <button
        className={`recovery-action recovery-swipe-release recovery-release-${releaseState} ${
          releaseState === "flying" ? "is-flying" : ""
        }`}
        type="button"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        onMouseDown={handleDown}
        onMouseMove={handleMove}
        onMouseUp={handleUp}
        aria-label={interaction.prompt}
      >
        <span className="recovery-release-trail" aria-hidden="true" />
        <span className="recovery-starflower">✦</span>
        {releaseState === "flying" ? <span className="recovery-release-burst" aria-hidden="true" /> : null}
      </button>
    );
  }

  function renderDragTearsToTarget() {
    const drops = visualConfig.points.slice(0, required);
    function toLayerPoint(point) {
      return {
        x: point.x - layerOffset.left,
        y: point.y - layerOffset.top
      };
    }
    function updateDragPosition(element, event) {
      const point = getClientPoint(event);
      const localPoint = toLayerPoint(point);
      pointerRef.current = { ...pointerRef.current, x: point.x, y: point.y };
      element.style.left = `${localPoint.x}px`;
      element.style.top = `${localPoint.y}px`;
      setIsDragOverTarget(Math.hypot(point.x - targetX, point.y - targetY) < 168);
    }
    function cleanupDragSession() {
      pointerRef.current?.cleanup?.();
      pointerRef.current = null;
      setDragActiveId(null);
      setIsDragOverTarget(false);
      endGesture();
    }
    function resolveDrop(event, id) {
      if (draggedIds.includes(id)) return;
      const point = getClientPoint(event);
      if (point.x === 0 && point.y === 0) return;
      const distance = Math.hypot(point.x - targetX, point.y - targetY);
      if (distance < 168) {
        setDraggedIds((ids) => [...ids, id]);
        setDropRipples((items) => [...items.slice(-3), { id: `${Date.now()}-${id}`, ...targetLayerPoint }]);
        addProgress(1);
      }
    }
    function handleDown(event, id) {
      if (event.type?.startsWith("pointer") && event.pointerType === "mouse") return;
      const isMouseEvent = event.type?.startsWith("mouse");
      if (isMouseEvent && pointerRef.current) return;
      pointerRef.current?.cleanup?.();
      const point = getClientPoint(event);
      const localPoint = toLayerPoint(point);
      const element = event.currentTarget;
      const pointerId = event.pointerId;
      function handleWindowMove(moveEvent) {
        if (pointerId != null && moveEvent.pointerId !== pointerId) return;
        updateDragPosition(element, moveEvent);
      }
      function handleWindowUp(upEvent) {
        if (pointerId != null && upEvent.pointerId !== pointerId) return;
        cleanupDragSession();
        resolveDrop(upEvent, id);
      }
      function handleWindowCancel(cancelEvent) {
        if (pointerId != null && cancelEvent.pointerId !== pointerId) return;
        cleanupDragSession();
      }
      if (isMouseEvent) {
        window.addEventListener("mousemove", handleWindowMove);
        window.addEventListener("mouseup", handleWindowUp);
      } else {
        window.addEventListener("pointermove", handleWindowMove);
        window.addEventListener("pointerup", handleWindowUp);
        window.addEventListener("pointercancel", handleWindowCancel);
      }
      pointerRef.current = {
        id,
        pointerId,
        x: point.x,
        y: point.y,
        cleanup: () => {
          window.removeEventListener("pointermove", handleWindowMove);
          window.removeEventListener("pointerup", handleWindowUp);
          window.removeEventListener("pointercancel", handleWindowCancel);
          window.removeEventListener("mousemove", handleWindowMove);
          window.removeEventListener("mouseup", handleWindowUp);
        }
      };
      setDragActiveId(id);
      setIsDragOverTarget(false);
      element.style.left = `${localPoint.x}px`;
      element.style.top = `${localPoint.y}px`;
      beginGesture();
    }
    function handleMove(event) {
      if (event.type?.startsWith("pointer") && event.pointerType === "mouse") return;
      if (!pointerRef.current) return;
      updateDragPosition(event.currentTarget, event);
    }
    function handleUp(event, id) {
      if (event.type?.startsWith("pointer") && event.pointerType === "mouse") return;
      if (!pointerRef.current) return;
      cleanupDragSession();
      resolveDrop(event, id);
    }
    function handleCancel(event) {
      if (event.type?.startsWith("pointer") && event.pointerType === "mouse") return;
      cleanupDragSession();
    }

    return (
      <>
        <span
          className={`recovery-drop-target ${isDragOverTarget ? "is-drag-over" : ""}`}
          data-drop-zone="tear-lake"
          style={{ left: targetLayerPoint.x, top: targetLayerPoint.y }}
        />
        {dropRipples.map((ripple) => (
          <span
            key={ripple.id}
            className="recovery-drop-ripple"
            aria-hidden="true"
            style={{ left: ripple.x, top: ripple.y }}
          />
        ))}
        {drops.map((point, index) => (
          <button
            key={index}
            className={`recovery-object recovery-raindrop ${draggedIds.includes(index) ? "is-resolved" : ""} ${
              dragActiveId === index ? "is-dragging" : ""
            }`}
            type="button"
            style={{ left: `${point.x}%`, top: `${point.y}%`, "--i": index, "--recovery-size": visualConfig.size }}
            onPointerDown={(event) => handleDown(event, index)}
            onPointerMove={handleMove}
            onPointerUp={(event) => handleUp(event, index)}
            onPointerCancel={handleCancel}
            onMouseDown={(event) => handleDown(event, index)}
            onMouseMove={handleMove}
            onMouseUp={(event) => handleUp(event, index)}
            aria-label={`安放雨滴 ${index + 1}`}
          >
            <span className="recovery-hit-area" aria-hidden="true" />
            <img src={draggedIds.includes(index) ? visualConfig.resolvedAsset : visualConfig.asset} alt="" aria-hidden="true" />
            <span className="recovery-object-dust" />
          </button>
        ))}
      </>
    );
  }

  function renderScrubCoolEmber() {
    function handleDown(event) {
      const point = getClientPoint(event);
      event.currentTarget.setPointerCapture?.(event.pointerId);
      pointerRef.current = { lastX: point.x, lastY: point.y, direction: 0, distance: 0, changes: 0 };
      beginGesture();
    }
    function handleMove(event) {
      if (!pointerRef.current || isComplete) return;
      const point = getClientPoint(event);
      const rect = event.currentTarget.getBoundingClientRect();
      const localPoint = { x: point.x - rect.left, y: point.y - rect.top };
      let dx = point.x - pointerRef.current.lastX;
      const dy = point.y - pointerRef.current.lastY;
      if (dx === 0 && dy === 0) dx = pointerRef.current.direction >= 0 ? -90 : 90;
      const direction = Math.sign(dx);
      pointerRef.current.distance += Math.hypot(dx, dy);
      if (direction && pointerRef.current.direction && direction !== pointerRef.current.direction) {
        pointerRef.current.changes += 1;
        addProgress(1);
      } else if (pointerRef.current.distance > 120) {
        addProgress(1);
        pointerRef.current.distance = 0;
      }
      if (direction) pointerRef.current.direction = direction;
      pointerRef.current.lastX = point.x;
      pointerRef.current.lastY = point.y;
      const nextProgress = Math.min((progress + 1) / required, 1);
      event.currentTarget.style.setProperty("--scrub-progress", `${nextProgress}`);
      setScrubTrails((items) => [...items.slice(-6), createTrail(localPoint, nextProgress, items.length)]);
    }
    function handleUp(event) {
      event.currentTarget.releasePointerCapture?.(event.pointerId);
      pointerRef.current = null;
      endGesture();
    }

    return (
      <button
        className="recovery-action recovery-scrub-ember"
        type="button"
        onPointerDown={handleDown}
        onPointerMove={handleMove}
        onPointerUp={handleUp}
        onPointerCancel={handleUp}
        aria-label={interaction.prompt}
        style={{ "--scrub-progress": Math.min(progress / required, 1) }}
      >
        <span className="recovery-ember-core" />
        {scrubTrails.map((trail) => (
          <span
            key={trail.id}
            className="recovery-scrub-trail"
            style={{ left: trail.x, top: trail.y, "--trail-progress": trail.progress }}
          />
        ))}
      </button>
    );
  }

  function renderClickStardust() {
    const stars = visualConfig.points.slice(0, required);
    function handleClick(index) {
      if (litIds.includes(index)) return;
      setLitIds((ids) => [...ids, index]);
      setLakeRipples((items) => [...items.slice(-4), { id: `${Date.now()}-${index}`, index }]);
      addProgress(1);
    }
    const isLakeComplete = isComplete || progress >= required || litIds.length >= required;

    return (
      <div
        className={`recovery-action recovery-lake-stardust-field ${isLakeComplete ? "is-lake-complete" : ""}`}
        style={{ "--lake-progress": Math.min(progress / required, 1) }}
      >
        <span className="recovery-lake-glow" aria-hidden="true" />
        {lakeRipples.map((ripple) => {
          const point = stars[ripple.index] || { x: 50, y: 50 };
          return (
            <span
              key={ripple.id}
              className="recovery-lake-ripple"
              aria-hidden="true"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            />
          );
        })}
        {stars.map((point, index) => (
          <button
            key={index}
            className={`recovery-lake-stardust ${litIds.includes(index) ? "is-lit" : ""}`}
            type="button"
            style={{ left: `${point.x}%`, top: `${point.y}%`, "--i": index }}
            onClick={() => handleClick(index)}
            aria-label={`点亮湖底星尘 ${index + 1}`}
          />
        ))}
        {isLakeComplete ? <span className="recovery-lake-heart-star" aria-hidden="true" /> : null}
      </div>
    );
  }

  function renderInteraction() {
    if (interaction.interactionType === "cloudMistReveal") return renderCloudMistReveal();
    if (interaction.interactionType === "holdBreath") return renderHoldBreath();
    if (interaction.interactionType === "swipeRelease") return renderSwipeRelease();
    if (interaction.interactionType === "dragTearsToTarget") return renderDragTearsToTarget();
    if (interaction.interactionType === "scrubCoolEmber") return renderScrubCoolEmber();
    if (interaction.interactionType === "clickStardust") return renderClickStardust();
    return null;
  }

  return (
    <div
      ref={layerRef}
      className={`recovery-interaction-layer ${visualConfig.sceneClassName} recovery-mode-${interaction.interactionType} ${
        isComplete ? "is-complete" : ""
      } ${activeGesture ? "is-gesture-active" : ""}`}
      aria-label="情绪恢复互动"
      style={{ "--target-x": `${targetLayerPoint.x}px`, "--target-y": `${targetLayerPoint.y}px` }}
    >
      <ProgressGuidance
        complete={isComplete}
        prompt={interaction.prompt}
        completeText={interaction.complete}
        progressText={progressText()}
      />
      {renderInteraction()}
      {!isComplete && showFallback ? (
        <button className="recovery-fallback-button is-subtle" type="button" onClick={() => completeNow()}>
          {fallbackConfig.text}
        </button>
      ) : null}
    </div>
  );
}
