export const gestureEventTypes = {
  OK_OPEN_LETTER: "ok_open_letter",
  PINCH_START: "pinch_start",
  PINCH_MOVE: "pinch_move",
  PINCH_END: "pinch_end",
  FIST_HOLD_START: "fist_hold_start",
  FIST_KNEAD: "fist_knead",
  FIST_KNEAD_COMPLETE: "fist_knead_complete",
  WISH_PRAYER_START: "wish_prayer_start",
  WISH_PRAYER_COMPLETE: "wish_prayer_complete",
  WISH_POSE_COMPLETE: "wish_pose_complete",
  WISH_TRAIL_START: "wish_trail_start",
  WISH_TRAIL_DRAW: "wish_trail_draw",
  WISH_TRAIL_END: "wish_trail_end",
  STAR_THROW_CHARGE: "star_throw_charge",
  STAR_THROW_RELEASE: "star_throw_release",
  GESTURE_CANCEL: "gesture_cancel"
};

export const gestureSources = {
  MEDIAPIPE: "mediapipe",
  BACKEND_LANDMARKS: "backend-landmarks",
  SIMULATION: "simulation"
};

export const handLabels = {
  LEFT: "left",
  RIGHT: "right",
  BOTH: "both",
  UNKNOWN: "unknown"
};
