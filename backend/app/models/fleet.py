from datetime import datetime
from typing import List, Optional
from pydantic import BaseModel, Field
from app.models.telemetry import MachineStatus


class MachineSummary(BaseModel):
    machine_id: str = Field(..., description="Unique machine ID (e.g. LOOM-01)")
    name: str = Field(..., description="Human-readable machine name (e.g. Air-Jet Loom A)")
    model: str = Field("Picanol OmniPlus-i", description="Manufacturer & model specification")
    status: MachineStatus = Field(MachineStatus.HEALTHY, description="Current machine health state")
    health_score: float = Field(..., ge=0.0, le=100.0, description="Overall continuous health index")
    rpm: float = Field(..., description="Operating speed in RPM")
    temperature: float = Field(..., description="Stator temperature in °C")
    vibration: float = Field(..., description="Spindle vibration velocity in mm/s RMS")
    scenario: str = Field("normal", description="Active fault scenario")
    oee_percentage: float = Field(..., description="Overall Equipment Effectiveness %")
    location: str = Field("Bay 3 - Weaving Shed North", description="Factory floor bay location")
    meters_woven_today: float = Field(0.0, description="Fabric output today in meters")
    active_alerts_count: int = Field(0, description="Number of unresolved alerts")


class FleetOverview(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    factory_name: str = Field("Coimbatore Smart Weaving Facility 4.0")
    total_machines: int = Field(5)
    active_machines: int = Field(5)
    factory_health_score: float = Field(..., ge=0.0, le=100.0)
    fleet_oee_average: float = Field(..., ge=0.0, le=100.0)
    total_power_kw: float = Field(..., description="Cumulative instantaneous facility load in kW")
    machines: List[MachineSummary]
