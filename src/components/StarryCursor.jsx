import { useEffect, useRef, useState } from "react";

const interactiveSelector = [
  "button",
  "a",
  "input",
  "textarea",
  "select",
  "[role='dialog']",
  ".paper-note",
  ".paper-writing-modal",
  ".star-detail-modal"
].join(",");

function supportsImmersiveCursor() {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  const hasFinePointer = window.matchMedia("(pointer: fine)").matches;
  const hasHover = window.matchMedia("(hover: hover)").matches;
  const isTouchPrimary = Number(navigator.maxTouchPoints || 0) > 0 && !hasHover;
  return hasFinePointer && hasHover && !isTouchPrimary;
}

export default function StarryCursor({ enabled = true }) {
  const nodeRef = useRef(null);
  const frameRef = useRef(0);
  const targetRef = useRef({ x: 0, y: 0 });
  const currentRef = useRef({ x: 0, y: 0 });
  const [canUseCustomCursor, setCanUseCustomCursor] = useState(() => supportsImmersiveCursor());
  const [visible, setVisible] = useState(false);
  const [interactive, setInteractive] = useState(false);

  useEffect(() => {
    const nextCanUseCustomCursor = supportsImmersiveCursor();
    setCanUseCustomCursor(nextCanUseCustomCursor);
    if (!enabled || !nextCanUseCustomCursor) {
      setVisible(false);
      return undefined;
    }
    const sceneRoot = nodeRef.current?.closest?.(".main-scene") || document.querySelector(".main-scene");
    sceneRoot?.classList.add("scene-custom-cursor");

    function renderFrame() {
      const current = currentRef.current;
      const target = targetRef.current;
      current.x += (target.x - current.x) * 0.26;
      current.y += (target.y - current.y) * 0.26;
      if (nodeRef.current) {
        nodeRef.current.style.transform = `translate3d(${current.x}px, ${current.y}px, 0)`;
      }
      frameRef.current = window.requestAnimationFrame(renderFrame);
    }

    function handlePointerMove(event) {
      targetRef.current = { x: event.clientX, y: event.clientY };
      if (!visible) {
        currentRef.current = { x: event.clientX, y: event.clientY };
        setVisible(true);
      }
      const isInteractive = Boolean(event.target?.closest?.(interactiveSelector));
      setInteractive(isInteractive);
      sceneRoot?.classList.toggle("scene-custom-cursor--interactive", isInteractive);
    }

    function handlePointerLeave() {
      setVisible(false);
    }

    window.addEventListener("pointermove", handlePointerMove, { passive: true });
    window.addEventListener("pointerleave", handlePointerLeave);
    frameRef.current = window.requestAnimationFrame(renderFrame);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(frameRef.current);
      sceneRoot?.classList.remove("scene-custom-cursor", "scene-custom-cursor--interactive");
    };
  }, [enabled, visible]);

  if (!enabled || !canUseCustomCursor) return null;

  return (
    <div
      ref={nodeRef}
      className={`starry-cursor ${visible ? "is-visible" : ""} ${interactive ? "is-interactive" : ""}`}
      aria-hidden="true"
      data-starry-cursor="true"
    >
      <span className="starry-cursor-core" />
      <span className="starry-cursor-tail" />
    </div>
  );
}
