import logging
from collections import deque
from datetime import datetime
from typing import Any, Dict, List, Optional
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

logger = logging.getLogger("digital_twin.database")

class DatabaseManager:
    """
    Resilient Database Manager for Industry 4.0 Telemetry & Event Persistence.
    Connects to MongoDB with automatic fallback to high-speed in-memory ring buffers.
    """

    def __init__(self):
        self.client: Optional[AsyncIOMotorClient] = None
        self.db = None
        self.is_connected: bool = False
        
        # In-memory resilient fallbacks
        self._memory_telemetry: deque = deque(maxlen=settings.HISTORY_BUFFER_SIZE)
        self._memory_alerts: deque = deque(maxlen=200)
        self._memory_work_orders: dict[str, dict] = {}

    async def connect(self):
        try:
            self.client = AsyncIOMotorClient(
                settings.MONGODB_URI,
                serverSelectionTimeoutMS=2000,
            )
            # Verify connectivity
            await self.client.admin.command("ping")
            self.db = self.client[settings.MONGODB_DB_NAME]
            self.is_connected = True
            logger.info("Successfully connected to MongoDB: %s/%s", settings.MONGODB_URI, settings.MONGODB_DB_NAME)
        except Exception as err:
            self.is_connected = False
            logger.warning("MongoDB connection failed (%s). Operating in high-speed In-Memory Ring Buffer mode.", err)

    async def disconnect(self):
        if self.client:
            self.client.close()
            logger.info("MongoDB connection closed.")

    async def save_telemetry(self, packet: Dict[str, Any]) -> None:
        self._memory_telemetry.append(packet)
        if self.is_connected and self.db is not None:
            try:
                await self.db.telemetry_history.insert_one(packet.copy())
            except Exception as err:
                logger.error("Failed to persist telemetry to MongoDB: %s", err)

    async def get_recent_telemetry(self, limit: int = 100) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.telemetry_history.find({}, {"_id": 0}).sort("timestamp", -1).limit(limit)
                results = await cursor.to_list(length=limit)
                return list(reversed(results))
            except Exception as err:
                logger.warning("Failed querying MongoDB telemetry (%s), reading in-memory buffer", err)
        
        items = list(self._memory_telemetry)
        return items[-limit:]

    async def save_alert(self, alert_dict: Dict[str, Any]) -> None:
        self._memory_alerts.append(alert_dict)
        if self.is_connected and self.db is not None:
            try:
                await self.db.alerts.update_one(
                    {"id": alert_dict["id"]},
                    {"$set": alert_dict},
                    upsert=True,
                )
            except Exception as err:
                logger.error("Failed to save alert to MongoDB: %s", err)

    async def get_active_alerts(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.alerts.find({"resolved": False}, {"_id": 0}).sort("timestamp", -1)
                return await cursor.to_list(length=100)
            except Exception as err:
                logger.warning("Failed querying MongoDB alerts (%s), falling back to memory", err)

        return [a for a in self._memory_alerts if not a.get("resolved", False)]

    async def acknowledge_alert(self, alert_id: str) -> bool:
        for a in self._memory_alerts:
            if a["id"] == alert_id:
                a["acknowledged"] = True
                break

        if self.is_connected and self.db is not None:
            try:
                res = await self.db.alerts.update_one({"id": alert_id}, {"$set": {"acknowledged": True}})
                return res.modified_count > 0
            except Exception as err:
                logger.error("Failed acknowledging alert in MongoDB: %s", err)
        return True

    async def resolve_alert(self, alert_id: str) -> bool:
        for a in self._memory_alerts:
            if a["id"] == alert_id:
                a["resolved"] = True
                a["resolved_at"] = datetime.utcnow().isoformat()
                break

        if self.is_connected and self.db is not None:
            try:
                res = await self.db.alerts.update_one(
                    {"id": alert_id},
                    {"$set": {"resolved": True, "resolved_at": datetime.utcnow()}},
                )
                return res.modified_count > 0
            except Exception as err:
                logger.error("Failed resolving alert in MongoDB: %s", err)
        return True

    async def save_work_order(self, order_dict: Dict[str, Any]) -> None:
        self._memory_work_orders[order_dict["id"]] = order_dict
        if self.is_connected and self.db is not None:
            try:
                await self.db.work_orders.update_one(
                    {"id": order_dict["id"]},
                    {"$set": order_dict},
                    upsert=True,
                )
            except Exception as err:
                logger.error("Failed to persist work order in MongoDB: %s", err)

    async def get_work_orders(self) -> List[Dict[str, Any]]:
        if self.is_connected and self.db is not None:
            try:
                cursor = self.db.work_orders.find({}, {"_id": 0}).sort("created_at", -1)
                return await cursor.to_list(length=100)
            except Exception as err:
                logger.warning("Failed querying MongoDB work orders (%s), returning memory orders", err)

        return list(self._memory_work_orders.values())


db_manager = DatabaseManager()
