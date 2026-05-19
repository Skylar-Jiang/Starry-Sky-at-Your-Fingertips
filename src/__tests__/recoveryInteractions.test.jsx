import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import RecoveryInteractionLayer from "../components/RecoveryInteractionLayer";
import { microInteractionConfig } from "../config/microInteractionConfig";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function renderRecovery(emotion, onComplete = vi.fn(), targetStar = { x: 400, y: 260 }) {
  const view = render(
    <RecoveryInteractionLayer
      active
      emotion={emotion}
      targetStar={targetStar}
      onComplete={onComplete}
    />
  );
  return { ...view, onComplete };
}

function mockLayerRect(layer, rect) {
  layer.getBoundingClientRect = vi.fn(() => ({
    x: rect.left,
    y: rect.top,
    left: rect.left,
    top: rect.top,
    right: rect.left + rect.width,
    bottom: rect.top + rect.height,
    width: rect.width,
    height: rect.height
  }));
  act(() => {
    window.dispatchEvent(new Event("resize"));
  });
}

function firePointerWithClient(target, type, { clientX, clientY, pointerId = 1 }) {
  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, { clientX, clientY, pageX: clientX, pageY: clientY, pointerId });
  fireEvent(target, event);
}

describe("emotion recovery interactions", () => {
  test("maps each emotion to a distinct primary interaction and only anxious renders cloud mist", () => {
    expect(microInteractionConfig.recoveryInteractions.happy.interactionType).toBe("swipeRelease");
    expect(microInteractionConfig.recoveryInteractions.calm.interactionType).toBe("holdBreath");
    expect(microInteractionConfig.recoveryInteractions.wronged.interactionType).toBe("dragTearsToTarget");
    expect(microInteractionConfig.recoveryInteractions.angry.interactionType).toBe("scrubCoolEmber");
    expect(microInteractionConfig.recoveryInteractions.verySad.interactionType).toBe("clickStardust");
    expect(microInteractionConfig.recoveryInteractions.anxious.interactionType).toBe("cloudMistReveal");

    for (const emotion of ["happy", "calm", "wronged", "angry", "verySad"]) {
      const { container, unmount } = renderRecovery(emotion);
      expect(container.querySelector(".cloud-knead-interaction")).not.toBeInTheDocument();
      expect(container.querySelector(".recovery-interaction-layer")).toHaveClass(
        `recovery-mode-${microInteractionConfig.recoveryInteractions[emotion].interactionType}`
      );
      unmount();
    }

    const { container } = renderRecovery("anxious");
    expect(container.querySelector(".cloud-knead-interaction")).toBeInTheDocument();
  });

  test("calm completes only after a longer breathing hold", () => {
    vi.useFakeTimers();
    const { onComplete, container } = renderRecovery("calm");
    const orb = container.querySelector(".recovery-hold-breath");

    expect(microInteractionConfig.recoveryInteractions.calm.holdMs).toBeGreaterThanOrEqual(3500);
    fireEvent.pointerDown(orb, { pointerId: 1 });
    expect(orb).toHaveClass("is-holding");
    act(() => vi.advanceTimersByTime(3400));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(600));
    act(() => vi.advanceTimersByTime(1200));

    expect(onComplete).toHaveBeenCalled();
  });

  test("happy does not disappear on a tiny move and only flies after release past threshold", () => {
    vi.useFakeTimers();
    const { onComplete, container } = renderRecovery("happy");
    const starflower = container.querySelector(".recovery-swipe-release");

    fireEvent.mouseDown(starflower, { clientX: 120, clientY: 220, pageX: 120, pageY: 220 });
    fireEvent.mouseMove(starflower, { clientX: 128, clientY: 212, pageX: 128, pageY: 212 });
    act(() => vi.advanceTimersByTime(1200));
    expect(onComplete).not.toHaveBeenCalled();
    expect(starflower).toBeInTheDocument();
    fireEvent.mouseUp(starflower, { clientX: 128, clientY: 212, pageX: 128, pageY: 212 });
    expect(starflower).not.toHaveClass("is-flying");

    const secondStarflower = container.querySelector(".recovery-swipe-release");
    fireEvent.mouseDown(secondStarflower, { clientX: 120, clientY: 220, pageX: 120, pageY: 220 });
    fireEvent.mouseMove(secondStarflower, { clientX: 138, clientY: 74, pageX: 138, pageY: 74 });
    fireEvent.mouseMove(secondStarflower, { clientX: 156, clientY: 28, pageX: 156, pageY: 28 });
    fireEvent.mouseMove(secondStarflower, { clientX: 176, clientY: 0, pageX: 176, pageY: 0 });
    expect(onComplete).not.toHaveBeenCalled();
    fireEvent.mouseUp(secondStarflower, { clientX: 138, clientY: 74, pageX: 138, pageY: 74 });
    expect(container.querySelector(".recovery-swipe-release")).toHaveClass("is-flying");
    expect(container.querySelector(".recovery-release-trail")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(2200));

    expect(onComplete).toHaveBeenCalled();
  });

  test("wronged raindrops have large hit areas and complete when placed", () => {
    vi.useFakeTimers();
    const { onComplete, container } = renderRecovery("wronged");
    const drops = [...container.querySelectorAll(".recovery-raindrop")];
    const target = container.querySelector(".recovery-drop-target");

    expect(drops).toHaveLength(2);
    expect(drops[0].querySelector(".recovery-hit-area")).toBeInTheDocument();
    expect(target).toHaveAttribute("data-drop-zone", "tear-lake");
    expect(container.querySelector(".cloud-knead-interaction")).not.toBeInTheDocument();

    for (const [index, drop] of drops.entries()) {
      fireEvent.mouseDown(drop, { clientX: 120, clientY: 120, pageX: 120, pageY: 120 });
      fireEvent.mouseMove(window, { clientX: 400, clientY: 260, pageX: 400, pageY: 260 });
      expect(drop.style.left).toBe("400px");
      expect(drop.style.top).toBe("260px");
      expect(drop).toHaveClass("is-dragging");
      expect(target).toHaveClass("is-drag-over");
      fireEvent.mouseUp(window, { clientX: 400, clientY: 260, pageX: 400, pageY: 260 });
    }
    expect(container.querySelector(".recovery-drop-ripple")).toBeInTheDocument();
    expect(screen.getByText("雨滴被星空接住了。")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1200));

    expect(onComplete).toHaveBeenCalled();
  });

  test("wronged raindrops align viewport pointer coordinates to the local recovery layer", () => {
    const { container } = renderRecovery("wronged");
    const layer = container.querySelector(".recovery-interaction-layer");
    mockLayerRect(layer, { left: 50, top: 160, width: 900, height: 360 });

    const drop = container.querySelector(".recovery-raindrop");
    const target = container.querySelector(".recovery-drop-target");

    expect(target.style.left).toBe("350px");
    expect(target.style.top).toBe("100px");

    fireEvent.mouseDown(drop, { clientX: 120, clientY: 180, pageX: 120, pageY: 180 });
    fireEvent.mouseMove(window, { clientX: 400, clientY: 260, pageX: 400, pageY: 260 });

    expect(drop.style.left).toBe("350px");
    expect(drop.style.top).toBe("100px");
    expect(drop).toHaveClass("is-dragging");
    expect(target).toHaveClass("is-drag-over");
  });

  test("wronged raindrops do not resolve when a drag is cancelled", () => {
    const { container } = renderRecovery("wronged");
    const drop = container.querySelector(".recovery-raindrop");

    fireEvent.pointerDown(drop, { clientX: 120, clientY: 180, pageX: 120, pageY: 180, pointerId: 1 });
    fireEvent.pointerMove(drop, { clientX: 240, clientY: 220, pageX: 240, pageY: 220, pointerId: 1 });
    fireEvent.pointerCancel(drop, { pointerId: 1 });

    expect(drop).not.toHaveClass("is-resolved");
    expect(container.querySelector(".recovery-drop-ripple")).not.toBeInTheDocument();
    expect(screen.getByText(/0 \/ 2/)).toBeInTheDocument();
  });

  test("angry shows scrub trails and completes by scrubbing back and forth", () => {
    vi.useFakeTimers();
    const { onComplete, container } = renderRecovery("angry");
    const ember = container.querySelector(".recovery-scrub-ember");
    ember.getBoundingClientRect = vi.fn(() => ({
      x: 50,
      y: 80,
      left: 50,
      top: 80,
      right: 250,
      bottom: 280,
      width: 200,
      height: 200
    }));

    firePointerWithClient(ember, "pointerdown", { clientX: 100, clientY: 120 });
    firePointerWithClient(ember, "pointermove", { clientX: 190, clientY: 120 });
    const firstTrail = container.querySelector(".recovery-scrub-trail");
    expect(firstTrail).toBeInTheDocument();
    expect(firstTrail.style.left).toBe("140px");
    expect(firstTrail.style.top).toBe("40px");
    firePointerWithClient(ember, "pointermove", { clientX: 90, clientY: 120 });
    firePointerWithClient(ember, "pointermove", { clientX: 195, clientY: 120 });
    firePointerWithClient(ember, "pointermove", { clientX: 80, clientY: 120 });
    fireEvent.pointerUp(ember, { pointerId: 1 });
    act(() => vi.advanceTimersByTime(1200));

    expect(onComplete).toHaveBeenCalled();
  });

  test("verySad completes by clicking clear lake stardust targets", () => {
    vi.useFakeTimers();
    const { onComplete, container } = renderRecovery("verySad");
    const stardustButtons = [...container.querySelectorAll(".recovery-lake-stardust")];

    expect(stardustButtons).toHaveLength(3);
    fireEvent.click(stardustButtons[0]);
    expect(stardustButtons[0]).toHaveClass("is-lit");
    expect(stardustButtons[0]).toBeInTheDocument();
    expect(screen.getByText(/1 \/ 3/)).toBeInTheDocument();
    fireEvent.click(stardustButtons[1]);
    fireEvent.click(stardustButtons[2]);
    expect(container.querySelectorAll(".recovery-lake-stardust.is-lit")).toHaveLength(3);
    expect(container.querySelector(".recovery-lake-heart-star")).toBeInTheDocument();
    act(() => vi.advanceTimersByTime(1200));
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(2200));

    expect(onComplete).toHaveBeenCalled();
  });

  test("anxious cloud mist settles the revealed star before completing", async () => {
    vi.useFakeTimers();
    const { container, onComplete } = renderRecovery("anxious");
    const mist = container.querySelector(".cloud-mist-field");

    fireEvent.pointerDown(mist, { clientX: 160, clientY: 170, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 360, clientY: 230, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 170, clientY: 260, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 380, clientY: 320, pointerId: 1 });
    fireEvent.pointerUp(mist, { clientX: 380, clientY: 320, pointerId: 1 });

    act(() => vi.advanceTimersByTime(1200));
    expect(container.querySelector(".cloud-knead-interaction")).not.toBeInTheDocument();
    expect(container.querySelector(".recovery-cloud-complete-star")).toBeInTheDocument();
    expect(onComplete).not.toHaveBeenCalled();
    act(() => vi.advanceTimersByTime(3800));
    expect(onComplete).toHaveBeenCalled();
  });
});
