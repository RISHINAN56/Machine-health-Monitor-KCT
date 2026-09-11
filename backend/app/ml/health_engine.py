import math
from typing import Dict, Tuple
from app.config import settings
from app.models.telemetry import (
    ComponentHealth,
    HealthBreakdown,
    MachineStatus,
    RawSensorData,
)


class HealthScoreEngine:
    """
    Industry 4.0 Multi-Factor Machine Health Score Engine.
    Conforms to ISO 10816 Mechanical Vibration standards and thermal degradation principles.
    Computes continuous 0-100 score, component-level stress, and physical health breakdown.
    """

    def __init__(self):
        self.weights = {
            "vibration": 0.35,
            "temperature": 0.25,
            "motor_load": 0.25,
            "rpm_stability": 0.15,
        }

    def compute_temperature_score(self, temp: float) -> Tuple[float, float]:
        """
        Calculates temperature score (0-100) and impact penalty (0-100).
        Optimal range: 20-38°C (Score: 100)
        Warning zone: 45-55°C
        Critical zone: > 55°C
        """
        if temp <= 38.0:
            score = 100.0
        elif temp <= 45.0:
            # 38°C -> 100, 45°C -> 85
            score = 100.0 - ((temp - 38.0) / 7.0) * 15.0
        elif temp <= 55.0:
            # 45°C -> 85, 55°C -> 50 (Warning zone)
            score = 85.0 - ((temp - 45.0) / 10.0) * 35.0
        else:
            # > 55°C (Critical zone)
            over = temp - 55.0
            score = max(0.0, 50.0 - over * 3.5)
        
        impact = round(100.0 - score, 2)
        return round(score, 2), impact

    def compute_vibration_score(self, vib: float) -> Tuple[float, float]:
        """
        Calculates vibration health score based on ISO 10816 Class II vibration severity.
        Zone A/B (Healthy): < 350 mm/s (Score: 95-100)
        Zone C (Allowable/Warning): 350 - 750 mm/s (Score: 50-90)
        Zone D (Hazard/Critical): > 750 mm/s (Score: 0-49)
        """
        if vib <= 250.0:
            score = 100.0
        elif vib <= 450.0:
            score = 100.0 - ((vib - 250.0) / 200.0) * 15.0
        elif vib <= 750.0:
            score = 85.0 - ((vib - 450.0) / 300.0) * 35.0
        else:
            over = vib - 750.0
            score = max(0.0, 50.0 - (over / 400.0) * 50.0)

        impact = round(100.0 - score, 2)
        return round(score, 2), impact

    def compute_load_score(self, load: float) -> Tuple[float, float]:
        """
        Calculates motor load score.
        Nominal load: 100 - 450 A-load
        Warning: 650 - 850 A-load
        Critical overload: > 850 A-load
        """
        if load <= 450.0:
            score = 100.0
        elif load <= 650.0:
            score = 100.0 - ((load - 450.0) / 200.0) * 20.0
        elif load <= 850.0:
            score = 80.0 - ((load - 650.0) / 200.0) * 35.0
        else:
            over = load - 850.0
            score = max(0.0, 45.0 - (over / 300.0) * 45.0)

        impact = round(100.0 - score, 2)
        return round(score, 2), impact

    def compute_rpm_stability_score(self, rpm: float) -> Tuple[float, float]:
        """
        Evaluates RPM stability against rated loom speed (settings.RATED_RPM = 650 RPM).
        Deviation > 15% begins warning; deviation > 35% is critical.
        """
        rated = settings.RATED_RPM
        dev_percent = abs(rpm - rated) / rated * 100.0

        if dev_percent <= 8.0:
            score = 100.0
        elif dev_percent <= 20.0:
            score = 100.0 - ((dev_percent - 8.0) / 12.0) * 25.0
        elif dev_percent <= 40.0:
            score = 75.0 - ((dev_percent - 20.0) / 20.0) * 35.0
        else:
            over = dev_percent - 40.0
            score = max(0.0, 40.0 - over * 1.5)

        impact = round(100.0 - score, 2)
        return round(score, 2), impact

    def evaluate_telemetry(self, sensors: RawSensorData) -> Tuple[float, MachineStatus, HealthBreakdown, Dict[str, ComponentHealth]]:
        temp_score, temp_impact = self.compute_temperature_score(sensors.temperature)
        vib_score, vib_impact = self.compute_vibration_score(sensors.vibration)
        load_score, load_impact = self.compute_load_score(sensors.motor_load)
        rpm_score, rpm_impact = self.compute_rpm_stability_score(sensors.rpm)

        overall_score = (
            temp_score * self.weights["temperature"]
            + vib_score * self.weights["vibration"]
            + load_score * self.weights["motor_load"]
            + rpm_score * self.weights["rpm_stability"]
        )
        overall_score = round(max(0.0, min(100.0, overall_score)), 2)

        # Determine machine overall status
        if overall_score >= 78.0 and sensors.vibration < settings.CRITICAL_LIMITS["vibration"] and sensors.temperature < settings.CRITICAL_LIMITS["temperature"]:
            overall_status = MachineStatus.HEALTHY
        elif overall_score >= 50.0:
            overall_status = MachineStatus.WARNING
        else:
            overall_status = MachineStatus.CRITICAL

        health_breakdown = HealthBreakdown(
            temperature_score=temp_score,
            temperature_impact=temp_impact,
            vibration_score=vib_score,
            vibration_impact=vib_impact,
            motor_load_score=load_score,
            motor_load_impact=load_impact,
            rpm_stability_score=rpm_score,
            rpm_stability_impact=rpm_impact,
        )

        # Component health mapping with physical weighting
        components = self._compute_components_health(sensors, temp_score, vib_score, load_score, rpm_score)

        return overall_score, overall_status, health_breakdown, components

    def _compute_components_health(
        self,
        sensors: RawSensorData,
        temp_s: float,
        vib_s: float,
        load_s: float,
        rpm_s: float,
    ) -> Dict[str, ComponentHealth]:
        comps = {}

        # 1. Main Motor: Nominal lifetime ~260 days
        motor_score = round(load_s * 0.55 + temp_s * 0.35 + vib_s * 0.1, 2)
        comps["main_motor"] = self._build_comp(
            "Main Motor", motor_score, sensors.temperature + 4.2, sensors.vibration * 0.6, base_life_days=260.0
        )

        # 2. Drive Shaft: Nominal lifetime ~480 days
        shaft_score = round(rpm_s * 0.45 + vib_s * 0.45 + load_s * 0.1, 2)
        comps["drive_shaft"] = self._build_comp(
            "Drive Shaft", shaft_score, sensors.temperature * 0.9, sensors.vibration * 0.85, base_life_days=480.0
        )

        # 3. Bearings: Highly sensitive to Vibration. Nominal lifetime ~140 days
        bearing_score = round(vib_s * 0.70 + temp_s * 0.30, 2)
        comps["bearings"] = self._build_comp(
            "Bearing System", bearing_score, sensors.temperature + 6.8, sensors.vibration * 1.15, base_life_days=140.0
        )

        # 4. Belt System: Nominal lifetime ~45 days
        belt_score = round(rpm_s * 0.60 + load_s * 0.40, 2)
        comps["belt_system"] = self._build_comp(
            "Belt Drive", belt_score, sensors.temperature * 0.85, sensors.vibration * 0.5, base_life_days=45.0
        )

        # 5. Loom Section: Reciprocating heald frames & reed. Nominal lifetime ~210 days
        loom_score = round(vib_s * 0.45 + load_s * 0.35 + rpm_s * 0.20, 2)
        comps["loom_section"] = self._build_comp(
            "Loom Section", loom_score, sensors.temperature * 0.88, sensors.vibration * 0.95, base_life_days=210.0
        )

        # 6. Power Unit & Inverter: Electrical and load stress. Nominal lifetime ~800 days
        power_score = round(load_s * 0.65 + temp_s * 0.35, 2)
        comps["power_unit"] = self._build_comp(
            "Power Unit", power_score, sensors.temperature + 1.5, sensors.vibration * 0.2, base_life_days=800.0
        )

        return comps

    def _build_comp(
        self, name: str, score: float, temp: float, vib: float, base_life_days: float = 180.0
    ) -> ComponentHealth:
        stress = round(100.0 - score, 2)
        risk = round(max(0.0, min(100.0, stress * 1.05)), 1)

        # Failure probability non-linear Weibull curve
        if score >= 85.0:
            fail_prob = round(max(0.0, (100.0 - score) * 0.15), 1)
        else:
            fail_prob = round(min(100.0, max(0.0, 100.0 * (1.0 - math.exp(-((100.0 - score) / 38.0) ** 2.2)))), 1)

        # Remaining Useful Life (RUL)
        degradation_factor = max(0.01, (score / 100.0) ** 1.9)
        rul_days = round(max(0.5, base_life_days * degradation_factor), 1)
        rul_hours = round(rul_days * 24.0, 1)

        # Maintenance Status Classification
        if score >= 78.0:
            status = MachineStatus.HEALTHY
            maint_status = "OPTIMAL"
            glow = "#10b981"  # Emerald green
            is_failing = False
        elif score >= 50.0:
            status = MachineStatus.WARNING
            maint_status = "MONITOR"
            glow = "#f59e0b"  # Amber yellow
            is_failing = False
        elif score >= 28.0:
            status = MachineStatus.CRITICAL
            maint_status = "SERVICE REQUIRED"
            glow = "#ef4444"  # Crimson red
            is_failing = False
        else:
            status = MachineStatus.CRITICAL
            maint_status = "CRITICAL FAILURE"
            glow = "#dc2626"  # Flashing deep red
            is_failing = True

        return ComponentHealth(
            name=name,
            status=status,
            health_score=score,
            risk_score=risk,
            failure_probability=fail_prob,
            maintenance_status=maint_status,
            remaining_useful_life_days=rul_days,
            remaining_useful_life_hours=rul_hours,
            is_failing=is_failing,
            temperature=round(temp, 1),
            vibration=round(vib, 1),
            stress_level=stress,
            glow_color=glow,
        )


health_engine = HealthScoreEngine()
