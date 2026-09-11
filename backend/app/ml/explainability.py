from typing import Optional, Tuple
from app.config import settings
from app.models.maintenance import MaintenancePriority, MaintenanceRecommendation
from app.models.telemetry import AIPrediction, MachineStatus, RawSensorData, TelemetryPacket


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

    def answer_assistant_query(
        self, question: str, telemetry: Optional[TelemetryPacket] = None, machine_id: str = "LOOM-01"
    ):
        """
        Grounded AI Assistant reasoning engine.
        Synthesizes live sensor values, component degradation, and ISO thresholds to provide
        instant, accurate industrial diagnostics and maintenance SOPs.
        """
        from app.models.assistant import AssistantResponse

        if not telemetry:
            return AssistantResponse(
                question=question,
                machine_id=machine_id,
                answer="Telemetry stream is currently initializing. All initial sensor baselines are healthy at 650 RPM.",
                root_cause="Awaiting live sensor ingestion.",
                risk_assessment="LOW RISK - Systems starting up.",
                recommended_action="Verify network telemetry connection at port 8000.",
                confidence=0.92,
            )

        sensors = telemetry.sensors
        status = telemetry.overall_status.value
        health = telemetry.overall_health_score
        q_lower = question.lower()

        # Find most stressed component
        sorted_comps = sorted(telemetry.components.values(), key=lambda c: c.health_score)
        worst_comp = sorted_comps[0] if sorted_comps else None

        if "vibration" in q_lower or "shake" in q_lower or "shaking" in q_lower:
            if sensors.vibration > 450:
                root_cause = f"High accelerometer amplitude ({sensors.vibration:.1f} mm/s RMS) indicates dynamic mechanical unbalance or bearing raceway spalling in {worst_comp.name if worst_comp else 'the drive train'}."
                risk = "CRITICAL RISK: Exceeds ISO 10816 Zone C limits. Prolonged operation risks catastrophic bearing seizure."
                action = "1. Immediate vibration spectral analysis. 2. Inspect bearing lubrication and grease quality. 3. Re-torque pillow block mounting bolts. 4. Check drive shaft coaxial alignment."
                answer = f"The machine is vibrating excessively ({sensors.vibration:.1f} mm/s RMS). Under ISO 10816 Class II, normal vibration should remain below 350 mm/s. The {worst_comp.name if worst_comp else 'bearing assembly'} is experiencing {worst_comp.stress_level if worst_comp else 80:.0f}% mechanical stress."
            else:
                root_cause = "Nominal mechanical operation with acceptable shaft rotational harmonics."
                risk = "LOW RISK: Vibration is well within ISO 10816 Zone A/B (<350 mm/s)."
                action = "Continue standard monitoring. Next acoustic lubrication inspection in 150 operating hours."
                answer = f"Spindle vibration is currently at {sensors.vibration:.1f} mm/s RMS, which is well within ISO 10816 Zone A/B boundaries (<350 mm/s). Loom beat-up frequency harmonics are normal."

        elif "fail" in q_lower or "component" in q_lower or "likely" in q_lower:
            if worst_comp:
                root_cause = f"{worst_comp.name} exhibits lowest health score ({worst_comp.health_score:.1f}%) with {worst_comp.failure_probability:.1f}% failure probability."
                risk = f"COMPONENT AT RISK: {worst_comp.name} has ~{worst_comp.remaining_useful_life_days:.0f} days ({worst_comp.remaining_useful_life_hours:.0f} hours) RUL remaining."
                action = f"Schedule prescriptive overhaul of {worst_comp.name}. Maintenance status: {worst_comp.maintenance_status}."
                answer = f"Based on Weibull degradation modeling, **{worst_comp.name}** is the component most likely to require service. It is currently at {worst_comp.health_score:.1f}% health with {worst_comp.failure_probability:.1f}% failure probability and an estimated Remaining Useful Life of {worst_comp.remaining_useful_life_days:.0f} days."
            else:
                root_cause = "All components operating nominally."
                risk = "LOW RISK across all assemblies."
                action = "Routine inspection."
                answer = "All 6 machine sub-assemblies (Main Motor, Bearing System, Drive Shaft, Belt Drive, Loom Section, Power Unit) are operating within optimal parameters (>90% health)."

        elif "health" in q_lower or "decrease" in q_lower or "drop" in q_lower or "why" in q_lower:
            root_cause = telemetry.ai_prediction.explanation
            risk = f"Overall machine health is at {health:.1f}% ({status}). Failure risk probability is {telemetry.ai_prediction.failure_probability:.1f}%."
            action = "Review prescriptive maintenance work orders and address active alarms."
            answer = f"Machine health is currently at **{health:.1f}%** ({status}).\n\n**Primary Physical Cause:**\n{telemetry.ai_prediction.explanation}\n\n**Degradation Breakdown:**\n- Vibration Score: {telemetry.health_breakdown.vibration_score:.0f}%\n- Temperature Score: {telemetry.health_breakdown.temperature_score:.0f}%\n- Motor Load Score: {telemetry.health_breakdown.motor_load_score:.0f}%\n- Speed Stability: {telemetry.health_breakdown.rpm_stability_score:.0f}%"

        elif "maintenance" in q_lower or "action" in q_lower or "recommend" in q_lower or "procedure" in q_lower:
            if health < 75 or sensors.vibration > 450 or sensors.temperature > 45:
                root_cause = f"Active fault condition in {worst_comp.name if worst_comp else 'machine'}."
                risk = f"Maintenance priority: {telemetry.ai_prediction.status.value.upper()}."
                action = "Execute SOP: 1. Safely lock-out loom. 2. Inspect target assembly. 3. Dispatch maintenance work order."
                answer = f"**Recommended Maintenance Actions for {machine_id}:**\n\n1. **Primary Target:** {worst_comp.name if worst_comp else 'Drive Assembly'}\n2. **Urgency:** {worst_comp.maintenance_status if worst_comp else 'SERVICE REQUIRED'}\n3. **Prescribed Procedure:** {telemetry.ai_prediction.diagnosis}\n4. **Recommended Action Window:** Within {min(48.0, telemetry.ai_prediction.remaining_useful_life_hours):.0f} Operating Hours."
            else:
                root_cause = "No active mechanical faults detected."
                risk = "LOW RISK: Nominal operation."
                action = "Perform routine shift cleaning and lint removal."
                answer = f"All systems are operating in optimal ISO Class II condition. Recommended action: Standard 500-hour preventive lubrication and cleaning of lint filters on the motor cooling fan."

        else:
            root_cause = f"Real-time sensor telemetry: Temp={sensors.temperature:.1f}°C, Vib={sensors.vibration:.1f} mm/s, Load={sensors.motor_load:.0f}A, Speed={sensors.rpm:.0f} RPM."
            risk = f"Machine status is {status} with health index {health:.1f}%."
            action = "Monitor live 3D telemetry and sensor sparklines."
            answer = f"**AegisTwin Diagnostic Summary for {machine_id}:**\n\n- **Operating Speed:** {sensors.rpm:.0f} RPM\n- **Spindle Vibration:** {sensors.vibration:.1f} mm/s RMS (ISO Standard)\n- **Stator Temperature:** {sensors.temperature:.1f}°C\n- **Motor Torque Load:** {sensors.motor_load:.0f} A-load\n- **Overall Health:** {health:.1f}%\n\n{telemetry.ai_prediction.explanation}"

        return AssistantResponse(
            question=question,
            machine_id=machine_id,
            answer=answer,
            root_cause=root_cause,
            risk_assessment=risk,
            recommended_action=action,
            confidence=0.96,
        )


explainability_engine = ExplainabilityEngine()
