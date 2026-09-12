import React, { useEffect, useState } from "react";
import { useTwin } from "../../context/TwinContext";
import { NavigationTab } from "../../types";
import {
  Activity,
  Cpu,
  Volume2,
  VolumeX,
  LayoutDashboard,
  Home,
  Factory,
  Zap,
  Award,
  Bot,
  PlayCircle,
} from "lucide-react";

interface HeaderProps {
  currentView: "landing" | "dashboard";
  onViewChange: (view: "landing" | "dashboard") => void;
  onReplayIntro?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange, onReplayIntro }) => {
  const {
    isConnected,
    displayTelemetry,
    audioAlertsEnabled,
    toggleAudioAlerts,
    activeTab,
    setActiveTab,
    activeMachineId,
    isAssistantOpen,
    setIsAssistantOpen,
  } = useTwin();

  const [timeStr, setTimeStr] = useState("");

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(now.toLocaleTimeString("en-US", { hour12: false }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const telemetry = displayTelemetry;
  const overallStatus = telemetry?.overall_status || "Healthy";
  const statusGlow =
    overallStatus === "Healthy"
      ? "bg-cyber-emerald shadow-glow-emerald"
      : overallStatus === "Warning"
        ? "bg-cyber-amber shadow-glow-amber"
        : "bg-cyber-crimson shadow-glow-crimson animate-pulse";

  const handleTabClick = (tab: NavigationTab) => {
    setActiveTab(tab);
    if (currentView !== "dashboard") {
      onViewChange("dashboard");
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-industrial-700/60 backdrop-blur-md px-4 sm:px-6 py-2.5">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div
            onClick={() => onViewChange("landing")}
            className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center shadow-glow-cyan cursor-pointer"
          >
            <Cpu className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1
                onClick={() => onViewChange("landing")}
                className="font-sans text-base sm:text-lg font-extrabold tracking-wider text-slate-100 flex items-center gap-2 cursor-pointer"
              >
                MHM
                <span className="text-[10px] font-sans uppercase tracking-wider font-semibold px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  Machine Health Monitoring
                </span>
              </h1>
            </div>
            <p className="hidden sm:block text-[11px] font-sans text-slate-400">
              3D Visualization of Machine Health Monitoring &bull; Unit: <span className="text-cyan-300 font-bold">{activeMachineId}</span>
            </p>
          </div>
        </div>

        {/* Center Navigation Tabs */}
        <div className="hidden md:flex items-center gap-1 bg-industrial-950/85 p-1 rounded-xl border border-industrial-800">
          <button
            onClick={() => onViewChange("landing")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${currentView === "landing"
              ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            onClick={() => handleTabClick("console")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${currentView === "dashboard" && activeTab === "console"
              ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>3D Machine Visualization</span>
          </button>

          <button
            onClick={() => handleTabClick("fleet")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${currentView === "dashboard" && activeTab === "fleet"
              ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <Factory className="w-3.5 h-3.5" />
            <span>Performance Monitoring</span>
          </button>

          <button
            onClick={() => handleTabClick("energy")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${currentView === "dashboard" && activeTab === "energy"
              ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Energy Analytics</span>
          </button>

          <button
            onClick={() => handleTabClick("executive")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition flex items-center gap-1.5 ${currentView === "dashboard" && activeTab === "executive"
              ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan"
              : "text-slate-400 hover:text-white"
              }`}
          >
            <Award className="w-3.5 h-3.5" />
            <span>Machine Overview</span>
          </button>
        </div>

        {/* Right Actions, AI Copilot & Clock */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Replay Cinematic Intro */}
          {onReplayIntro && (
            <button
              onClick={onReplayIntro}
              className="px-2.5 py-1.5 rounded-xl border border-cyan-500/40 bg-industrial-900/90 text-cyan-300 hover:text-white hover:border-cyan-300 text-xs font-mono font-medium flex items-center gap-1.5 transition shadow-glow-cyan"
              title="Play Cinematic Startup Sequence"
            >
              <PlayCircle className="w-4 h-4" />
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}

          {/* AI Assistant Button */}
          <button
            onClick={() => setIsAssistantOpen(!isAssistantOpen)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-medium uppercase tracking-wider flex items-center gap-2 transition ${isAssistantOpen
              ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan border-cyan-400"
              : "bg-industrial-900/90 text-cyan-300 border-cyan-500/40 hover:bg-cyan-500/20"
              }`}
            title="Open MHM Assistant"
          >
            <Bot className="w-4 h-4" />
            <span className="hidden sm:inline">MHM Assistant</span>
          </button>

          {/* Audio Alerts Toggle */}
          <button
            onClick={toggleAudioAlerts}
            className={`p-2 rounded-xl border transition ${audioAlertsEnabled
              ? "bg-cyan-500/20 text-cyan-300 border-cyan-400"
              : "bg-industrial-900/60 text-slate-500 border-industrial-800 hover:text-slate-300"
              }`}
            title="Toggle Audio Alarms"
          >
            {audioAlertsEnabled ? (
              <Volume2 className="w-4 h-4" />
            ) : (
              <VolumeX className="w-4 h-4" />
            )}
          </button>

          {/* Clock & Connection */}
          <div className="hidden lg:flex flex-col items-end pl-2">
            <span className="font-hud text-xs font-bold text-cyan-300 tracking-wider">
              {timeStr}
            </span>
            <span
              className={`text-[10px] font-mono flex items-center gap-1 ${isConnected ? "text-emerald-400" : "text-red-400"
                }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? "bg-emerald-400 animate-ping" : "bg-red-500"
                  }`}
              />
              {isConnected ? "WEBSOCKET 10Hz" : "OFFLINE"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

