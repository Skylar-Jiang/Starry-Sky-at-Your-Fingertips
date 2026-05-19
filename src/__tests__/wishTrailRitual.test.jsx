import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import WishTrailRitual from "../components/WishTrailRitual";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function openDrawing(container) {
  fireEvent.click(container.querySelector(".wish-trail-trigger"));
  return container.querySelector(".wish-trail-surface");
}

function drawTrail(surface, points, pointerId = 1) {
  fireEvent.pointerDown(surface, { clientX: points[0].x, clientY: points[0].y, pointerId });
  for (const point of points.slice(1)) {
    fireEvent.pointerMove(surface, { clientX: point.x, clientY: point.y, pointerId });
  }
  fireEvent.pointerUp(surface, { clientX: points.at(-1).x, clientY: points.at(-1).y, pointerId });
}

describe("WishTrailRitual", () => {
  test("enters drawing mode and rejects a trail that is too short", () => {
    const onComplete = vi.fn();
    const { container } = render(<WishTrailRitual currentEmotion="calm" onComplete={onComplete} />);
    const surface = openDrawing(container);

    fireEvent.pointerDown(surface, { clientX: 120, clientY: 120, pointerId: 1 });
    fireEvent.pointerMove(surface, { clientX: 138, clientY: 132, pointerId: 1 });

    expect(container.querySelector(".wish-trail-head")).toBeInTheDocument();

    fireEvent.pointerUp(surface, { clientX: 138, clientY: 132, pointerId: 1 });

    expect(onComplete).not.toHaveBeenCalled();
    expect(container.querySelector(".wish-trail-state-failed")).toBeInTheDocument();
  });

  test("collapses a long glowing trail into a wish orb, leaves a wish mark, and triggers meteors", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const onMeteorRequest = vi.fn();
    const { container } = render(
      <WishTrailRitual currentEmotion="calm" onComplete={onComplete} onMeteorRequest={onMeteorRequest} />
    );

    const surface = openDrawing(container);
    drawTrail(surface, [
      { x: 90, y: 120 },
      { x: 160, y: 150 },
      { x: 250, y: 184 },
      { x: 340, y: 228 }
    ]);

    expect(container.querySelector(".wish-orb")).toBeInTheDocument();
    expect(container.querySelector(".wish-trail-glow-segment")).toBeInTheDocument();
    expect(container.querySelector(".wish-trail-core-segment")).toBeInTheDocument();

    act(() => vi.advanceTimersByTime(1400));
    expect(container.querySelector(".wish-mark")).toBeInTheDocument();
    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ source: "trail" }));
    expect(onMeteorRequest).toHaveBeenCalledTimes(1);

    act(() => vi.advanceTimersByTime(5200));
    expect(container.querySelector(".wish-mark")).not.toBeInTheDocument();
    expect(container.querySelector(".wish-trail-core-segment")).not.toBeInTheDocument();
  });

  test("can trigger a second wish without refreshing", () => {
    vi.useFakeTimers();
    const onMeteorRequest = vi.fn();
    const { container } = render(<WishTrailRitual currentEmotion="calm" onMeteorRequest={onMeteorRequest} />);

    for (const startX of [80, 120]) {
      const surface = openDrawing(container);
      drawTrail(surface, [
        { x: startX, y: 140 },
        { x: startX + 85, y: 170 },
        { x: startX + 175, y: 210 },
        { x: startX + 265, y: 250 }
      ]);
      act(() => vi.advanceTimersByTime(6800));
    }

    expect(onMeteorRequest).toHaveBeenCalledTimes(2);
  });

  test("long-hold fallback grants a wish, but early release does not", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { container } = render(<WishTrailRitual currentEmotion="calm" onComplete={onComplete} />);

    openDrawing(container);
    const fallback = container.querySelector(".wish-hold-fallback");

    fireEvent.pointerDown(fallback, { pointerId: 1, clientX: 240, clientY: 240 });
    act(() => vi.advanceTimersByTime(700));
    fireEvent.pointerUp(fallback, { pointerId: 1 });
    expect(onComplete).not.toHaveBeenCalled();

    fireEvent.pointerDown(fallback, { pointerId: 2, clientX: 240, clientY: 240 });
    act(() => vi.advanceTimersByTime(1800));
    fireEvent.pointerUp(fallback, { pointerId: 2 });
    act(() => vi.advanceTimersByTime(1800));

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ source: "hold" }));
  });

  test("simulation callers can still grant a wish through the stable trail layer", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const apiRef = { current: null };

    render(<WishTrailRitual ref={apiRef} currentEmotion="anxious" onComplete={onComplete} />);

    act(() => {
      apiRef.current.triggerWishRitual("simulation");
      vi.advanceTimersByTime(1800);
    });

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ source: "simulation" }));
  });
});
