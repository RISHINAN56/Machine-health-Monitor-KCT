from typing import Any, Dict, List
from fastapi import APIRouter, HTTPException
from app.database import db_manager
from app.models.alert import AlertEvent
from app.services.alert_service import alert_service

router = APIRouter(prefix="/alerts", tags=["Alerts"])


@router.get("", response_model=List[AlertEvent])
async def list_recent_alerts():
    return alert_service.get_recent_alerts(limit=50)


@router.get("/active", response_model=List[Dict[str, Any]])
async def list_active_alerts():
    return await db_manager.get_active_alerts()


@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str):
    success = await db_manager.acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"status": "success", "alert_id": alert_id, "acknowledged": True}
