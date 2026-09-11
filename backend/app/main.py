import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import db_manager
from app.services.telemetry_streamer import telemetry_streamer

from app.api.websocket import ws_router
from app.api.routes_telemetry import router as telemetry_router
from app.api.routes_simulation import router as simulation_router
from app.api.routes_alerts import router as alerts_router
from app.api.routes_maintenance import router as maintenance_router

# Configure rich logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger("digital_twin.main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup lifecycle
    logger.info("Initializing %s v%s...", settings.PROJECT_NAME, settings.VERSION)
    await db_manager.connect()
    await telemetry_streamer.start()
    yield
    # Shutdown lifecycle
    logger.info("Shutting down %s...", settings.PROJECT_NAME)
    await telemetry_streamer.stop()
    await db_manager.disconnect()


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="High-performance Industry 4.0 Digital Twin Platform for Textile Machinery",
    lifespan=lifespan,
)

# Enable CORS for Vite frontend and external SCADA clients
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount Routers
app.include_router(ws_router)
app.include_router(telemetry_router, prefix=settings.API_PREFIX)
app.include_router(simulation_router, prefix=settings.API_PREFIX)
app.include_router(alerts_router, prefix=settings.API_PREFIX)
app.include_router(maintenance_router, prefix=settings.API_PREFIX)


@app.get("/", tags=["Root"])
async def root():
    return {
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "online",
        "documentation": "/docs",
        "websocket": "/ws/telemetry",
    }


@app.get("/health", tags=["Health"])
async def health():
    return {
        "status": "healthy",
        "mongodb_connected": db_manager.is_connected,
        "streamer_active": telemetry_streamer.is_running,
        "active_scenario": telemetry_streamer.scenario.value,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True,
    )
