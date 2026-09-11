#!/bin/bash
# AegisTwin 4.0 Platform Launcher

echo "=========================================================="
echo " Starting AegisTwin 4.0 Industrial Digital Twin Platform "
echo "=========================================================="

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

# Activate Python virtual environment
if [ -d ".venv" ]; then
  source .venv/bin/activate
fi

# 1. Start FastAPI Backend
echo "[1/2] Starting FastAPI Backend on http://localhost:8000..."
cd "$ROOT_DIR/backend"
python3 -m uvicorn app.main:app --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!

# 2. Start React + Vite Frontend
echo "[2/2] Starting React + Three.js Frontend on http://localhost:5173..."
cd "$ROOT_DIR/frontend"
npm run dev -- --host 0.0.0.0 --port 5173 &
FRONTEND_PID=$!

echo ""
echo "=========================================================="
echo "  AEGISTWIN 4.0 PLATFORM IS RUNNING SUCCESSFULLY"
echo "=========================================================="
echo "  Frontend Console: http://localhost:5173"
echo "  Backend REST API: http://localhost:8000/docs"
echo "  WebSocket Feed:   ws://localhost:8000/ws/telemetry"
echo "=========================================================="
echo "  Press CTRL+C to stop both servers."
echo ""

# Handle clean shutdown on exit
trap "echo 'Stopping AegisTwin servers...'; kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit" SIGINT SIGTERM
wait
