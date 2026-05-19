import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom/vitest";
import { describe, expect, test } from "vitest";
import GestureHud from "../components/GestureHud";
import HandPointerLayer from "../components/HandPointerLayer";

describe("gesture feedback components", () => {
  test("HandPointerLayer renders tracking states without blocking pointer input", () => {
    const { container } = render(
      <HandPointerLayer pointer={{ x: 120, y: 160, status: "ok", progress: 0.72, confidence: 0.88 }} />
    );

    const layer = container.querySelector(".hand-pointer-layer");
    expect(layer).toBeInTheDocument();
    expect(layer).toHaveStyle({ pointerEvents: "none" });
    expect(container.querySelector(".hand-pointer.is-ok")).toBeInTheDocument();
  });

  test("GestureHud shows camera status, confidence, progress, fallback text, and debug", () => {
    render(
      <GestureHud
        status={{
          label: "准备投掷",
          cameraStatus: "ready",
          confidence: 0.81,
          progress: 0.42,
          failureReason: "再向上挥得轻快一点。",
          source: "mediapipe",
          debug: { handsCount: 1, pointerStatus: "throwing" }
        }}
        debugOpen
      />
    );

    expect(screen.getByText("准备投掷")).toBeInTheDocument();
    expect(screen.getByText("81%")).toBeInTheDocument();
    expect(screen.getByText("再向上挥得轻快一点。")).toBeInTheDocument();
    expect(screen.getByText(/handsCount/)).toBeInTheDocument();
  });
});
