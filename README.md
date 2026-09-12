# MHM | 3D Machine Health Monitoring & Predictive Maintenance

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r163-black.svg?logo=three.js)](https://threejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

A real-time monitoring platform for industrial textile machinery that combines an **interactive 3D model of the machine** with **AI-based maintenance prediction** to spot mechanical issues before breakdowns happen.

---

## 🏗️ System Architecture

```
                                 PHYSICAL TEXTILE LOOM
              [Temperature Sensor] [Vibration Sensor] [RPM Sensor] [Current Sensor]
                                          │
                                          ▼
                             FASTAPI DATA SERVER
                  (10 updates/sec via WebSockets & REST APIs)
                                   │             │
                   ┌───────────────┘             └──────────────┐
                   ▼                                            ▼
       AI HEALTH & PREDICTIONS                          MONGODB DATABASE
    • Overall Health Score (0-100)                • Time-series sensor history
    • Machine learning classification             • Active & past alerts
    • Plain-English problem explanations          • Maintenance work orders
    • Estimated time before part replacement      • In-memory backup fallback
                   │                                            │
                   └─────────────────────┬──────────────────────┘
                                         │ Live Data Stream
                                         ▼
                         REACT & THREE.JS 3D DASHBOARD
        • Interactive 3D machine model (Motor, Shaft, Bearings, Belt, Loom)
        • Color-coded status glow (Green / Yellow / Red) & vibration shake effects
        • Live sensor charts and historical metric trends
        • One-click test scenarios (Bearing Wear, Motor Overheating, Machine Jam)
```

---

## 🚀 Key Features

### 1. Interactive 3D Model of the Machine (Three.js / React Three Fiber)
- **Inspect Individual Machine Parts**: Click to zoom into and isolate any component:
  - **Main Motor**: Stator body, connection box, and rotating cooling fan.
  - **Drive Shaft**: Main stainless steel shaft rotating at the exact machine RPM.
  - **Bearings**: Bearing housings with real-time vibration stress indicators.
  - **Belt System**: Pulleys and timing belts with synchronized rotational movement.
  - **Loom Section**: Moving frame, reed, and mechanical weaving assembly.
  - **Power Unit**: Industrial control cabinet with active status indicators.
- **Realistic Vibration Effects**: The 3D model physically shakes when sensor vibration exceeds safe limits.
- **Color-Coded Status Glow**: Components change color based on health:
  - 🟢 **Healthy**: Calm green glow (`#10b981`)
  - 🟡 **Warning**: Amber yellow glow (`#f59e0b`)
  - 🔴 **Critical**: Flashing crimson red glow (`#ef4444`)
- **Camera Views**: Smooth transitions between isometric overview, motor close-up, bearings, loom section, belt drive, and top-down view.

### 2. Machine Health Score (0–100)
The overall score combines four physical operating factors:
- **Vibration Safety (35%)**: Evaluates mechanical vibration against standard industrial safety limits (ISO 10816).
- **Temperature Monitoring (25%)**: Tracks motor heat to detect cooling failures and overheating early.
- **Motor Load (25%)**: Measures electrical current draw and mechanical resistance.
- **Speed (RPM) Stability (15%)**: Detects belt slippage, motor stalls, and sudden speed drops.

### 3. AI-Based Maintenance Prediction
- **Detection of Unusual Machine Behavior**: A machine learning model (Random Forest) evaluates sensor data to classify machine state as Healthy, Warning, or Critical.
- **System That Identifies the Exact Faulty Component**: Instead of vague error codes, the system pinpoints the exact part under stress and explains the issue in plain English (e.g., *"Bearing wear detected: vibration level is 17% above the safe limit"*).
- **Estimated Time Before Component Needs Replacement**: Calculates remaining operating hours for stressed parts so teams can schedule maintenance during planned shift breaks.
- **Maintenance Tasks**: Create and track repair work orders with a single click.

### 4. Built-in Test Scenarios
- **Normal Operation**: Standard speed (~650 RPM), normal temperature (~31°C), low vibration (<150 mm/s).
- **Bearing Wear**: High-frequency vibration spikes (>850 mm/s) caused by bearing friction.
- **Motor Overheating**: High motor temperature (>64°C) caused by cooling blockages or heavy loads.
- **Machine Jam**: Mechanical blockage causing motor current to surge and speed to drop abruptly.
- **Emergency Stop**: Rapid deceleration to 0 RPM within 1.5 seconds.
- **Belt Slippage**: Fluctuating speed and uneven RPM (450–820 RPM).

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Three.js, React Three Fiber, Lucide Icons.
- **Backend**: FastAPI, Uvicorn, WebSockets, Pydantic v2, Motor (Async MongoDB).
- **Machine Learning**: Scikit-Learn (Random Forest & Decision Tree), NumPy, Pandas.
- **Database**: MongoDB 7.0 (with automatic in-memory fallback if MongoDB is not running).
- **Containers**: Docker & Docker Compose.

---

## 🛠️ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- MongoDB (optional; the backend automatically uses an in-memory database if MongoDB is not installed)

---

### Running Locally

#### Step 1: Start Backend
```bash
# In project root
source .venv/bin/activate
pip install -r backend/requirements.txt

# Start FastAPI server on port 8000
cd backend
python3 -m app.main
```
Backend will be live at:
- **API Documentation**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **Live Data Stream**: `ws://localhost:8000/ws/telemetry`

#### Step 2: Start Frontend
```bash
# In another terminal window
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser to launch the dashboard.

---

### Running with Docker Compose

```bash
docker-compose up --build
```
- Frontend: [http://localhost:5173](http://localhost:5173)
- Backend API: [http://localhost:8000/docs](http://localhost:8000/docs)
- MongoDB: `localhost:27017`

---

## 📡 API Endpoints Summary

| Method | Endpoint | Description |
|---|---|---|
| `WS` | `/ws/telemetry` | Live 10 updates/sec bi-directional WebSocket data stream |
| `GET` | `/api/telemetry/latest` | Latest raw sensor data and calculated health score |
| `GET` | `/api/telemetry/history` | Historical sensor readings for trend charts |
| `GET` | `/api/telemetry/summary` | Machine KPIs, efficiency (OEE), uptime, and AI status |
| `POST` | `/api/simulation/scenario` | Switch test scenario (normal, bearing_wear, etc.) |
| `GET` | `/api/alerts` | List active and historical warning notifications |
| `POST` | `/api/alerts/{id}/acknowledge` | Mark an active alert as acknowledged |
| `GET` | `/api/maintenance/work-orders` | Retrieve list of maintenance tasks |
| `POST` | `/api/maintenance/work-orders` | Create a new maintenance task |

---

## 📄 License
MIT License.
