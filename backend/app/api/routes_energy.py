from fastapi import APIRouter
from app.models.energy import EnergyMetrics
from app.services.energy_service import energy_service
from app.services.telemetry_streamer import telemetry_streamer

router = APIRouter(prefix="/api/energy", tags=["Energy Intelligence"])


@router.get("", response_model=EnergyMetrics)
async def get_energy_metrics(machine_id: str = "LOOM-01"):
    """
    Returns instantaneous electrical power draw, power factor, power loss,
    energy efficiency, and cumulative cost analytics for the specified machine.
    """
    if telemetry_streamer.latest_packet:
        return energy_service.evaluate_energy(telemetry_streamer.latest_packet.sensors, machine_id)
    # Fallback to nominal if telemetry not initialized
    from app.models.telemetry import RawSensorData
    nominal = RawSensorData(temperature=31.0, vibration=110.0, motor_load=330.0, rpm=650.0)
    return energy_service.evaluate_energy(nominal, machine_id)
