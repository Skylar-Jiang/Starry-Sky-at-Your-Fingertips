import "@testing-library/jest-dom/vitest";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, test, vi } from "vitest";
import CelebrationBurstLayer from "../components/CelebrationBurstLayer";
import CloudKneadInteraction from "../components/CloudKneadInteraction";
import ComfortQuoteTicker from "../components/ComfortQuoteTicker";
import GestureExperimentPanel from "../components/GestureExperimentPanel";
import MeteorShowerLayer from "../components/MeteorShowerLayer";
import StarryCursor from "../components/StarryCursor";

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  document.querySelector(".main-scene")?.classList.remove("scene-custom-cursor", "scene-custom-cursor--interactive");
});

function mockFinePointer(matches = true) {
  window.matchMedia = vi.fn().mockImplementation((query) => ({
    matches,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn()
  }));
}

describe("micro interaction layers", () => {
  test("ComfortQuoteTicker renders copy for the selected emotion", () => {
    const { rerender } = render(<ComfortQuoteTicker currentEmotion="unknown" />);

    expect(screen.getByText(/星星|今晚/)).toBeInTheDocument();

    rerender(<ComfortQuoteTicker currentEmotion="happy" />);

    expect(screen.getByText(/开心|亮/)).toBeInTheDocument();
  });

  test("MeteorShowerLayer replays with explicit head/tail meteors moving downward", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { rerender, container } = render(<MeteorShowerLayer triggerKey={0} count={8} onComplete={onComplete} />);

    expect(container.querySelector(".meteor-shower-layer")).not.toBeInTheDocument();

    rerender(<MeteorShowerLayer triggerKey={1} count={8} onComplete={onComplete} />);
    const firstRun = [...container.querySelectorAll(".meteor-streak")];
    const firstRunIds = firstRun.map((node) => node.getAttribute("data-meteor-id"));
    expect(firstRunIds).toHaveLength(8);
    expect(firstRun[0].querySelector(".meteor-head")).toBeInTheDocument();
    expect(firstRun[0].querySelector(".meteor-tail")).toBeInTheDocument();
    expect(Number(firstRun[0].dataset.dy)).toBeGreaterThan(0);
    expect(firstRun.filter((node) => Number(node.dataset.dy) < 0)).toHaveLength(0);
    const mainDirection = container.querySelector(".meteor-shower-layer").dataset.mainDirection;
    const dominant = firstRun.filter((node) => node.dataset.direction === mainDirection);
    expect(dominant.length / firstRun.length).toBeGreaterThanOrEqual(0.8);
    expect(new Set(dominant.map((node) => Math.sign(Number(node.dataset.dx)))).size).toBe(1);

    act(() => {
      vi.advanceTimersByTime(7000);
    });
    expect(onComplete).toHaveBeenCalledTimes(1);
    expect(container.querySelector(".meteor-shower-layer")).not.toBeInTheDocument();

    rerender(<MeteorShowerLayer triggerKey={2} count={8} onComplete={onComplete} />);
    const secondRunIds = [...container.querySelectorAll(".meteor-streak")].map((node) =>
      node.getAttribute("data-meteor-id")
    );
    expect(secondRunIds).toHaveLength(8);
    expect(secondRunIds[0]).not.toBe(firstRunIds[0]);

    rerender(<MeteorShowerLayer triggerKey={3} count={8} reducedMotion onComplete={onComplete} />);
    expect(container.querySelectorAll(".meteor-streak")).toHaveLength(4);
  });

  test("CelebrationBurstLayer renders particles and completes", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { container } = render(<CelebrationBurstLayer active variant="happy" onComplete={onComplete} />);

    expect(container.querySelectorAll(".celebration-particle").length).toBeGreaterThan(10);

    act(() => {
      vi.advanceTimersByTime(1400);
    });

    expect(onComplete).toHaveBeenCalled();
  });

  test("CloudKneadInteraction kneads a fixed mist without dragging cloud objects", async () => {
    const onComplete = vi.fn();
    const { container } = render(<CloudKneadInteraction active emotion="anxious" onComplete={onComplete} />);
    const mist = screen.getByRole("button", { name: "揉散云雾" });

    expect(container.querySelectorAll(".cloud-knead-button")).toHaveLength(0);
    expect(mist.style.left).toBe("");
    expect(mist.style.top).toBe("");

    fireEvent.pointerDown(mist, { clientX: 160, clientY: 170, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 360, clientY: 230, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 170, clientY: 260, pointerId: 1 });
    fireEvent.pointerMove(mist, { clientX: 380, clientY: 320, pointerId: 1 });
    fireEvent.pointerUp(mist, { clientX: 380, clientY: 320, pointerId: 1 });

    expect(Number(mist.dataset.progress)).toBeGreaterThan(0);
    expect(Number(mist.dataset.scale)).toBeGreaterThanOrEqual(0.96);
    expect(Number(mist.dataset.scale)).toBeLessThanOrEqual(1.04);
    expect(mist.style.left).toBe("");
    expect(mist.style.top).toBe("");

    await waitFor(() => {
      expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ emotion: "anxious" }));
    });
    expect(container.querySelector(".cloud-knead-interaction")).toHaveClass("is-complete");
    expect(container.querySelector(".mist-hidden-star")).toHaveClass("is-revealed");
  });

  test("CloudKneadInteraction accepts live pinch frames as local mist pressure", () => {
    vi.useFakeTimers();
    const onComplete = vi.fn();
    const { rerender, container } = render(
      <CloudKneadInteraction active reducedMotion emotion="anxious" pinchGesture={null} onComplete={onComplete} />
    );

    function sendPinch(point) {
      rerender(
        <CloudKneadInteraction
          active
          reducedMotion
          emotion="anxious"
          pinchGesture={{ active: true, point }}
          onComplete={onComplete}
        />
      );
    }

    act(() => sendPinch({ x: 0.2, y: 0.32 }));
    act(() => sendPinch({ x: 0.21, y: 0.33 }));
    act(() => sendPinch({ x: 0.5, y: 0.42 }));
    act(() => sendPinch({ x: 0.51, y: 0.43 }));
    act(() => {
      vi.advanceTimersByTime(800);
    });

    expect(onComplete).toHaveBeenCalledWith(expect.objectContaining({ emotion: "anxious" }));
    expect(container.querySelector(".cloud-knead-interaction")).toHaveClass("is-complete");
    expect(container.querySelector(".cloud-mist-field").style.left).toBe("");
  });

  test("GestureExperimentPanel routes OK through the gesture event path", async () => {
    const user = userEvent.setup();
    const onGestureEvent = vi.fn();

    render(
      <GestureExperimentPanel
        flowPhase="idle"
        onClose={vi.fn()}
        onGestureEvent={onGestureEvent}
      />
    );

    const panel = screen.getByRole("dialog", { name: /手势实验/ });
    expect(within(panel).getByText("OK 手势：打开记录情绪的信纸。")).toBeInTheDocument();
    expect(within(panel).queryByRole("button", { name: /模拟星轨许愿/ })).not.toBeInTheDocument();

    await user.click(within(panel).getByRole("button", { name: "OK" }));

    expect(onGestureEvent).toHaveBeenCalledWith(expect.objectContaining({ type: "ok_open_letter", source: "simulation" }));
    expect(within(panel).getAllByText(/摄像头只用于本地识别手部关键点/).length).toBeGreaterThan(0);
    expect(within(panel).queryByText(/发送到后端/)).not.toBeInTheDocument();
  });

  test("GestureExperimentPanel uses a V gesture as the stable wish-trail entry", () => {
    render(
      <GestureExperimentPanel
        flowPhase="idle"
        onClose={vi.fn()}
      />
    );

    expect(screen.getByText(/摄像头只用于本地识别手部关键点/)).toBeInTheDocument();
    expect(screen.queryByText(/发送到后端/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /模拟实验手势许愿/ })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /V 手势许愿/ })).toBeInTheDocument();
    expect(screen.getByText(/hands: 0 \/ source: mediapipe/)).toBeInTheDocument();
  });

  test("StarryCursor renders as a passive scene pointer and hides native cursor on the scene", () => {
    mockFinePointer(true);
    const { container } = render(
      <main className="main-scene">
        <StarryCursor enabled />
        <div data-testid="sky" />
        <input aria-label="cursor input" />
      </main>
    );
    const scene = container.querySelector(".main-scene");
    const cursor = container.querySelector(".starry-cursor");

    expect(cursor).toBeInTheDocument();
    expect(cursor).toHaveAttribute("data-starry-cursor", "true");
    fireEvent.pointerMove(scene, { clientX: 144, clientY: 188 });
    expect(scene).toHaveClass("scene-custom-cursor");
    expect(cursor).toHaveClass("is-visible");
    expect(cursor).not.toHaveClass("is-interactive");

    fireEvent.pointerMove(screen.getByLabelText("cursor input"), { clientX: 12, clientY: 18 });
    expect(scene).toHaveClass("scene-custom-cursor--interactive");
    expect(cursor).toHaveClass("is-interactive");
  });
});
