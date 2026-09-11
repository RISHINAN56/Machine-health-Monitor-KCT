import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import {
  AlertEvent,
  AssistantMessage,
  CameraPreset,
  EnergyMetrics,
  FleetOverview,
  NavigationTab,
  SimulationScenario,
  TelemetryPacket,
  ViewportMode,
  WorkOrder,
  WorkOrderStatus,
} from "../types";

interface TwinContextType {
  telemetry: TelemetryPacket | null;
  displayTelemetry: TelemetryPacket | null;
  history: TelemetryPacket[];
  isConnected: boolean;
  selectedComponent: string | null;
  cameraPreset: CameraPreset;
  wireframeMode: boolean;
  viewportMode: ViewportMode;
  activeTab: NavigationTab;
  activeMachineId: string;
  activeScenario: SimulationScenario;
  alerts: AlertEvent[];
  workOrders: WorkOrder[];
  energy: EnergyMetrics | null;
  fleet: FleetOverview | null;
  audioAlertsEnabled: boolean;
  isAssistantOpen: boolean;
  assistantMessages: AssistantMessage[];
  isPlaybackMode: boolean;
  playbackIndex: number;
  playbackHistory: TelemetryPacket[];
  isPlaying: boolean;
  playbackSpeed: number;
  setSelectedComponent: (comp: string | null) => void;
  setCameraPreset: (preset: CameraPreset) => void;
  setWireframeMode: (val: boolean | ((prev: boolean) => boolean)) => void;
  setViewportMode: (mode: ViewportMode) => void;
  setActiveTab: (tab: NavigationTab) => void;
  setActiveMachineId: (id: string) => void;
  setScenario: (scenario: SimulationScenario) => Promise<void>;
  acknowledgeAlert: (alertId: string) => Promise<void>;
  createWorkOrder: (component: string, task: string, priority?: string) => Promise<void>;
  updateWorkOrderStatus: (orderId: string, status: WorkOrderStatus) => Promise<void>;
  toggleAudioAlerts: () => void;
  setIsAssistantOpen: (open: boolean) => void;
  askAssistant: (question: string) => Promise<void>;
  startPlayback: (packets?: TelemetryPacket[]) => void;
  stopPlayback: () => void;
  seekPlayback: (index: number) => void;
  setPlaybackSpeed: (speed: number) => void;
  togglePlayPause: () => void;
}

const TwinContext = createContext<TwinContextType | null>(null);

export const TwinProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(null);
  const [history, setHistory] = useState<TelemetryPacket[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const [wireframeMode, setWireframeMode] = useState(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>("standard");
  const [activeTab, setActiveTab] = useState<NavigationTab>("console");
  const [activeMachineId, setActiveMachineId] = useState<string>("LOOM-01");
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>("normal");
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [energy, setEnergy] = useState<EnergyMetrics | null>(null);
  const [fleet, setFleet] = useState<FleetOverview | null>(null);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(false);

  // AI Assistant state
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [assistantMessages, setAssistantMessages] = useState<AssistantMessage[]>([
    {
      id: "welcome-1",
      sender: "ai",
      text: "Industrial AI Copilot online. Telemetry grounded for Picanol OmniPlus Loom. Ask about vibration signatures, RUL, thermal anomalies, or SOP procedures.",
      timestamp: new Date().toLocaleTimeString(),
      confidence: 0.99,
    },
  ]);

  // Historical Playback state
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackHistory, setPlaybackHistory] = useState<TelemetryPacket[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const useDirectBackendWs = useRef(false);
  const previousAlertCount = useRef(0);

  // Sync wireframeMode with viewportMode
  const handleSetViewportMode = (mode: ViewportMode) => {
    setViewportMode(mode);
    setWireframeMode(mode === "wireframe");
  };

  const handleSetWireframe = (val: boolean | ((prev: boolean) => boolean)) => {
    setWireframeMode((prev) => {
      const next = typeof val === "function" ? val(prev) : val;
      if (next) setViewportMode("wireframe");
      else if (viewportMode === "wireframe") setViewportMode("standard");
      return next;
    });
  };

  // Web Audio chime generator for industrial plant alerts
  const playAlertChime = (isCrit: boolean) => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (isCrit) {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(880, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.35);
        gain.gain.setValueAtTime(0.12, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
        osc.start();
        osc.stop(ctx.currentTime + 0.35);
      } else {
        osc.type = "sine";
        osc.frequency.setValueAtTime(587.33, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.25);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      }
    } catch {
      // Audio context blocked by browser until user gesture
    }
  };

  // Connect WebSocket
  useEffect(() => {
    let unmounted = false;

    const connectWebSocket = () => {
      if (unmounted) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.hostname || "localhost";
      const wsUrl = useDirectBackendWs.current
        ? `${protocol}//${host}:8000/ws/telemetry`
        : `${protocol}//${window.location.host}/ws/telemetry`;

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
            setHistory((prev) => [...prev.slice(-240), packet]);
          }
        } catch {
          // ignore parse errors
        }
      };

      ws.onclose = () => {
        if (unmounted) return;
        setIsConnected(false);
        useDirectBackendWs.current = !useDirectBackendWs.current;
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

  // Poll alerts, work orders, energy & fleet periodically
  useEffect(() => {
    const fetchAuxiliaryData = async () => {
      try {
        const [alertsRes, ordersRes, energyRes, fleetRes] = await Promise.all([
          fetch("/api/alerts"),
          fetch("/api/maintenance/work-orders"),
          fetch("/api/energy"),
          fetch("/api/fleet"),
        ]);

        if (alertsRes.ok) {
          const alertData: AlertEvent[] = await alertsRes.json();
          setAlerts(alertData);

          if (audioAlertsEnabled && alertData.length > previousAlertCount.current) {
            const latest = alertData[0];
            if (latest && !latest.acknowledged) {
              playAlertChime(latest.severity === "CRITICAL");
            }
          }
          previousAlertCount.current = alertData.length;
        }
        if (ordersRes.ok) {
          const orderData = await ordersRes.json();
          setWorkOrders(orderData);
        }
        if (energyRes.ok) {
          const energyData: EnergyMetrics = await energyRes.json();
          setEnergy(energyData);
        }
        if (fleetRes.ok) {
          const fleetData: FleetOverview = await fleetRes.json();
          setFleet(fleetData);
        }
      } catch {
        // quiet fallback
      }
    };

    fetchAuxiliaryData();
    const interval = setInterval(fetchAuxiliaryData, 3000);
    return () => clearInterval(interval);
  }, [audioAlertsEnabled]);

  // Playback timer
  useEffect(() => {
    if (!isPlaybackMode || !isPlaying || playbackHistory.length === 0) return;

    const intervalMs = Math.max(50, Math.floor(250 / playbackSpeed));
    const timer = setInterval(() => {
      setPlaybackIndex((prev) => {
        if (prev >= playbackHistory.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaybackMode, isPlaying, playbackHistory.length, playbackSpeed]);

  const startPlayback = (packets?: TelemetryPacket[]) => {
    const pool = packets && packets.length > 0 ? packets : history;
    if (pool.length === 0) return;
    setPlaybackHistory(pool);
    setPlaybackIndex(0);
    setIsPlaybackMode(true);
    setIsPlaying(true);
  };

  const stopPlayback = () => {
    setIsPlaybackMode(false);
    setIsPlaying(false);
  };

  const seekPlayback = (index: number) => {
    if (index >= 0 && index < playbackHistory.length) {
      setPlaybackIndex(index);
    }
  };

  const togglePlayPause = () => {
    setIsPlaying((prev) => !prev);
  };

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
    } catch {
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

  const askAssistant = async (question: string) => {
    const userMsg: AssistantMessage = {
      id: `usr-${Date.now()}`,
      sender: "user",
      text: question,
      timestamp: new Date().toLocaleTimeString(),
    };
    setAssistantMessages((prev) => [...prev, userMsg]);

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question,
          machine_id: activeMachineId,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const aiMsg: AssistantMessage = {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: data.answer,
          root_cause: data.root_cause,
          risk_assessment: data.risk_assessment,
          recommended_action: data.recommended_action,
          confidence: data.confidence,
          timestamp: new Date().toLocaleTimeString(),
        };
        setAssistantMessages((prev) => [...prev, aiMsg]);
      } else {
        setAssistantMessages((prev) => [
          ...prev,
          {
            id: `ai-${Date.now()}`,
            sender: "ai",
            text: "Diagnostics service momentarily unreachable. All baseline safeguards active.",
            timestamp: new Date().toLocaleTimeString(),
          },
        ]);
      }
    } catch {
      setAssistantMessages((prev) => [
        ...prev,
        {
          id: `ai-${Date.now()}`,
          sender: "ai",
          text: "Connection error contacting AI Diagnostics engine. Please check backend port 8000.",
          timestamp: new Date().toLocaleTimeString(),
        },
      ]);
    }
  };

  // The telemetry displayed to components & 3D (either live or historical frame)
  const displayTelemetry =
    isPlaybackMode && playbackHistory[playbackIndex]
      ? playbackHistory[playbackIndex]
      : telemetry;

  return (
    <TwinContext.Provider
      value={{
        telemetry,
        displayTelemetry,
        history,
        isConnected,
        selectedComponent,
        cameraPreset,
        wireframeMode,
        viewportMode,
        activeTab,
        activeMachineId,
        activeScenario,
        alerts,
        workOrders,
        energy,
        fleet,
        audioAlertsEnabled,
        isAssistantOpen,
        assistantMessages,
        isPlaybackMode,
        playbackIndex,
        playbackHistory,
        isPlaying,
        playbackSpeed,
        setSelectedComponent,
        setCameraPreset,
        setWireframeMode: handleSetWireframe,
        setViewportMode: handleSetViewportMode,
        setActiveTab,
        setActiveMachineId,
        setScenario,
        acknowledgeAlert,
        createWorkOrder,
        updateWorkOrderStatus,
        toggleAudioAlerts,
        setIsAssistantOpen,
        askAssistant,
        startPlayback,
        stopPlayback,
        seekPlayback,
        setPlaybackSpeed,
        togglePlayPause,
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

