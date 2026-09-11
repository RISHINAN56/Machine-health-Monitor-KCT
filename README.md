# AegisTwin 4.0 | Industrial Textile Digital Twin Platform

[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688.svg?logo=fastapi)](https://fastapi.tiangolo.com)
[![React](https://img.shields.io/badge/React-18.3.1-61DAFB.svg?logo=react)](https://reactjs.org/)
[![Three.js](https://img.shields.io/badge/Three.js-r163-black.svg?logo=three.js)](https://threejs.org/)
[![MongoDB](https://img.shields.io/badge/MongoDB-7.0-47A248.svg?logo=mongodb)](https://www.mongodb.com/)
[![License](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

An enterprise-grade **Industry 4.0 3D Digital Twin & Predictive Maintenance Platform** for advanced textile machinery (Rapier and Air-Jet Looms). Inspired by **Siemens MindSphere**, **Bosch IoT Suite**, **Tesla Vehicle Dashboard**, and **NVIDIA Omniverse**.

---

## 🏗️ System Architecture

```
                                 PHYSICAL TEXTILE LOOM
              [PT100 Thermal Sensor] [Triaxial Accelerometer] [Hall Effect RPM] [CT Load]
                                          │
                                          ▼
                      FASTAPI TELEMETRY & DATA ACQUISITION ENGINE
                       (10 Hz Bi-directional WebSocket & REST APIs)
                                    │             │
                    ┌───────────────┘             └──────────────┐
                    ▼                                            ▼
          AI HEALTH & EXPLAINABILITY                      MONGODB DATABASE
     • ISO 10816 Health Engine (0-100)              • Time-Series Telemetry History
     • Calibrated ML Classifier                     • Active & Historical Alerts
     • Natural Language Root-Cause "Why"            • Predictive Work Orders
     • Remaining Useful Life (RUL) Hours            • Resilient In-Memory Fallback
                    │                                            │
                    └─────────────────────┬──────────────────────┘
                                          │ Real-Time Streaming
                                          ▼
                           REACT 18 + THREE.JS MISSION CONTROL
         • Procedural 3D Kinematic Model (Motor, Shaft, Bearings, Belt, Loom, Frame)
         • Live Shader Glow (Green / Yellow / Red) & Dynamic Structural Vibration Shake
         • Real-Time CRT Oscilloscope & Multi-Metric Historical Trend Graphs
         • One-Click Fault Scenario Injector (Bearing Wear, Thermal Overload, Loom Jam)
```

---

## 🚀 Key Capabilities

### 1. Spatial 3D Digital Twin (Three.js / React Three Fiber / Drei)
- **Sub-Assembly Isolation & Inspection**: Click or isolate any mechanical sub-component:
  - **Main Motor**: Finned stator, terminal box, rotating cooling fan.
  - **Drive Shaft**: Longitudinal stainless steel shaft rotating synchronously to RPM.
  - **Bearings**: Pillow block bearing housings with real-time ISO 10816 vibration stress glow.
  - **Belt System**: Driven timing belts with rotational animation.
  - **Loom Section**: Reciprocating heald frames, oscillating sley beam, and steel reed.
  - **Power Unit**: Industrial inverter cabinet with active pilot LEDs.
- **Dynamic Physics & Vibration Shake**: Real-time high-frequency structural vibration displacement shaking when vibration exceeds ISO thresholds.
- **Live State Glow**: Real-time material emissive transitions:
  - 🟢 **Healthy**: Emerald Green glow (`#10b981`)
  - 🟡 **Warning**: Amber Yellow glow (`#f59e0b`)
  - 🔴 **Critical**: Crimson Red strobing glow (`#ef4444`)
- **Camera Presets**: Smooth animated transitions between Isometric, Motor Closeup, Bearing Housing, Loom Section, Belt Drive, and Top-Down viewports.

### 2. Multi-Factor ISO 10816 Machine Health Score (0–100)
- **Vibration Impact (35%)**: Conforms to ISO 10816-3 Class II medium machine vibration severity zones (Zone A/B/C/D).
- **Thermal Wear Impact (25%)**: Exponential Arrhenius degradation model based on stator winding heat.
- **Motor Load Torque Reserve (25%)**: Mechanical resistance and shedding friction analysis.
- **RPM Speed Stability (15%)**: Synchronous deviation and belt slippage detection.

### 3. Explainable AI & Prescriptive Maintenance
- **Predictive ML Classification**: Probabilistic random forest ensemble providing class probabilities (`Healthy`, `Warning`, `Critical`) and failure probability %.
- **Root-Cause Explainability ("WHY")**: Natural language diagnostic explanation identifying the exact physical failure mode (e.g. *"Bearing inner raceway deterioration detected. Vibration level is 880.4 mm/s (+17% above ISO Zone D limit)..."*).
- **Automated Work Orders**: One-click dispatching to technicians with execution window countdowns.

### 4. Interactive Simulation Scenarios
- **Optimal Production**: Nominal speed (~650 RPM), cool motor (~31°C), low vibration (<150 mm/s).
- **Bearing Raceway Fatigue**: High-frequency vibration spikes (>850 mm/s), bearing casing friction.
- **Thermal Overload**: Stator overheating (>64°C), cooling blockage.
- **Weft Insertion Jam**: Mechanical shed binding, motor load surging to 1050 A, RPM dropping sharply.
- **Emergency Stop (E-Stop)**: Deceleration to 0 RPM within 1.5 seconds.
- **Belt Slip Fluctuation**: Erratic speed oscillations (450–820 RPM).

---

## 💻 Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion, Three.js, React Three Fiber (`@react-three/fiber`), Drei (`@react-three/drei`), Lucide React.
- **Backend**: FastAPI, Uvicorn, WebSockets, Pydantic v2, Motor (Async MongoDB), PyMongo.
- **Machine Learning**: Scikit-Learn (Random Forest & Decision Tree), NumPy, Pandas, Joblib.
- **Database**: MongoDB 7.0 (with transparent zero-downtime in-memory ring-buffer fallback).
- **Orchestration**: Docker & Docker Compose.

---

## 🛠️ Quick Start Guide

### Prerequisites
- Node.js (v18+)
- Python (3.11+)
- MongoDB (optional; backend includes resilient in-memory fallback)

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
- **REST API & Swagger Docs**: [http://localhost:8000/docs](http://localhost:8000/docs)
- **WebSocket Feed**: `ws://localhost:8000/ws/telemetry`

#### Step 2: Start Frontend
```bash
# In another terminal window
cd frontend
npm install
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser to launch the platform!

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
| `WS` | `/ws/telemetry` | High-speed 10 Hz bi-directional WebSocket telemetry stream |
| `GET` | `/api/telemetry/latest` | Latest raw & computed machine health packet |
| `GET` | `/api/telemetry/history` | Sliding-window historical telemetry for charts |
| `GET` | `/api/telemetry/summary` | Machine KPIs, OEE, uptime, and AI status |
| `POST` | `/api/simulation/scenario` | Switch live simulation scenario (normal, bearing_wear, etc.) |
| `GET` | `/api/alerts` | List active and historical alarm notifications |
| `POST` | `/api/alerts/{id}/acknowledge` | Acknowledge active alarm event |
| `GET` | `/api/maintenance/work-orders` | Retrieve list of maintenance work orders |
| `POST` | `/api/maintenance/work-orders` | Dispatch a new maintenance work order |

---

## 📄 License
MIT License. Developed for Industry 4.0 Advanced Manufacturing.
