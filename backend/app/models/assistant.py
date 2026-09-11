from datetime import datetime
from typing import Dict, List, Optional
from pydantic import BaseModel, Field


class AssistantQuery(BaseModel):
    question: str = Field(..., description="Operator query or prompt to the AI Maintenance Assistant")
    machine_id: Optional[str] = Field("LOOM-01", description="Context machine ID")


class AssistantResponse(BaseModel):
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    question: str
    machine_id: str
    answer: str = Field(..., description="Natural language diagnostic explanation grounded in live telemetry")
    root_cause: str = Field(..., description="Identified physical root cause of anomalous sensor behavior")
    risk_assessment: str = Field(..., description="Component and equipment failure risk level")
    recommended_action: str = Field(..., description="Step-by-step standard operating procedure for maintenance")
    confidence: float = Field(0.96, ge=0.0, le=1.0)
