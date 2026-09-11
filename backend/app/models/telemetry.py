from datetime import datetime
from enum import Enum
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class MachineStatus(str, Enum):
    HEALTHY = "Healthy"
    WARNING = "Warning"
    CRITICAL = "Critical"


class SimulationScenario(str, Enum):
    NORMAL = "normal"
    # Phase 2 5 Industrial Failure Modes
    BEARING_WEAR = "bearing_wear"            # 1. Bearing Failure
    MOTOR_OVERLOAD = "motor_overload"        # 2. Motor Overload
    SHAFT_MISALIGNMENT = "shaft_misalignment"# 3. Shaft Misalignment
    BELT_SLIPPAGE = "belt_slippage"          # 4. Belt Slippage
    OVERHEATING = "overheating"              # 5. Overheating
    # Backwards compatibility aliases
    MOTOR_OVERHEAT = "motor_overheat"
    LOOM_JAM = "loom_jam"
    RAPID_ESTOP = "rapid_estop"
    SPEED_FLUCTUATION = "speed_fluctuation"


class RawSensorData(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    temperature: float = Field(..., description="Operating temperature in Celsius (°C)")
    vibration: float = Field(..., description="Vibration velocity in mm/s RMS")
    motor_load: float = Field(..., description="Motor load current / torque in A-load")
    rpm: float = Field(..., description="Spindle / Loom drive speed in RPM")


class HealthBreakdown(BaseModel):
    temperature_score: float = Field(..., ge=0.0, le=100.0)
    temperature_impact: float = Field(..., ge=0.0, le=100.0)
    vibration_score: float = Field(..., ge=0.0, le=100.0)
    vibration_impact: float = Field(..., ge=0.0, le=100.0)
    motor_load_score: float = Field(..., ge=0.0, le=100.0)
    motor_load_impact: float = Field(..., ge=0.0, le=100.0)
    rpm_stability_score: float = Field(..., ge=0.0, le=100.0)
    rpm_stability_impact: float = Field(..., ge=0.0, le=100.0)


class ComponentHealth(BaseModel):
    name: str
    status: MachineStatus
    health_score: float = Field(..., ge=0.0, le=100.0)
    risk_score: float = Field(0.0, ge=0.0, le=100.0)
    failure_probability: float = Field(0.0, ge=0.0, le=100.0)
    maintenance_status: str = Field("OPTIMAL", description="Maintenance urgency classification")
    remaining_useful_life_days: float = Field(100.0, description="Estimated days until critical failure")
    remaining_useful_life_hours: float = Field(2400.0, description="Estimated operating hours until failure")
    is_failing: bool = Field(False, description="True if component is in active failure state (triggers 3D flashing strobe)")
    temperature: float
    vibration: float
    stress_level: float = Field(..., ge=0.0, le=100.0)
    glow_color: str = Field("#10b981", description="Hex color for 3D digital twin glow")


class AIPrediction(BaseModel):
    status: MachineStatus
    confidence: float = Field(..., ge=0.0, le=1.0)
    probabilities: Dict[str, float]
    failure_probability: float = Field(..., ge=0.0, le=100.0)
    risk_percentage: float = Field(..., ge=0.0, le=100.0)
    health_percentage: float = Field(..., ge=0.0, le=100.0)
    remaining_useful_life_hours: float
    diagnosis: str
    explanation: str


class TelemetryPacket(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    machine_id: str = Field("LOOM-01", description="Identifier of the monitored machine")
    sensors: RawSensorData
    overall_health_score: float = Field(..., ge=0.0, le=100.0)
    overall_status: MachineStatus
    health_breakdown: HealthBreakdown
    components: Dict[str, ComponentHealth]
    ai_prediction: AIPrediction
    scenario: SimulationScenario
    uptime_seconds: float
    picks_per_minute: float
    total_picks: int
    meters_woven: float
    oee_percentage: float = Field(..., ge=0.0, le=100.0)
    active_alerts_count: int
