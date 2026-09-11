from typing import Any, Dict, List, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.models.maintenance import (
    MaintenancePriority,
    MaintenanceRecommendation,
    WorkOrder,
    WorkOrderStatus,
)
from app.services.maintenance_service import maintenance_service

router = APIRouter(prefix="/maintenance", tags=["Predictive Maintenance"])


class CreateWorkOrderRequest(BaseModel):
    component: str
    task_description: str
    priority: MaintenancePriority = MaintenancePriority.MEDIUM
    recommendation_id: Optional[str] = None
    assigned_technician: str = "Maintenance Alpha"
    notes: Optional[str] = ""


class UpdateWorkOrderStatusRequest(BaseModel):
    status: WorkOrderStatus


@router.get("/recommendation", response_model=Optional[MaintenanceRecommendation])
async def get_current_recommendation():
    return maintenance_service.get_current_recommendation()


@router.get("/work-orders", response_model=List[WorkOrder])
async def list_work_orders():
    return maintenance_service.get_all_work_orders()


@router.post("/work-orders", response_model=WorkOrder)
async def create_work_order(req: CreateWorkOrderRequest):
    return await maintenance_service.create_work_order(
        component=req.component,
        task_description=req.task_description,
        priority=req.priority,
        recommendation_id=req.recommendation_id,
        assigned_technician=req.assigned_technician,
        notes=req.notes or "",
    )


@router.patch("/work-orders/{order_id}/status", response_model=WorkOrder)
async def update_work_order_status(order_id: str, req: UpdateWorkOrderStatusRequest):
    updated = await maintenance_service.update_work_order_status(order_id, req.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Work order not found.")
    return updated
