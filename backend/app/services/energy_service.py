from datetime import datetime, timezone
import math
from typing import Optional
from app.models.energy import EnergyMetrics
from app.models.telemetry import RawSensorData


class EnergyIntelligenceService:
    """
    Industry 4.0 Energy Intelligence & Power Loss Detection Service.
    Calculates active power (kW), electromechanical efficiency, thermodynamic/friction losses,
    and cumulative energy costs in real time.
    """

    def __init__(self):
        self.tariff_rate_usd_per_kwh: float = 0.14  # Standard Industrial Tariff ($/kWh)
        self.start_time: datetime = datetime.now(timezone.utc)
        self.cumulative_kwh_today: float = 142.8
        self.cumulative_kwh_week: float = 890.5
        self.cumulative_kwh_month: float = 3840.0
        self.last_update_time: datetime = datetime.now(timezone.utc)

    def evaluate_energy(self, sensors: RawSensorData, machine_id: str = "LOOM-01") -> EnergyMetrics:
        now = datetime.now(timezone.utc)
        dt_hours = max(0.0001, (now - self.last_update_time).total_seconds() / 3600.0)
        self.last_update_time = now

        # 3-Phase Electrical Power Model: P = sqrt(3) * V * I * cos(phi) / 1000
        # Voltage = 400V RMS line-to-line
        v_line = 400.0
        # Current derived from motor load (load 350 ~ 15.5A, load 850 ~ 38A)
        phase_current = max(4.0, (sensors.motor_load / 1000.0) * 44.0)

        # Power factor (cos phi) degrades during idle or severe mechanical resistance
        if sensors.rpm < 50:
            cos_phi = 0.45
        elif sensors.motor_load > 800:
            cos_phi = 0.92
        else:
            cos_phi = 0.88

        apparent_kva = (math.sqrt(3) * v_line * phase_current) / 1000.0
        active_kw = apparent_kva * cos_phi

        # Power Loss Modeling: Baseline friction + Bearing parasitic drag + Stator copper heating
        baseline_loss_kw = 1.15
        vib_friction_loss_kw = (sensors.vibration / 600.0) ** 1.6 * 1.45
        thermal_dissipation_loss_kw = max(0.0, (sensors.temperature - 35.0) * 0.055)
        total_loss_kw = min(active_kw * 0.45, baseline_loss_kw + vib_friction_loss_kw + thermal_dissipation_loss_kw)

        # Useful mechanical output power & efficiency
        useful_kw = max(0.2, active_kw - total_loss_kw)
        efficiency_pct = min(96.5, max(45.0, (useful_kw / max(0.5, active_kw)) * 100.0))

        # Energy consumption accumulation
        kwh_increment = active_kw * dt_hours
        self.cumulative_kwh_today += kwh_increment
        self.cumulative_kwh_week += kwh_increment
        self.cumulative_kwh_month += kwh_increment

        # Operating cost metrics ($0.14 / kWh)
        cost_per_hour = active_kw * self.tariff_rate_usd_per_kwh
        cost_today = self.cumulative_kwh_today * self.tariff_rate_usd_per_kwh
        cost_monthly_estimate = self.cumulative_kwh_month * self.tariff_rate_usd_per_kwh

        # Energy waste detection & savings opportunity
        excess_loss_kw = max(0.0, total_loss_kw - baseline_loss_kw)
        waste_active = excess_loss_kw > 0.8
        potential_monthly_savings = excess_loss_kw * 24.0 * 30.0 * self.tariff_rate_usd_per_kwh

        waste_reason = None
        if waste_active:
            if sensors.vibration > 450:
                waste_reason = f"Parasitic mechanical friction from elevated bearing vibration ({sensors.vibration:.0f} mm/s) dissipates ~{excess_loss_kw:.1f} kW excess load."
            elif sensors.temperature > 50:
                waste_reason = f"Thermal degradation and high stator temperature ({sensors.temperature:.1f}°C) causes increased winding resistance."
            else:
                waste_reason = f"Drive train drag and torque resistance adds ~{excess_loss_kw:.1f} kW unneeded consumption."

        return EnergyMetrics(
            timestamp=now,
            machine_id=machine_id,
            power_kw=round(active_kw, 2),
            apparent_power_kva=round(apparent_kva, 2),
            power_factor=round(cos_phi, 2),
            energy_today_kwh=round(self.cumulative_kwh_today, 2),
            energy_weekly_kwh=round(self.cumulative_kwh_week, 1),
            energy_monthly_kwh=round(self.cumulative_kwh_month, 1),
            power_loss_kw=round(total_loss_kw, 2),
            energy_efficiency_pct=round(efficiency_pct, 1),
            cost_per_hour_usd=round(cost_per_hour, 2),
            cost_today_usd=round(cost_today, 2),
            cost_monthly_estimate_usd=round(cost_monthly_estimate, 1),
            cost_savings_opportunity_usd=round(potential_monthly_savings, 2),
            waste_detection_active=waste_active,
            waste_reason=waste_reason,
        )


energy_service = EnergyIntelligenceService()
