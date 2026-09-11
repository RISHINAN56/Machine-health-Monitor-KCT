from datetime import datetime
from enum import Enum
from typing import List, Optional
from pydantic import BaseModel, Field


class MaintenancePriority(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    EMERGENCY = "EMERGENCY"


class WorkOrderStatus(str, Enum):
    PENDING = "PENDING"
    DISPATCHED = "DISPATCHED"
    IN_PROGRESS = "IN_PROGRESS"
    COMPLETED = "COMPLETED"


class MaintenanceRecommendation(BaseModel):
    id: str
    component: str
    action: str  # e.g., "Replace Bearing", "Lubricate Drive Shaft", "Inspect Belt Tension"
    priority: MaintenancePriority
    confidence_score: float = Field(..., ge=0.0, le=1.0)
    root_cause_explanation: str
    recommended_window_hours: float
    created_at: datetime = Field(default_factory=datetime.utcnow)


class WorkOrder(BaseModel):
    id: str
    recommendation_id: Optional[str] = None
    component: str
    task_description: str
    priority: MaintenancePriority
    status: WorkOrderStatus = WorkOrderStatus.PENDING
    assigned_technician: Optional[str] = "Maintenance Crew Alpha"
    created_at: datetime = Field(default_factory=datetime.utcnow)
    scheduled_for: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    notes: Optional[str] = ""
