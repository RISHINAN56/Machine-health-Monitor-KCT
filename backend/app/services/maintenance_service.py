import uuid
from datetime import datetime
from typing import Dict, List, Optional
from app.database import db_manager
from app.models.maintenance import (
    MaintenancePriority,
    MaintenanceRecommendation,
    WorkOrder,
    WorkOrderStatus,
)


class MaintenanceService:
    def __init__(self):
        self._current_recommendation: Optional[MaintenanceRecommendation] = None
        self._work_orders: Dict[str, WorkOrder] = {}

    def update_recommendation(self, rec: Optional[MaintenanceRecommendation]):
        self._current_recommendation = rec

    def get_current_recommendation(self) -> Optional[MaintenanceRecommendation]:
        return self._current_recommendation

    async def create_work_order(
        self,
        component: str,
        task_description: str,
        priority: MaintenancePriority = MaintenancePriority.MEDIUM,
        recommendation_id: Optional[str] = None,
        assigned_technician: str = "Maintenance Shift Alpha",
        notes: str = "",
    ) -> WorkOrder:
        order = WorkOrder(
            id=f"WO-{uuid.uuid4().hex[:8].upper()}",
            recommendation_id=recommendation_id,
            component=component,
            task_description=task_description,
            priority=priority,
            status=WorkOrderStatus.PENDING,
            assigned_technician=assigned_technician,
            created_at=datetime.utcnow(),
            notes=notes,
        )
        self._work_orders[order.id] = order
        await db_manager.save_work_order(order.model_dump())
        return order

    async def update_work_order_status(self, order_id: str, new_status: WorkOrderStatus) -> Optional[WorkOrder]:
        if order_id in self._work_orders:
            order = self._work_orders[order_id]
            order.status = new_status
            if new_status == WorkOrderStatus.COMPLETED:
                order.completed_at = datetime.utcnow()
            await db_manager.save_work_order(order.model_dump())
            return order
        return None

    def get_all_work_orders(self) -> List[WorkOrder]:
        return list(self._work_orders.values())


maintenance_service = MaintenanceService()
