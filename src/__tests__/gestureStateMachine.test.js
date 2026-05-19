import { describe, expect, test } from "vitest";
import { gestureConfig } from "../gesture/gestureConfig";
import { createGestureStateMachine } from "../gesture/gestureStateMachine";

function createHand({ type = "open", x = 0.5, y = 0.5, scale = 0.1 } = {}) {
  const hand = Array.from({ length: 21 }, () => ({ x, y, z: 0 }));
  hand[0] = { x, y: y + scale * 1.1, z: 0 };
  hand[5] = { x: x - scale * 0.42, y, z: 0 };
  hand[9] = { x, y: y - scale * 0.05, z: 0 };
  hand[13] = { x: x + scale * 0.33, y, z: 0 };
  hand[17] = { x: x + scale * 0.62, y: y + scale * 0.04, z: 0 };
  hand[4] = { x: x - scale * 0.72, y: y + scale * 0.1, z: 0 };
  hand[8] = { x: x - scale * 0.36, y: y - scale * 1.34, z: 0 };
  hand[12] = { x, y: y - scale * 1.52, z: 0 };
  hand[16] = { x: x + scale * 0.28, y: y - scale * 1.33, z: 0 };
  hand[20] = { x: x + scale * 0.52, y: y - scale * 1.12, z: 0 };

  if (type === "ok" || type === "pinch") {
    hand[4] = { x: x - scale * 0.22, y: y - scale * 0.45, z: 0 };
    hand[8] = { x: x - scale * 0.12, y: y - scale * 0.48, z: 0 };
  }
  if (type === "fist") {
    [4, 8, 12, 16, 20].forEach((index, offset) => {
      hand[index] = { x: x - scale * 0.18 + offset * scale * 0.09, y: y + scale * 0.18, z: 0 };
    });
  }
  if (type === "pointing") {
    hand[12] = { x, y: y + scale * 0.14, z: 0 };
    hand[16] = { x: x + scale * 0.22, y: y + scale * 0.18, z: 0 };
    hand[20] = { x: x + scale * 0.36, y: y + scale * 0.2, z: 0 };
  }
  if (type === "victory") {
    hand[16] = { x: x + scale * 0.22, y: y + scale * 0.18, z: 0 };
    hand[20] = { x: x + scale * 0.36, y: y + scale * 0.2, z: 0 };
  }
  return hand;
}

function frame(machine, options = {}) {
  return machine.updateFrame({
    hands: options.hands || [{ handedness: "right", landmarks: createHand(options.hand || {}) }],
    sceneRect: { left: 0, top: 0, width: 1000, height: 800 },
    timestamp: options.timestamp ?? 0,
    context: options.context || {}
  });
}

describe("gestureStateMachine", () => {
  test("emits ok_open_letter only after stable hold and then respects cooldown", () => {
    const machine = createGestureStateMachine(gestureConfig);

    expect(frame(machine, { hand: { type: "ok" }, timestamp: 0 }).events).toHaveLength(0);
    expect(frame(machine, { hand: { type: "ok" }, timestamp: 599 }).events).toHaveLength(0);
    expect(frame(machine, { hand: { type: "ok" }, timestamp: 600 }).events[0].type).toBe("ok_open_letter");
    expect(frame(machine, { hand: { type: "ok" }, timestamp: 1000 }).events).toHaveLength(0);
  });

  test("emits fist knead progress and completion after closed hand movement", () => {
    const machine = createGestureStateMachine(gestureConfig);

    expect(frame(machine, { hand: { type: "fist", x: 0.45, y: 0.5 }, timestamp: 0 }).events[0].type).toBe("fist_hold_start");
    const moved = frame(machine, {
      hand: { type: "fist", x: 0.62, y: 0.56 },
      timestamp: 400,
      context: { recoveryInteractionType: "cloudMistReveal" }
    });

    expect(moved.events.some((event) => event.type === "fist_knead")).toBe(true);
    expect(moved.state.progress.fistKnead).toBeGreaterThan(0);

    const complete = frame(machine, {
      hand: { type: "fist", x: 0.24, y: 0.5 },
      timestamp: 800,
      context: { recoveryInteractionType: "cloudMistReveal" }
    });
    expect(complete.events.some((event) => event.type === "fist_knead_complete")).toBe(true);
  });

  test("emits throw release for a grabbed fast upward flick but not slow or horizontal movement", () => {
    const fast = createGestureStateMachine(gestureConfig);
    frame(fast, { hand: { type: "fist", x: 0.5, y: 0.7 }, timestamp: 0, context: { flowPhase: "paperFolded" } });
    frame(fast, { hand: { type: "fist", x: 0.5, y: 0.56 }, timestamp: 180, context: { flowPhase: "paperFolded" } });
    const release = frame(fast, { hand: { type: "open", x: 0.5, y: 0.18 }, timestamp: 360, context: { flowPhase: "paperFolded" } });
    expect(release.events.some((event) => event.type === "star_throw_release")).toBe(true);

    const slow = createGestureStateMachine(gestureConfig);
    frame(slow, { hand: { type: "fist", x: 0.5, y: 0.7 }, timestamp: 0, context: { flowPhase: "paperFolded" } });
    const slowRelease = frame(slow, { hand: { type: "open", x: 0.5, y: 0.55 }, timestamp: 900, context: { flowPhase: "paperFolded" } });
    expect(slowRelease.events.some((event) => event.type === "star_throw_release")).toBe(false);

    const horizontal = createGestureStateMachine(gestureConfig);
    frame(horizontal, { hand: { type: "fist", x: 0.2, y: 0.7 }, timestamp: 0, context: { flowPhase: "paperFolded" } });
    const horizontalRelease = frame(horizontal, { hand: { type: "open", x: 0.9, y: 0.69 }, timestamp: 360, context: { flowPhase: "paperFolded" } });
    expect(horizontalRelease.events.some((event) => event.type === "star_throw_release")).toBe(false);
  });

  test("emits wish pose completion after a one-hand V gesture is held", () => {
    const machine = createGestureStateMachine(gestureConfig);

    expect(frame(machine, { hand: { type: "victory" }, timestamp: 0 }).events).toHaveLength(0);
    const result = frame(machine, {
      hand: { type: "victory" },
      timestamp: gestureConfig.wishPose.stableMs
    });

    expect(result.events.some((event) => event.type === "wish_pose_complete")).toBe(true);
    expect(result.state.pointerStatus).toBe("wish");
  });

  test("emits wish trail start, draw, and end for pointing movement in wish mode", () => {
    const machine = createGestureStateMachine(gestureConfig);

    expect(
      frame(machine, {
        hand: { type: "pointing", x: 0.3, y: 0.4 },
        timestamp: 0,
        context: { wishTrailMode: true }
      }).events
    ).toHaveLength(0);
    const start = frame(machine, {
      hand: { type: "pointing", x: 0.32, y: 0.42 },
      timestamp: 220,
      context: { wishTrailMode: true }
    });
    expect(start.events.some((event) => event.type === "wish_trail_start")).toBe(true);

    const draw = frame(machine, {
      hand: { type: "pointing", x: 0.5, y: 0.48 },
      timestamp: 360,
      context: { wishTrailMode: true }
    });
    expect(draw.events.some((event) => event.type === "wish_trail_draw")).toBe(true);

    const end = frame(machine, {
      hand: { type: "open", x: 0.62, y: 0.48 },
      timestamp: 520,
      context: { wishTrailMode: true }
    });
    expect(end.events.some((event) => event.type === "wish_trail_end")).toBe(true);
  });

  test("ends wish trail when the pointing hand leaves the camera", () => {
    const machine = createGestureStateMachine(gestureConfig);

    frame(machine, {
      hand: { type: "pointing", x: 0.3, y: 0.4 },
      timestamp: 0,
      context: { wishTrailMode: true }
    });
    frame(machine, {
      hand: { type: "pointing", x: 0.32, y: 0.42 },
      timestamp: 220,
      context: { wishTrailMode: true }
    });

    const result = frame(machine, {
      hands: [],
      timestamp: 360,
      context: { wishTrailMode: true }
    });

    expect(result.events).toContainEqual(expect.objectContaining({
      type: "wish_trail_end",
      debug: expect.objectContaining({ reason: "handLost" })
    }));
    expect(result.state.pointerStatus).toBe("searching");
  });
});
