from datetime import datetime
from enum import Enum
from typing import Optional
from pydantic import BaseModel, Field


class AlertSeverity(str, Enum):
    INFO = "INFO"
    WARNING = "WARNING"
    CRITICAL = "CRITICAL"


class AlertEvent(BaseModel):
    id: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    severity: AlertSeverity
    component: str
    title: str
    message: str
    metric_name: str
    metric_value: float
    threshold_value: float
    acknowledged: bool = False
    resolved: bool = False
    resolved_at: Optional[datetime] = None
