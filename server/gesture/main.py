"""Optional gesture backend experiment.

The production frontend does not call this server. It accepts only landmark
packets if a future prototype is run manually.
"""

from fastapi import FastAPI, WebSocket

from gesture_classifier import classify_landmark_packet

app = FastAPI(title="Optional Gesture Landmark Experiment")


@app.websocket("/gesture")
async def gesture_socket(websocket: WebSocket):
    await websocket.accept()
    while True:
        packet = await websocket.receive_json()
        result = classify_landmark_packet(packet)
        if result is not None:
            await websocket.send_json(result)
