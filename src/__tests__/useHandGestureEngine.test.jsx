import { act, renderHook } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { useHandGestureEngine } from "../gesture/useHandGestureEngine";

describe("useHandGestureEngine", () => {
  test("does not crash when camera video is unavailable", () => {
    const videoRef = { current: null };
    const sceneRef = { current: null };
    const { result } = renderHook(() =>
      useHandGestureEngine({
        enabled: false,
        videoRef,
        sceneRef
      })
    );

    expect(result.current.cameraStatus).toBe("idle");
    expect(result.current.pointer.status).toBe("searching");
  });

  test("simulation events use the same event callback path", () => {
    const onGestureEvent = vi.fn();
    const videoRef = { current: null };
    const sceneRef = { current: null };
    const { result } = renderHook(() =>
      useHandGestureEngine({
        enabled: false,
        videoRef,
        sceneRef,
        onGestureEvent
      })
    );

    act(() => {
      result.current.simulateGesture("ok_open_letter", { confidence: 0.9, pointer: { x: 10, y: 20 } });
    });

    expect(onGestureEvent).toHaveBeenCalledWith(
      expect.objectContaining({ type: "ok_open_letter", source: "simulation", confidence: 0.9 })
    );
  });
});
