import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from "react";
import { Sparkles } from "lucide-react";
import { getWishMessage, microInteractionConfig } from "../config/microInteractionConfig";

const WishRitualLayer = forwardRef(function WishRitualLayer(
  { currentEmotion = "calm", disabled = false, onComplete },
  ref
) {
  const [ritual, setRitual] = useState(null);
  const holdTimerRef = useRef(null);
  const completeTimerRef = useRef(null);
  const message = getWishMessage(currentEmotion);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const triggerWishRitual = useCallback(
    (source = "mouse") => {
      if (disabled) return;
      clearHoldTimer();
      window.clearTimeout(completeTimerRef.current);
      setRitual({ source, message, id: Date.now() });
      completeTimerRef.current = window.setTimeout(() => {
        onComplete?.({ source, emotion: currentEmotion });
      }, microInteractionConfig.wish.durationMs);
    },
    [clearHoldTimer, currentEmotion, disabled, message, onComplete]
  );

  useImperativeHandle(ref, () => ({ triggerWishRitual }), [triggerWishRitual]);

  useEffect(
    () => () => {
      clearHoldTimer();
      window.clearTimeout(completeTimerRef.current);
    },
    [clearHoldTimer]
  );

  function handlePointerDown(event) {
    if (disabled) return;
    const source = event.pointerType === "touch" ? "touch" : "mouse";
    holdTimerRef.current = window.setTimeout(() => {
      triggerWishRitual(source);
    }, microInteractionConfig.wish.holdMs);
  }

  function handlePointerUp() {
    clearHoldTimer();
  }

  return (
    <div className="wish-ritual-shell">
      <button
        className="wish-ritual-trigger"
        type="button"
        onClick={() => triggerWishRitual("mouse")}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        disabled={disabled}
        aria-label="点亮愿望星"
      >
        <Sparkles size={16} />
        点亮愿望星
      </button>

      {ritual ? (
        <div className="wish-ritual-layer is-active" aria-live="polite">
          <span className="wish-hands-glow wish-hands-glow-left" aria-hidden="true" />
          <span className="wish-hands-glow wish-hands-glow-right" aria-hidden="true" />
          <span className="wish-orb" aria-hidden="true" />
          <p>{ritual.message}</p>
        </div>
      ) : null}
    </div>
  );
});

export default WishRitualLayer;
