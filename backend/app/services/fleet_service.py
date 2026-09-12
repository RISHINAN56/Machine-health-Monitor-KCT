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
            "picanol": MachineSummary(
                machine_id="picanol",
                name="PICANOL OMNIPLUS SUMMUM",
                model="Picanol Sumo Direct-Drive 190cm",
                status=MachineStatus.HEALTHY,
                health_score=98.4,
                rpm=650.0,
                temperature=31.8,
                vibration=84.0,
                scenario="normal",
                oee_percentage=96.8,
                location="Bay 1 - High-Speed Weaving Shed",
                meters_woven_today=185.4,
                active_alerts_count=0,
            ),
            "toyota": MachineSummary(
                machine_id="toyota",
                name="TOYOTA JAT910",
                model="Toyota E-Shed Servo Air-Jet 210cm",
                status=MachineStatus.HEALTHY,
                health_score=96.2,
                rpm=680.0,
                temperature=32.5,
                vibration=92.0,
                scenario="normal",
                oee_percentage=97.5,
                location="Bay 2 - Cleanroom Denim Hall",
                meters_woven_today=210.8,
                active_alerts_count=0,
            ),
            "tsudakoma": MachineSummary(
                machine_id="tsudakoma",
                name="TSUDAKOMA ZAX001 NEO PLUS",
                model="Tsudakoma Box-Frame Heavy Sley 230cm",
                status=MachineStatus.WARNING,
                health_score=68.5,
                rpm=620.0,
                temperature=48.6,
                vibration=495.0,
                scenario="bearing_wear",
                oee_percentage=88.2,
                location="Bay 3 - Heavy Technical Filament Bay",
                meters_woven_today=144.6,
                active_alerts_count=1,
            ),
        }

    def sync_primary_machine(self, packet: TelemetryPacket) -> None:
        """Synchronizes primary active machine state directly from the simulation streamer."""
        target_id = "picanol" if packet.machine_id in ("LOOM-01", "picanol") else packet.machine_id
        if target_id in self.machines:
            m = self.machines[target_id]
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
