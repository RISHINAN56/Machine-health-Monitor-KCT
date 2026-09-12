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
import { generateMachineTelemetryPacket } from "../data/machines";
import { apiService } from "../services/apiService";
import { TelemetryWebSocketManager } from "../services/telemetryWs";
import { playAlertChime } from "../utils/alertAudio";
import { APP_CONFIG } from "../config/constants";

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
  isExploded: boolean;
  faultBeamEnabled: boolean;
  setIsExploded: (val: boolean | ((prev: boolean) => boolean)) => void;
  setFaultBeamEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
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
  const [activeMachineId, setActiveMachineId] = useState<string>(APP_CONFIG.DEFAULT_MACHINE_ID);
  const [activeScenario, setActiveScenario] = useState<SimulationScenario>("normal");
  const [telemetry, setTelemetry] = useState<TelemetryPacket | null>(() =>
    generateMachineTelemetryPacket(APP_CONFIG.DEFAULT_MACHINE_ID, "normal")
  );
  const [history, setHistory] = useState<TelemetryPacket[]>(() => [
    generateMachineTelemetryPacket(APP_CONFIG.DEFAULT_MACHINE_ID, "normal"),
  ]);
  const [isConnected, setIsConnected] = useState(false);
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [cameraPreset, setCameraPreset] = useState<CameraPreset>("isometric");
  const [wireframeMode, setWireframeMode] = useState(false);
  const [viewportMode, setViewportMode] = useState<ViewportMode>("standard");
  const [activeTab, setActiveTab] = useState<NavigationTab>("console");
  const [isExploded, setIsExploded] = useState(false);
  const [faultBeamEnabled, setFaultBeamEnabled] = useState(true);
  const [alerts, setAlerts] = useState<AlertEvent[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [energy, setEnergy] = useState<EnergyMetrics | null>(null);
  const [fleet, setFleet] = useState<FleetOverview | null>(null);
  const [audioAlertsEnabled, setAudioAlertsEnabled] = useState(false);

  // AI Assistant State
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

  // Historical Playback Scrubber State
  const [isPlaybackMode, setIsPlaybackMode] = useState(false);
  const [playbackHistory, setPlaybackHistory] = useState<TelemetryPacket[]>([]);
  const [playbackIndex, setPlaybackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);

  const wsManagerRef = useRef<TelemetryWebSocketManager | null>(null);
  const previousAlertCount = useRef(0);

  // 1. Simulated Fallback Telemetry (triggers if WS disconnected)
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        const nextPacket = generateMachineTelemetryPacket(activeMachineId, activeScenario);
        if (prev) {
          nextPacket.meters_woven = Number((prev.meters_woven + 0.05).toFixed(2));
          nextPacket.total_picks = prev.total_picks + 18;
          nextPacket.uptime_seconds = prev.uptime_seconds + 2;
        }
        return nextPacket;
      });
      setHistory((prev) => {
        const nextPacket = generateMachineTelemetryPacket(activeMachineId, activeScenario);
        return [...prev.slice(-APP_CONFIG.MAX_HISTORY_LENGTH), nextPacket];
      });
    }, APP_CONFIG.TELEMETRY_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [activeMachineId, activeScenario]);

  // 2. Resilient WebSocket Ingestion
  useEffect(() => {
    const manager = new TelemetryWebSocketManager(
      (packet) => {
        setTelemetry(packet);
        setActiveScenario(packet.scenario);
        setHistory((prev) => [...prev.slice(-APP_CONFIG.MAX_HISTORY_LENGTH), packet]);
      },
      (connected) => {
        setIsConnected(connected);
      }
    );

    wsManagerRef.current = manager;
    return () => manager.destroy();
  }, []);

  // 3. Auxiliary Data Polling (Alerts, Energy, Fleet, Work Orders)
  useEffect(() => {
    const pollAuxData = async () => {
      const data = await apiService.fetchAuxiliaryData();
      if (data.alerts) {
        setAlerts(data.alerts);
        if (audioAlertsEnabled && data.alerts.length > previousAlertCount.current) {
          const latest = data.alerts[0];
          if (latest && !latest.acknowledged) {
            playAlertChime(latest.severity === "CRITICAL");
          }
        }
        previousAlertCount.current = data.alerts.length;
      }
      if (data.workOrders) setWorkOrders(data.workOrders);
      if (data.energy) setEnergy(data.energy);
      if (data.fleet) setFleet(data.fleet);
    };

    pollAuxData();
    const interval = setInterval(pollAuxData, APP_CONFIG.AUXILIARY_POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [audioAlertsEnabled]);

  // 4. Historical Playback Scrubber Timer
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

  // Actions
  const handleSetActiveMachineId = (id: string) => {
    setActiveMachineId(id);
    const packet = generateMachineTelemetryPacket(id, activeScenario);
    setTelemetry(packet);
    setHistory((prev) => [...prev.slice(-APP_CONFIG.MAX_HISTORY_LENGTH), packet]);
  };

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

  const setScenario = async (scenario: SimulationScenario) => {
    setActiveScenario(scenario);
    wsManagerRef.current?.send({ action: "set_scenario", scenario });
    await apiService.setScenario(scenario);
  };

  const acknowledgeAlert = async (alertId: string) => {
    const success = await apiService.acknowledgeAlert(alertId);
    if (success) {
      setAlerts((prev) =>
        prev.map((a) => (a.id === alertId ? { ...a, acknowledged: true } : a))
      );
    }
  };

  const createWorkOrder = async (component: string, task: string, priority = "MEDIUM") => {
    const newOrder = await apiService.createWorkOrder(
      component,
      task,
      priority,
      telemetry?.ai_prediction ? "AUTO" : undefined
    );
    if (newOrder) {
      setWorkOrders((prev) => [newOrder, ...prev]);
    }
  };

  const updateWorkOrderStatus = async (orderId: string, status: WorkOrderStatus) => {
    const updated = await apiService.updateWorkOrderStatus(orderId, status);
    if (updated) {
      setWorkOrders((prev) => prev.map((o) => (o.id === orderId ? updated : o)));
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
        body: JSON.stringify({ question, machine_id: activeMachineId }),
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
        isExploded,
        faultBeamEnabled,
        setIsExploded,
        setFaultBeamEnabled,
        setSelectedComponent,
        setCameraPreset,
        setWireframeMode: handleSetWireframe,
        setViewportMode: handleSetViewportMode,
        setActiveTab,
        setActiveMachineId: handleSetActiveMachineId,
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
