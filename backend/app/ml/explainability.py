from typing import Tuple
from app.config import settings
from app.models.maintenance import MaintenancePriority, MaintenanceRecommendation
from app.models.telemetry import AIPrediction, MachineStatus, RawSensorData


class ExplainabilityEngine:
    """
    Industrial AI Diagnostic & Explainability Engine.
    Correlates sensor anomalies with mechanical failure modes and explains WHY recommendations are generated.
    """

    def explain(
        self,
        sensors: RawSensorData,
        status: MachineStatus,
        confidence: float,
        probs: dict[str, float],
        failure_prob: float,
        risk_pct: float,
        rul_hours: float,
    ) -> Tuple[AIPrediction, MaintenanceRecommendation | None]:
        # Identify dominant anomaly contributors
        temp = sensors.temperature
        vib = sensors.vibration
        load = sensors.motor_load
        rpm = sensors.rpm

        temp_excess = temp - settings.SAFE_LIMITS["temperature"]
        vib_excess = vib - settings.SAFE_LIMITS["vibration"]
        load_excess = load - settings.SAFE_LIMITS["motor_load"]
        rpm_dev = abs(rpm - settings.RATED_RPM)

        diagnosis_parts = []
        explanation_parts = []
        recommended_action = None
        component_target = "General Loom"
        priority = MaintenancePriority.LOW
        window_hours = 720.0

        if vib_excess > 0:
            pct = round((vib / settings.SAFE_LIMITS["vibration"] - 1.0) * 100.0, 1)
            if vib >= settings.CRITICAL_LIMITS["vibration"]:
                diagnosis_parts.append(f"Severe mechanical vibration ({vib:.1f} mm/s, +{pct}% above limit)")
                explanation_parts.append(
                    f"High-frequency accelerometer spikes indicate advanced inner/outer raceway spalling in main spindle bearings. "
                    f"Dynamic unbalance risk is critical at {rpm:.0f} RPM."
                )
                recommended_action = "Replace Spindle Bearings & Align Shaft"
                component_target = "bearings"
                priority = MaintenancePriority.EMERGENCY
                window_hours = 8.0
            else:
                diagnosis_parts.append(f"Elevated vibration ({vib:.1f} mm/s)")
                explanation_parts.append(
                    f"Vibration velocity exceeds ISO 10816 allowable range (+{pct}%). Likely dry bearing friction or minor shaft misalignment."
                )
                recommended_action = "Lubricate Main Shaft Bearings"
                component_target = "bearings"
                priority = MaintenancePriority.MEDIUM
                window_hours = 48.0

        if temp_excess > 0:
            if temp >= settings.CRITICAL_LIMITS["temperature"]:
                diagnosis_parts.append(f"Critical thermal runaway ({temp:.1f}°C)")
                explanation_parts.append(
                    f"Stator winding and bearing housing temperature reached {temp:.1f}°C (>55°C limit). Risk of coil insulation breakdown or thermal seizure."
                )
                if recommended_action is None or priority != MaintenancePriority.EMERGENCY:
                    recommended_action = "Emergency Motor Cooling Service & Stator Inspection"
                    component_target = "main_motor"
                    priority = MaintenancePriority.EMERGENCY
                    window_hours = 4.0
            else:
                diagnosis_parts.append(f"Elevated thermal signature ({temp:.1f}°C)")
                explanation_parts.append(
                    f"Temperature is operating in warning band ({temp:.1f}°C). Cooling fins may be clogged with textile lint or fan airflow restricted."
                )
                if recommended_action is None:
                    recommended_action = "Clean Motor Heat Sinks & Inspect Airflow"
                    component_target = "main_motor"
                    priority = MaintenancePriority.LOW
                    window_hours = 72.0

        if load_excess > 0:
            if load >= settings.CRITICAL_LIMITS["motor_load"]:
                diagnosis_parts.append(f"Severe motor overload ({load:.0f} A-load)")
                explanation_parts.append(
                    f"Motor load current exceeds continuous rating by {load - settings.CRITICAL_LIMITS['motor_load']:.0f} A-load. "
                    f"Mechanical binding detected in the loom rapier drive or shed mechanism."
                )
                if priority != MaintenancePriority.EMERGENCY:
                    recommended_action = "Inspect Loom Shedding Motion & Rapier Drive"
                    component_target = "loom_section"
                    priority = MaintenancePriority.HIGH
                    window_hours = 12.0
            else:
                diagnosis_parts.append(f"High mechanical load ({load:.0f} A-load)")
                explanation_parts.append(
                    f"Motor load is above standard baseline. Check drive belt tension and lubrication on the sley sword links."
                )
                if recommended_action is None:
                    recommended_action = "Adjust Belt Tension & Inspect Loom Motion"
                    component_target = "belt_system"
                    priority = MaintenancePriority.MEDIUM
                    window_hours = 60.0

        if rpm_dev > 100.0:
            diagnosis_parts.append(f"Speed instability ({rpm:.0f} RPM vs {settings.RATED_RPM:.0f} rated)")
            explanation_parts.append(
                f"Drive shaft RPM fluctuated by {rpm_dev:.0f} RPM from nominal speed. Potential timing belt slip or inverter frequency drift."
            )
            if recommended_action is None:
                recommended_action = "Inspect Timing Belt Tension & VFD Inverter"
                component_target = "belt_system"
                priority = MaintenancePriority.MEDIUM
                window_hours = 36.0

        if not diagnosis_parts:
            diagnosis = "All physical operational parameters within optimal ISO boundaries."
            explanation = (
                f"Loom operating steadily at {rpm:.0f} RPM with nominal vibration ({vib:.1f} mm/s) "
                f"and normal thermal dissipation ({temp:.1f}°C). No mechanical or electrical anomalies detected."
            )
            rec = None
        else:
            diagnosis = " | ".join(diagnosis_parts)
            explanation = " ".join(explanation_parts)
            rec = MaintenanceRecommendation(
                id=f"REC-{int(sensors.timestamp.timestamp())}",
                component=component_target,
                action=recommended_action or "Routine Preventive Inspection",
                priority=priority,
                confidence_score=round(confidence, 2),
                root_cause_explanation=explanation,
                recommended_window_hours=window_hours,
                created_at=sensors.timestamp,
            )

        health_pct = round((100.0 - failure_prob), 2)

        prediction = AIPrediction(
            status=status,
            confidence=confidence,
            probabilities=probs,
            failure_probability=failure_prob,
            risk_percentage=risk_pct,
            health_percentage=health_pct,
            remaining_useful_life_hours=rul_hours,
            diagnosis=diagnosis,
            explanation=explanation,
        )

        return prediction, rec


explainability_engine = ExplainabilityEngine()
