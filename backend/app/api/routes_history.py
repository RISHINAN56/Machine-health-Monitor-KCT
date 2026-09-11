from fastapi import APIRouter, Query
from app.database import db_manager

router = APIRouter(prefix="/api/history", tags=["Historical Playback"])


@router.get("/playback")
async def get_playback_history(limit: int = Query(default=180, ge=10, le=500)):
    """
    Returns time-series telemetry buffer for the interactive Time-Travel Historical Playback scrubber.
    """
    recent = await db_manager.get_recent_telemetry(limit=limit)
    return {
        "count": len(recent),
        "history": recent,
    }
