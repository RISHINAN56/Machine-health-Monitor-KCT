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
            "label": "Bearing Raceway Fatigue",
            "description": "High vibration spikes (>800 mm/s), mechanical harmonics, localized bearing heating.",
        },
        {
            "id": SimulationScenario.MOTOR_OVERHEAT.value,
            "label": "Thermal Overload",
            "description": "Cooling airflow blocked. Stator temperature escalates >60°C with thermal stress warnings.",
        },
        {
            "id": SimulationScenario.LOOM_JAM.value,
            "label": "Weft Insertion Jam",
            "description": "Loom shed binding. Motor load surges to 1050 A, RPM drops sharply to 280 RPM.",
        },
        {
            "id": SimulationScenario.RAPID_ESTOP.value,
            "label": "Emergency Stop (E-Stop)",
            "description": "Safety gate triggered. Machine decelerates to 0 RPM within 1.5 seconds.",
        },
        {
            "id": SimulationScenario.SPEED_FLUCTUATION.value,
            "label": "Belt Slippage & Fluctuation",
            "description": "Drive timing belt worn. Speed oscillates erratically between 450 and 820 RPM.",
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
