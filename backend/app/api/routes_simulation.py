from typing import Dict, List
from fastapi import APIRouter
from pydantic import BaseModel
from app.models.telemetry import SimulationScenario
from app.services.telemetry_streamer import telemetry_streamer

router = APIRouter(prefix="/simulation", tags=["Simulation"])


class ScenarioChangeRequest(BaseModel):
    scenario: SimulationScenario


@router.get("/scenarios")
async def list_scenarios() -> List[Dict[str, str]]:
    return [
        {
            "id": SimulationScenario.NORMAL.value,
            "label": "Optimal Production",
            "description": "ISO 10816 Zone A. Balanced speed (~650 RPM), cool motor (~31°C), low vibration (<150 mm/s).",
        },
        {
            "id": SimulationScenario.BEARING_WEAR.value,
            "label": "Bearing Failure",
            "description": "Vibration spikes (>880 mm/s), bearing pillow blocks heat up and flash red.",
        },
        {
            "id": SimulationScenario.MOTOR_OVERLOAD.value,
            "label": "Motor Overload",
            "description": "Electrical load surges to >920A, temperature climbs, motor glows orange/red.",
        },
        {
            "id": SimulationScenario.SHAFT_MISALIGNMENT.value,
            "label": "Shaft Misalignment",
            "description": "RPM instability (erratic oscillation) and severe 2nd/3rd order vibration harmonics.",
        },
        {
            "id": SimulationScenario.BELT_SLIPPAGE.value,
            "label": "Belt Slippage",
            "description": "Reduced mechanical efficiency, speed drops from 650 to 510 RPM with torque drag.",
        },
        {
            "id": SimulationScenario.OVERHEATING.value,
            "label": "Overheating Runaway",
            "description": "Thermal spike past 75°C, cooling ducts choked, emergency thermal alarm trips.",
        },
    ]


@router.post("/scenario")
async def set_scenario(req: ScenarioChangeRequest):
    telemetry_streamer.set_scenario(req.scenario)
    return {
        "status": "success",
        "scenario": req.scenario.value,
        "message": f"Simulation setpoint updated to {req.scenario.value}",
    }
