import uuid
from datetime import datetime
from typing import Dict, List, Optional
from app.config import settings
from app.database import db_manager
from app.models.alert import AlertEvent, AlertSeverity
from app.models.telemetry import RawSensorData


class AlertService:
    """
    Industrial Alarm & Fault Event Service.
    Applies ISO 10816 standards, detects threshold violations, and deduplicates active alerts.
    """

    def __init__(self):
        self._active_conditions: Dict[str, str] = {}  # key -> alert_id
        self._recent_alerts: List[AlertEvent] = []

    async def evaluate_sensor_alerts(self, sensors: RawSensorData) -> List[AlertEvent]:
        new_alerts: List[AlertEvent] = []

        # 1. Vibration
        vib = sensors.vibration
        if vib >= settings.CRITICAL_LIMITS["vibration"]:
            await self._trigger(
                "vibration_crit",
                AlertSeverity.CRITICAL,
                "bearings",
                "Critical Vibration: ISO Zone D Violation",
                f"Vibration has escalated to {vib:.1f} mm/s (Hazard threshold >= {settings.CRITICAL_LIMITS['vibration']} mm/s). High risk of bearing raceway seizure.",
                "vibration",
                vib,
                settings.CRITICAL_LIMITS["vibration"],
                new_alerts,
            )
        elif vib >= settings.SAFE_LIMITS["vibration"]:
            await self._trigger(
                "vibration_warn",
                AlertSeverity.WARNING,
                "bearings",
                "High Vibration: Bearing Wear Alert",
                f"Vibration is {vib:.1f} mm/s, exceeding safe allowable limit ({settings.SAFE_LIMITS['vibration']} mm/s).",
                "vibration",
                vib,
                settings.SAFE_LIMITS["vibration"],
                new_alerts,
            )
        else:
            await self._resolve("vibration_crit")
            await self._resolve("vibration_warn")

        # 2. Temperature
        temp = sensors.temperature
        if temp >= settings.CRITICAL_LIMITS["temperature"]:
            await self._trigger(
                "temp_crit",
                AlertSeverity.CRITICAL,
                "main_motor",
                "Thermal Runaway: Motor Overheating",
                f"Operating temperature has surged to {temp:.1f}°C (Critical threshold >= {settings.CRITICAL_LIMITS['temperature']}°C). Motor winding burnout risk.",
                "temperature",
                temp,
                settings.CRITICAL_LIMITS["temperature"],
                new_alerts,
            )
        elif temp >= settings.SAFE_LIMITS["temperature"]:
            await self._trigger(
                "temp_warn",
                AlertSeverity.WARNING,
                "main_motor",
                "Thermal Warning: Elevated Operating Temperature",
                f"Motor temperature is elevated at {temp:.1f}°C (> {settings.SAFE_LIMITS['temperature']}°C safe limit).",
                "temperature",
                temp,
                settings.SAFE_LIMITS["temperature"],
                new_alerts,
            )
        else:
            await self._resolve("temp_crit")
            await self._resolve("temp_warn")

        # 3. Motor Load
        load = sensors.motor_load
        if load >= settings.CRITICAL_LIMITS["motor_load"]:
            await self._trigger(
                "load_crit",
                AlertSeverity.CRITICAL,
                "loom_section",
                "Mechanical Resistance: Motor Overload",
                f"Loom drive current reached {load:.0f} A-load. Severe friction or mechanical obstruction in shedding motion.",
                "motor_load",
                load,
                settings.CRITICAL_LIMITS["motor_load"],
                new_alerts,
            )
        elif load >= settings.SAFE_LIMITS["motor_load"]:
            await self._trigger(
                "load_warn",
                AlertSeverity.WARNING,
                "loom_section",
                "High Load: Drive Train Resistance",
                f"Motor load is high at {load:.0f} A-load (> {settings.SAFE_LIMITS['motor_load']} limit).",
                "motor_load",
                load,
                settings.SAFE_LIMITS["motor_load"],
                new_alerts,
            )
        else:
            await self._resolve("load_crit")
            await self._resolve("load_warn")

        # 4. RPM Anomaly
        rpm = sensors.rpm
        if rpm > 0 and abs(rpm - settings.RATED_RPM) > 160.0:
            await self._trigger(
                "rpm_instability",
                AlertSeverity.WARNING,
                "belt_system",
                "RPM Instability: Speed Deviation",
                f"Spindle speed is {rpm:.0f} RPM (Deviation > 160 RPM from rated {settings.RATED_RPM:.0f} RPM). Potential belt slip.",
                "rpm",
                rpm,
                settings.RATED_RPM,
                new_alerts,
            )
        elif rpm == 0:
            await self._trigger(
                "machine_stopped",
                AlertSeverity.INFO,
                "power_unit",
                "Machine Inactive: Spindle Stoppage",
                "Loom main spindle has halted (0 RPM).",
                "rpm",
                0.0,
                0.0,
                new_alerts,
            )
        else:
            await self._resolve("rpm_instability")
            await self._resolve("machine_stopped")

        return new_alerts

    async def _trigger(
        self,
        condition_key: str,
        severity: AlertSeverity,
        component: str,
        title: str,
        message: str,
        metric_name: str,
        metric_value: float,
        threshold_value: float,
        out_list: List[AlertEvent],
    ):
        if condition_key in self._active_conditions:
            return  # Already active, prevent alert flood

        alert = AlertEvent(
            id=f"ALT-{uuid.uuid4().hex[:8].upper()}",
            timestamp=datetime.utcnow(),
            severity=severity,
            component=component,
            title=title,
            message=message,
            metric_name=metric_name,
            metric_value=round(metric_value, 1),
            threshold_value=round(threshold_value, 1),
            acknowledged=False,
            resolved=False,
        )

        self._active_conditions[condition_key] = alert.id
        self._recent_alerts.insert(0, alert)
        self._recent_alerts = self._recent_alerts[:100]

        await db_manager.save_alert(alert.model_dump())
        out_list.append(alert)

    async def _resolve(self, condition_key: str):
        if condition_key in self._active_conditions:
            alert_id = self._active_conditions.pop(condition_key)
            await db_manager.resolve_alert(alert_id)
            for a in self._recent_alerts:
                if a.id == alert_id:
                    a.resolved = True
                    a.resolved_at = datetime.utcnow()

    def get_recent_alerts(self, limit: int = 50) -> List[AlertEvent]:
        return self._recent_alerts[:limit]

    def get_active_count(self) -> int:
        return len(self._active_conditions)


alert_service = AlertService()
