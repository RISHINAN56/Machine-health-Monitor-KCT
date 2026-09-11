import React, { useEffect, useState } from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Activity,
  Cpu,
  Volume2,
  VolumeX,
  Layers,
  LayoutDashboard,
  Home,
} from "lucide-react";

interface HeaderProps {
  currentView: "landing" | "dashboard";
  onViewChange: (view: "landing" | "dashboard") => void;
}

export const Header: React.FC<HeaderProps> = ({ currentView, onViewChange }) => {
  const { isConnected, telemetry, audioAlertsEnabled, toggleAudioAlerts } = useTwin();
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

  const overallStatus = telemetry?.overall_status || "Healthy";
  const statusGlow =
    overallStatus === "Healthy"
      ? "bg-cyber-emerald shadow-glow-emerald"
      : overallStatus === "Warning"
      ? "bg-cyber-amber shadow-glow-amber"
      : "bg-cyber-crimson shadow-glow-crimson animate-pulse";

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-industrial-700/60 backdrop-blur-md px-4 sm:px-6 py-3">
      <div className="max-w-[1720px] mx-auto flex items-center justify-between gap-4">
        {/* Brand & Identity */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-400/50 flex items-center justify-center shadow-glow-cyan">
            <Cpu className="w-5 h-5 text-cyan-300" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-hud text-base sm:text-lg font-black tracking-wider text-slate-100 flex items-center gap-2">
                AEGIS<span className="text-cyan-400">TWIN</span>
                <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800">
                  4.0
                </span>
              </h1>
            </div>
            <p className="hidden sm:block text-[11px] font-mono text-slate-400">
              Industrial Textile Machine Health & Digital Twin Mission Control
            </p>
          </div>
        </div>

        {/* Center Live Status Pill */}
        <div className="hidden lg:flex items-center gap-3 bg-industrial-950/70 px-4 py-1.5 rounded-full border border-industrial-800">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${statusGlow}`} />
            <span className="text-xs font-hud tracking-wide font-bold uppercase text-slate-200">
              {overallStatus} SYSTEM
            </span>
          </div>
          <div className="h-3 w-px bg-industrial-800" />
          <span className="text-xs font-mono text-slate-400">
            Health: <b className="text-cyan-300">{telemetry?.overall_health_score.toFixed(0) || 100}%</b>
          </span>
          <div className="h-3 w-px bg-industrial-800" />
          <span className="text-xs font-mono text-slate-400">
            OEE: <b className="text-emerald-400">{telemetry?.oee_percentage.toFixed(1) || 98.4}%</b>
          </span>
        </div>

        {/* Right Actions & Clock */}
        <div className="flex items-center gap-3">
          {/* Audio Alerts Toggle */}
          <button
            onClick={toggleAudioAlerts}
            className={`p-2 rounded-xl border transition ${
              audioAlertsEnabled
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

          {/* View Switcher */}
          <div className="flex items-center gap-1 bg-industrial-950/80 p-1 rounded-xl border border-industrial-800">
            <button
              onClick={() => onViewChange("landing")}
              className={`px-3 py-1.5 rounded-lg text-xs font-hud transition flex items-center gap-1.5 ${
                currentView === "landing"
                  ? "bg-cyan-500 text-industrial-950 font-bold shadow-glow-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <Home className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Overview</span>
            </button>
            <button
              onClick={() => onViewChange("dashboard")}
              className={`px-3 py-1.5 rounded-lg text-xs font-hud transition flex items-center gap-1.5 ${
                currentView === "dashboard"
                  ? "bg-cyan-500 text-industrial-950 font-bold shadow-glow-cyan"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              <LayoutDashboard className="w-3.5 h-3.5" />
              <span>Console</span>
            </button>
          </div>

          {/* Clock & Connection */}
          <div className="hidden md:flex flex-col items-end pl-2">
            <span className="font-hud text-xs font-bold text-cyan-300 tracking-wider">
              {timeStr}
            </span>
            <span
              className={`text-[10px] font-mono flex items-center gap-1 ${
                isConnected ? "text-emerald-400" : "text-red-400"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isConnected ? "bg-emerald-400 animate-ping" : "bg-red-500"
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
