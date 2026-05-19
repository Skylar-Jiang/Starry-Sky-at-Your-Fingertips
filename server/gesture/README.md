# Optional Gesture Backend Experiment

This folder documents an optional landmark-only experiment path. The React app does not require this server, and the camera video stream must stay in the browser.

## Main Path

- Browser requests camera permission only when the user opens Gesture Lab.
- MediaPipe HandLandmarker runs in the frontend.
- The frontend Gesture Engine turns hand landmarks into high-level events.
- UI flows consume gesture events such as `ok_open_letter`, `fist_knead`, `star_throw_release`, and `wish_trail_draw`.

## Optional Backend Path

If a future experiment needs heavier dynamic classification, send only:

- 21-point hand landmarks per hand
- normalized pointer
- velocity
- recent trajectory
- candidate gesture state

Do not send raw camera frames or video by default.

## GRLib Evaluation

`grlib==1.0.12` is available on PyPI, but its wheel metadata does not declare a license and it depends on older `mediapipe`, `opencv-contrib-python`, `numpy`, and `pandas` versions. Because of the unclear license and heavy dependency surface, it is not integrated into the app. It can be revisited only after license confirmation and an isolated environment check.

## Startup

No backend is started for the production frontend. If a prototype is added later, keep it standalone and do not make `npm test`, `npm run build`, or the app startup depend on it.
