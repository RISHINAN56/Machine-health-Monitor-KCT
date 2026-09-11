from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException, Query
from app.database import db_manager
from app.models.telemetry import TelemetryPacket
from app.services.telemetry_streamer import telemetry_streamer

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.get("/latest", response_model=TelemetryPacket)
async def get_latest_telemetry():
    if not telemetry_streamer.latest_packet:
        raise HTTPException(status_code=503, detail="Telemetry stream warming up...")
    return telemetry_streamer.latest_packet


@router.get("/history")
async def get_telemetry_history(
    limit: int = Query(default=100, ge=10, le=500, description="Number of historical samples")
) -> List[Dict[str, Any]]:
    return await db_manager.get_recent_telemetry(limit=limit)


@router.get("/summary")
async def get_machine_summary():
    packet = telemetry_streamer.latest_packet
    if not packet:
        raise HTTPException(status_code=503, detail="Machine telemetry unavailable.")

    return {
        "machine_id": "LOOM-AIRJET-042",
        "machine_model": "Picanol OmniPlus-i Air-Jet / Rapier Hybrid",
        "status": packet.overall_status,
        "health_score": packet.overall_health_score,
        "scenario": packet.scenario,
        "uptime_seconds": packet.uptime_seconds,
        "picks_per_minute": packet.picks_per_minute,
        "total_picks": packet.total_picks,
        "meters_woven": packet.meters_woven,
        "oee_percentage": packet.oee_percentage,
        "active_alerts_count": packet.active_alerts_count,
        "sensors": packet.sensors,
        "ai_prediction": packet.ai_prediction,
    }
