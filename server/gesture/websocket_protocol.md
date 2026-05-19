# Gesture Landmark WebSocket Protocol

This protocol is optional and landmark-only. Raw camera frames and video streams are out of scope.

## Input

```json
{
  "type": "landmarks",
  "hands": [
    {
      "handedness": "right",
      "landmarks": [{ "x": 0.1, "y": 0.2, "z": -0.03 }]
    }
  ],
  "pointer": { "x": 0.52, "y": 0.36 },
  "velocity": { "x": 320, "y": -980, "speed": 1031 },
  "trajectory": [{ "x": 0.5, "y": 0.7, "timestamp": 1234567000 }],
  "candidate": "star_throw_charge",
  "timestamp": 1234567890
}
```

## Output

```json
{
  "type": "gesture",
  "name": "star_throw_release",
  "confidence": 0.86,
  "source": "backend-landmarks",
  "pointer": { "x": 0.52, "y": 0.36 },
  "velocity": { "x": 320, "y": -980, "speed": 1031 },
  "timestamp": 1234567890
}
```

## Fallback

If the backend is offline, the frontend Gesture Engine remains the source of truth.
