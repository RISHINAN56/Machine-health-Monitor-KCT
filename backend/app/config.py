import os
from pydantic import BaseModel


class Settings(BaseModel):
    PROJECT_NAME: str = "Industry 4.0 Textile Digital Twin"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # Host & Port
    HOST: str = os.getenv("HOST", "0.0.0.0")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # MongoDB
    MONGODB_URI: str = os.getenv("MONGODB_URI", "mongodb://localhost:27017")
    MONGODB_DB_NAME: str = os.getenv("MONGODB_DB_NAME", "digital_twin_db")
    
    # Telemetry Streaming
    STREAM_INTERVAL_SECONDS: float = float(os.getenv("STREAM_INTERVAL_SECONDS", "0.1"))  # 10 Hz
    HISTORY_BUFFER_SIZE: int = 300  # In-memory window size for immediate graphs
    
    # Machine Specs (Rapier / Air-Jet Loom)
    RATED_RPM: float = 650.0
    RATED_LOAD: float = 400.0
    
    # Operational Thresholds
    SAFE_LIMITS: dict[str, float] = {
        "temperature": 45.0,  # °C
        "vibration": 450.0,   # mm/s (ISO 10816 Class II threshold)
        "motor_load": 650.0,  # A-load
        "rpm": 760.0,         # RPM
    }
    
    CRITICAL_LIMITS: dict[str, float] = {
        "temperature": 55.0,
        "vibration": 750.0,
        "motor_load": 850.0,
        "rpm": 900.0,
    }
    
    # Digital Twin Sub-assemblies
    COMPONENTS: list[str] = [
        "main_motor",
        "drive_shaft",
        "bearings",
        "belt_system",
        "loom_section",
        "power_unit",
    ]


settings = Settings()
