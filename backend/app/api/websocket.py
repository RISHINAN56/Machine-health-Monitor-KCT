import asyncio
import json
import logging
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from app.models.telemetry import SimulationScenario
from app.services.telemetry_streamer import telemetry_streamer

logger = logging.getLogger("digital_twin.websocket")
ws_router = APIRouter(tags=["WebSockets"])


@ws_router.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await websocket.accept()
    queue = asyncio.Queue(maxsize=50)
    telemetry_streamer.register_listener(queue)
    logger.info("New digital twin WebSocket client connected.")

    # Send latest packet immediately if available
    if telemetry_streamer.latest_packet:
        await websocket.send_text(telemetry_streamer.latest_packet.model_dump_json())

    async def client_receiver():
        try:
            while True:
                data_text = await websocket.receive_text()
                try:
                    msg = json.loads(data_text)
                    action = msg.get("action")
                    if action == "set_scenario":
                        scenario_str = msg.get("scenario")
                        if scenario_str in [s.value for s in SimulationScenario]:
                            telemetry_streamer.set_scenario(SimulationScenario(scenario_str))
                            await websocket.send_text(json.dumps({
                                "type": "ack",
                                "message": f"Scenario changed to {scenario_str}",
                            }))
                    elif action == "ping":
                        await websocket.send_text(json.dumps({"type": "pong"}))
                except json.JSONDecodeError:
                    pass
        except (WebSocketDisconnect, asyncio.CancelledError):
            pass

    receiver_task = asyncio.create_task(client_receiver())

    try:
        while True:
            packet_json = await queue.get()
            await websocket.send_text(packet_json)
    except (WebSocketDisconnect, ConnectionResetError):
        logger.info("WebSocket client disconnected.")
    finally:
        telemetry_streamer.unregister_listener(queue)
        receiver_task.cancel()
