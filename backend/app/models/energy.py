from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class EnergyMetrics(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    machine_id: str = Field("LOOM-01", description="Monitored machine ID")
    power_kw: float = Field(..., description="Active electrical power demand in kW")
    apparent_power_kva: float = Field(..., description="Apparent electrical power in kVA")
    power_factor: float = Field(..., description="Operating power factor (cos phi)")
    energy_today_kwh: float = Field(..., description="Cumulative energy consumed today in kWh")
    energy_weekly_kwh: float = Field(..., description="Energy consumed this week in kWh")
    energy_monthly_kwh: float = Field(..., description="Energy consumed this month in kWh")
    power_loss_kw: float = Field(..., description="Power lost to mechanical friction & thermal dissipation in kW")
    energy_efficiency_pct: float = Field(..., description="Electromechanical conversion efficiency percentage (0-100%)")
    cost_per_hour_usd: float = Field(..., description="Current running cost per hour in USD")
    cost_today_usd: float = Field(..., description="Accumulated energy expenditure today in USD")
    cost_monthly_estimate_usd: float = Field(..., description="Projected monthly energy expenditure in USD")
    cost_savings_opportunity_usd: float = Field(..., description="Potential monthly savings achievable through corrective maintenance")
    waste_detection_active: bool = Field(False, description="True if energy waste is detected due to abnormal friction or slippage")
    waste_reason: Optional[str] = Field(None, description="Explanation of detected energy waste")
