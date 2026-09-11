import asyncio
import logging
import math
import random
from datetime import datetime
from typing import Optional
from app.config import settings
from app.database import db_manager
from app.ml.explainability import explainability_engine
from app.ml.health_engine import health_engine
from app.ml.model import ml_classifier
from app.models.telemetry import (
    MachineStatus,
    RawSensorData,
    SimulationScenario,
    TelemetryPacket,
)
from app.services.alert_service import alert_service
from app.services.energy_service import energy_service
from app.services.fleet_service import fleet_service
from app.services.maintenance_service import maintenance_service

logger = logging.getLogger("digital_twin.streamer")


class TelemetryStreamer:
    """
    High-Frequency Physics-Informed Loom Telemetry Streamer.
    Simulates real-time dynamics, scenario transitions, and production telemetry at 10 Hz.
    """

    def __init__(self):
        self.scenario: SimulationScenario = SimulationScenario.NORMAL
        self.is_running: bool = False
        self._task: Optional[asyncio.Task] = None
        self._listeners: set = set()

        # Operational state
        self.current_temp: float = 29.5
        self.current_vib: float = 85.0
        self.current_load: float = 320.0
        self.current_rpm: float = 650.0

        # Production metrics
        self.start_time: datetime = datetime.utcnow()
        self.total_picks: int = 142850
        self.meters_woven: float = 78.4
        self.latest_packet: Optional[TelemetryPacket] = None

        # Scenario target setpoints for 5 Industrial Failure Modes
        self._scenario_targets = {
            SimulationScenario.NORMAL: {
                "temp": 31.0,
                "vib": 110.0,
                "load": 330.0,
                "rpm": 650.0,
            },
            # 1. Bearing Failure: severe vibration spike, localized friction
            SimulationScenario.BEARING_WEAR: {
                "temp": 49.0,
                "vib": 890.0,
                "load": 480.0,
                "rpm": 642.0,
            },
            # 2. Motor Overload: high current load, rising stator heat
            SimulationScenario.MOTOR_OVERLOAD: {
                "temp": 64.0,
                "vib": 310.0,
                "load": 940.0,
                "rpm": 620.0,
            },
            SimulationScenario.MOTOR_OVERHEAT: {
                "temp": 64.0,
                "vib": 310.0,
                "load": 940.0,
                "rpm": 620.0,
            },
            # 3. Shaft Misalignment: RPM deviation, dynamic oscillation & vibration
            SimulationScenario.SHAFT_MISALIGNMENT: {
                "temp": 44.0,
                "vib": 720.0,
                "load": 560.0,
                "rpm": 685.0,
            },
            # 4. Belt Slippage: reduced mechanical transfer, speed drop, load surge
            SimulationScenario.BELT_SLIPPAGE: {
                "temp": 46.0,
                "vib": 410.0,
                "load": 680.0,
                "rpm": 510.0,
            },
            # 5. Overheating: thermal runaway, emergency thermal alarm
            SimulationScenario.OVERHEATING: {
                "temp": 78.0,
                "vib": 380.0,
                "load": 790.0,
                "rpm": 615.0,
            },
            # Backwards compatibility scenarios
            SimulationScenario.LOOM_JAM: {
                "temp": 52.0,
                "vib": 920.0,
                "load": 1050.0,
                "rpm": 280.0,
            },
            SimulationScenario.RAPID_ESTOP: {
                "temp": 28.0,
                "vib": 5.0,
                "load": 15.0,
                "rpm": 0.0,
            },
            SimulationScenario.SPEED_FLUCTUATION: {
                "temp": 36.0,
                "vib": 460.0,
                "load": 560.0,
                "rpm": 790.0,
            },
        }

    def set_scenario(self, scenario: SimulationScenario) -> None:
        self.scenario = scenario
        logger.info("Simulation scenario switched to: %s", scenario.value)

    def register_listener(self, queue: asyncio.Queue) -> None:
        self._listeners.add(queue)

    def unregister_listener(self, queue: asyncio.Queue) -> None:
        self._listeners.discard(queue)

    async def start(self) -> None:
        if not self.is_running:
            self.is_running = True
            self.start_time = datetime.utcnow()
            self._task = asyncio.create_task(self._simulation_loop())
            logger.info("Telemetry streamer started at %.2fs interval", settings.STREAM_INTERVAL_SECONDS)

    async def stop(self) -> None:
        self.is_running = False
        if self._task:
            self._task.cancel()
            try:
                await self._task
            except asyncio.CancelledError:
                pass
            self._task = None
        logger.info("Telemetry streamer stopped.")

    async def _simulation_loop(self) -> None:
        while self.is_running:
            try:
                sensors = self._step_physics()
                packet = await self._generate_packet(sensors)
                self.latest_packet = packet

                # Persist to database/memory buffer
                await db_manager.save_telemetry(packet.model_dump())

                # Broadcast to connected WebSockets
                if self._listeners:
                    packet_json = packet.model_dump_json()
                    for q in list(self._listeners):
                        try:
                            q.put_nowait(packet_json)
                        except asyncio.QueueFull:
                            pass

                await asyncio.sleep(settings.STREAM_INTERVAL_SECONDS)
            except asyncio.CancelledError:
                break
            except Exception as err:
                logger.error("Error in telemetry streaming loop: %s", err, exc_info=True)
                await asyncio.sleep(1.0)

    def _step_physics(self) -> RawSensorData:
        target = self._scenario_targets[self.scenario]

        # Inertia smoothing rate (0.04 = ~2-3 seconds to transition between states)
        alpha = 0.04

        # Add Brownian noise
        temp_noise = random.gauss(0, 0.15)
        vib_noise = random.gauss(0, 12.0)
        load_noise = random.gauss(0, 8.0)
        rpm_noise = random.gauss(0, 3.5) if self.scenario != SimulationScenario.RAPID_ESTOP else 0.0

        # Special periodic harmonic spikes for loom beat-up vibration
        beat_phase = (datetime.utcnow().timestamp() * 10.0) % (2.0 * math.pi)
        loom_beat_harmonic = math.sin(beat_phase) * (45.0 if self.current_rpm > 100 else 0.0)

        # Smooth transition
        self.current_temp += (target["temp"] - self.current_temp) * alpha + temp_noise
        self.current_vib += (target["vib"] - self.current_vib) * alpha + vib_noise + loom_beat_harmonic
        self.current_load += (target["load"] - self.current_load) * alpha + load_noise
        self.current_rpm += (target["rpm"] - self.current_rpm) * (alpha * 1.5) + rpm_noise

        # Clamp physically realistic bounds
        self.current_temp = max(18.0, min(110.0, self.current_temp))
        self.current_vib = max(0.0, min(2500.0, self.current_vib))
        self.current_load = max(0.0, min(2000.0, self.current_load))
        self.current_rpm = max(0.0, min(1400.0, self.current_rpm))

        # Update production counters if running
        if self.current_rpm > 100:
            picks_this_tick = (self.current_rpm / 60.0) * settings.STREAM_INTERVAL_SECONDS
            self.total_picks += int(picks_this_tick)
            self.meters_woven += picks_this_tick / 1800.0  # ~1800 picks per meter of standard woven fabric

        return RawSensorData(
            timestamp=datetime.utcnow(),
            temperature=round(self.current_temp, 1),
            vibration=round(self.current_vib, 1),
            motor_load=round(self.current_load, 1),
            rpm=round(self.current_rpm, 1),
        )

    async def _generate_packet(self, sensors: RawSensorData) -> TelemetryPacket:
        # 1. Evaluate Physics Health Score
        overall_score, overall_status, breakdown, components = health_engine.evaluate_telemetry(sensors)

        # 2. Run ML Predictive Model
        ml_status, confidence, probs, failure_prob, risk_pct, rul_hours = ml_classifier.predict(sensors)

        # 3. Generate Explainability & Prescriptive Maintenance
        ai_prediction, recommendation = explainability_engine.explain(
            sensors, ml_status, confidence, probs, failure_prob, risk_pct, rul_hours
        )
        maintenance_service.update_recommendation(recommendation)

        # 4. Trigger Alarms / Alerts
        await alert_service.evaluate_sensor_alerts(sensors)

        # 5. Energy Intelligence Calculation
        energy_service.evaluate_energy(sensors, machine_id="LOOM-01")

        # 6. OEE Calculation (Availability * Performance * Quality)
        availability = 0.98 if sensors.rpm > 100 else 0.0
        perf = min(1.0, sensors.rpm / settings.RATED_RPM) if sensors.rpm > 0 else 0.0
        quality = 0.99 if overall_score > 70 else (0.92 if overall_score > 45 else 0.75)
        oee = round(availability * perf * quality * 100.0, 1)

        uptime_secs = (datetime.utcnow() - self.start_time).total_seconds()

        packet = TelemetryPacket(
            timestamp=sensors.timestamp,
            machine_id="LOOM-01",
            sensors=sensors,
            overall_health_score=overall_score,
            overall_status=overall_status,
            health_breakdown=breakdown,
            components=components,
            ai_prediction=ai_prediction,
            scenario=self.scenario,
            uptime_seconds=round(uptime_secs, 1),
            picks_per_minute=round(sensors.rpm, 1),
            total_picks=self.total_picks,
            meters_woven=round(self.meters_woven, 2),
            oee_percentage=oee,
            active_alerts_count=alert_service.get_active_count(),
        )

        # 7. Sync Machine A in Multi-Machine Fleet
        fleet_service.sync_primary_machine(packet)

        return packet


telemetry_streamer = TelemetryStreamer()
