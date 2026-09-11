import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  AlertEvent,
  CameraPreset,
  SimulationScenario,
  TelemetryPacket,
  WorkOrder,
  WorkOrderStatus,
} from "../types";

interface TwinContextType {
  telemetry: TelemetryPacket | null;
  history: TelemetryPacket[];
  isConnected: boolean;
  selectedComponent: string | null;
  cameraPreset: CameraPreset;
  wireframeMode: boolean;
  activeScenario: SimulationScenario;
  alerts: AlertEvent[];
  workOrders: WorkOrder[];
  audioAlertsEnabled: boolean;
  setSelectedComponent: (comp: string | null) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setWireframeMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  setScenario: (scenario: SimulationScenario) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  createWorkOrder: (component: string, task: string, priority?: string) => Promise<void>;
  updateWorkOrderStatus: (orderId: string, status: WorkOrderStatus) => Promise<void>;
  toggleAudioAlerts: () => void;
}

const TwinContext = createContext<TwinContextType | null>(null);

export const TwinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const [wireframeMode, setWireframeMode] = useState(false);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>("normal");
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false;

    const connectWebSocket = () => {
      if (unmounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname || "localhost";
      const wsUrl = `${protocol}//${host}:8000/ws/telemetry`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (unmounted) return;
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        if (unmounted) return;
        try {
          const data = JSON.parse(event.data);
          if (data && data.overall_health_score !== undefined) {
            const packet = data as TelemetryPacket;
            setTelemetry(packet);
            setActiveScenario(packet.scenario);
            setHistory((prev) => [...prev.slice(-180), packet]);
          }
        } catch (e) {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setIsConnected(false);
        // Retry connection in 2 seconds
        reconnectTimeoutRef.current = window.setTimeout(connectWebSocket, 2000);
      };

      ws.onerror = () => {
        ws.close();
      };
    };

    connectWebSocket();

    return () => {
      unmounted = true;
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  // Poll alerts & work orders periodically
  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        const [alertsRes, ordersRes] = await Promise.all([
          fetch("/api/alerts"),
          fetch("/api/maintenance/work-orders"),
        ]);
        if (alertsRes.ok) {
          const alertData = await alertsRes.json();
          setAlerts(alertData);
        }
        if (ordersRes.ok) {
          const orderData = await ordersRes.json();
          setWorkOrders(orderData);
        }
      } catch (err) {
        // quiet fallback
      }
    };

    fetchAuxiliaryData();
    const interval = setInterval(fetchAuxiliaryData, 4000);
    return () => clearInterval(interval);
  }, []);

  const setScenario = async (scenario: SimulationScenario) => {
    setActiveScenario(scenario);
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ action: "set_scenario", scenario }));
    }
    try {
      await fetch("/api/simulation/scenario", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenario }),
      });
    } catch (err) {
      // handled via websocket
    }
  };

  const acknowledgeAlert = async (alertId: string) => {
    try {
      await fetch(`/api/alerts/${alertId}/acknowledge`, { method: "POST" });
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const createWorkOrder = async (component: string, task: string, priority = "MEDIUM") => {
    try {
      const res = await fetch("/api/maintenance/work-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          component,
          task_description: task,
          priority,
          recommendation_id: telemetry?.ai_prediction ? "AUTO" : undefined,
        }),
      });
      if (res.ok) {
        const newOrder = await res.json();
        setWorkOrders((prev) => [newOrder, ...prev]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const updateWorkOrderStatus = async (orderId: string, status: WorkOrderStatus) => {
    try {
      const res = await fetch(`/api/maintenance/work-orders/${orderId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (res.ok) {
        const updated = await res.json();
        setWorkOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
      }
    } catch (err) {
      console.error(err);
    }
  };

  const toggleAudioAlerts = () => {
    setAudioAlertsEnabled((prev) => !prev);
  };

  return (
    <TwinContext.Provider
      value={{
        telemetry,
        history,
        isConnected,
        selectedComponent,
        cameraPreset,
        wireframeMode,
        activeScenario,
        alerts,
        workOrders,
        audioAlertsEnabled,
        setSelectedComponent,
        setCameraPreset,
        setWireframeMode,
        setScenario,
        acknowledgeAlert,
        createWorkOrder,
        updateWorkOrderStatus,
        toggleAudioAlerts,
      }}
    >
      {children}
    </TwinContext.Provider>
  );
};

export const useTwin = () => {
  const ctx = useContext(TwinContext);
  if (!ctx) throw new Error("useTwin must be used within a TwinProvider");
  return ctx;
};
