from fastapi import APIRouter, HTTPException
from app.models.fleet import FleetOverview, MachineSummary
from app.services.fleet_service import fleet_service

router = APIRouter(prefix="/api/fleet", tags=["Factory Fleet"])


@router.get("", response_model=FleetOverview)
async def get_fleet_overview():
    """
    Returns high-level plant floor overview across all 5 monitored textile machines (Loom A to Loom E).
    """
    return fleet_service.get_fleet_overview()


@router.get("/{machine_id}", response_model=MachineSummary)
async def get_machine_details(machine_id: str):
    """
    Returns specific machine status and operational telemetry summary.
    """
    machine = fleet_service.get_machine(machine_id)
    if not machine:
        raise HTTPException(status_code=404, detail=f"Machine {machine_id} not found on factory floor")
    return machine
