from datetime import datetime
import random
from typing import Dict, List, Optional
from app.models.fleet import FleetOverview, MachineSummary
from app.models.telemetry import MachineStatus, TelemetryPacket


class FactoryFleetService:
    """
    Multi-Machine Fleet State Service for Coimbatore Smart Weaving Facility 4.0.
    Tracks live telemetry and health states across Loom A through Loom E.
    """

    def __init__(self):
        self.machines: Dict[str, MachineSummary] = {
            "LOOM-01": MachineSummary(
                machine_id="LOOM-01",
                name="Air-Jet Loom A",
                model="Picanol OmniPlus-i 190cm",
                status=MachineStatus.HEALTHY,
                health_score=100.0,
                rpm=650.0,
                temperature=31.5,
                vibration=110.0,
                scenario="normal",
                oee_percentage=97.0,
                location="Bay 1 - Weaving Shed North",
                meters_woven_today=148.5,
                active_alerts_count=0,
            ),
            "LOOM-02": MachineSummary(
                machine_id="LOOM-02",
                name="Air-Jet Loom B",
                model="Picanol OmniPlus-i 190cm",
                status=MachineStatus.HEALTHY,
                health_score=96.4,
                rpm=652.0,
                temperature=32.8,
                vibration=125.0,
                scenario="normal",
                oee_percentage=98.2,
                location="Bay 1 - Weaving Shed North",
                meters_woven_today=162.1,
                active_alerts_count=0,
            ),
            "LOOM-03": MachineSummary(
                machine_id="LOOM-03",
                name="Air-Jet Loom C",
                model="Picanol OmniPlus 220cm",
                status=MachineStatus.WARNING,
                health_score=68.2,
                rpm=641.0,
                temperature=46.5,
                vibration=495.0,
                scenario="bearing_wear",
                oee_percentage=89.5,
                location="Bay 2 - Weaving Shed North",
                meters_woven_today=132.8,
                active_alerts_count=1,
            ),
            "LOOM-04": MachineSummary(
                machine_id="LOOM-04",
                name="Air-Jet Loom D",
                model="Picanol OmniPlus-i 190cm",
                status=MachineStatus.HEALTHY,
                health_score=94.8,
                rpm=648.0,
                temperature=33.2,
                vibration=138.0,
                scenario="normal",
                oee_percentage=96.8,
                location="Bay 2 - Weaving Shed North",
                meters_woven_today=154.0,
                active_alerts_count=0,
            ),
            "LOOM-05": MachineSummary(
                machine_id="LOOM-05",
                name="Air-Jet Loom E",
                model="Picanol OmniPlus 280cm (Jacquard)",
                status=MachineStatus.WARNING,
                health_score=71.5,
                rpm=635.0,
                temperature=48.2,
                vibration=265.0,
                scenario="motor_overload",
                oee_percentage=91.4,
                location="Bay 3 - Special Fabrics Shed",
                meters_woven_today=118.4,
                active_alerts_count=1,
            ),
        }

    def sync_primary_machine(self, packet: TelemetryPacket) -> None:
        """Synchronizes LOOM-01 state directly from the 10 Hz physical simulation streamer."""
        if "LOOM-01" in self.machines:
            m = self.machines["LOOM-01"]
            m.status = packet.overall_status
            m.health_score = packet.overall_health_score
            m.rpm = packet.sensors.rpm
            m.temperature = packet.sensors.temperature
            m.vibration = packet.sensors.vibration
            m.scenario = packet.scenario.value
            m.oee_percentage = packet.oee_percentage
            m.meters_woven_today = round(packet.meters_woven, 1)
            m.active_alerts_count = packet.active_alerts_count

    def get_fleet_overview(self) -> FleetOverview:
        machine_list = list(self.machines.values())
        avg_health = sum(m.health_score for m in machine_list) / len(machine_list)
        avg_oee = sum(m.oee_percentage for m in machine_list) / len(machine_list)
        # Facility active electrical load in kW (~14 kW per machine average)
        total_power = sum(14.2 + (m.vibration / 800.0) * 2.5 for m in machine_list)

        return FleetOverview(
            timestamp=datetime.utcnow(),
            factory_name="Coimbatore Smart Weaving Facility 4.0",
            total_machines=len(machine_list),
            active_machines=sum(1 for m in machine_list if m.status != MachineStatus.CRITICAL),
            factory_health_score=round(avg_health, 1),
            fleet_oee_average=round(avg_oee, 1),
            total_power_kw=round(total_power, 1),
            machines=machine_list,
        )

    def get_machine(self, machine_id: str) -> Optional[MachineSummary]:
        return self.machines.get(machine_id)


fleet_service = FactoryFleetService()
