import React from "react";
import { useTwin } from "../../context/TwinContext";
import { CircularGauge } from "../common/CircularGauge";
import {
  Clock,
  Gauge,
  Activity,
  Layers,
  Zap,
  AlertTriangle,
  Cpu,
} from "lucide-react";

export const MachineOverview: React.FC = () => {
  const { telemetry, isConnected } = useTwin();

  const healthScore = telemetry?.overall_health_score ?? 100;
  const breakdown = telemetry?.health_breakdown;

  // Format uptime in hh:mm:ss
  const formatUptime = (seconds: number = 0) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hrs.toString().padStart(2, "0")}h ${mins
      .toString()
      .padStart(2, "0")}m ${secs.toString().padStart(2, "0")}s`;
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="font-hud text-sm tracking-wider text-cyan-300 uppercase font-bold">
              Machine Health Overview
            </h2>
            <span
              className={`inline-block w-2 h-2 rounded-full ${
                isConnected ? "bg-cyber-emerald animate-pulse" : "bg-red-500"
              }`}
            />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Unit: LOOM-AIRJET-042 | Picanol OmniPlus
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono px-2.5 py-1 rounded-lg bg-industrial-800/80 border border-industrial-700 text-slate-300">
            Scenario:{" "}
            <span className="text-cyan-300 font-semibold uppercase">
              {telemetry?.scenario || "NORMAL"}
            </span>
          </span>
        </div>
      </div>

      {/* Main Gauge & Breakdown Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 my-4 items-center">
        {/* Circular Health Gauge */}
        <div className="md:col-span-5 flex flex-col items-center justify-center">
          <CircularGauge
            score={healthScore}
            size={180}
            strokeWidth={14}
            title="ISO 10816 HEALTH"
          />
        </div>

        {/* Multi-Factor Health Breakdown */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-xs font-hud text-slate-400 uppercase tracking-wider mb-1">
            Physical Degradation Factors
          </div>

          {/* 1. Vibration Index */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-cyber-cyan" /> Vibration (ISO 10816)
              </span>
              <span className="font-bold text-slate-200">
                {breakdown?.vibration_score.toFixed(0) || 100}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (breakdown?.vibration_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.vibration_score ?? 100) > 50
                    ? "bg-cyber-amber"
                    : "bg-cyber-crimson shadow-glow-crimson"
                }`}
                style={{ width: `${breakdown?.vibration_score || 100}%` }}
              />
            </div>
          </div>

          {/* 2. Thermal Wear */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Thermal State
              </span>
              <span className="font-bold text-slate-200">
                {breakdown?.temperature_score.toFixed(0) || 100}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (breakdown?.temperature_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.temperature_score ?? 100) > 50
                    ? "bg-cyber-amber"
                    : "bg-cyber-crimson shadow-glow-crimson"
                }`}
                style={{ width: `${breakdown?.temperature_score || 100}%` }}
              />
            </div>
          </div>

          {/* 3. Motor Load Torque */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Motor Load Reserve
              </span>
              <span className="font-bold text-slate-200">
                {breakdown?.motor_load_score.toFixed(0) || 100}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (breakdown?.motor_load_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.motor_load_score ?? 100) > 50
                    ? "bg-cyber-amber"
                    : "bg-cyber-crimson shadow-glow-crimson"
                }`}
                style={{ width: `${breakdown?.motor_load_score || 100}%` }}
              />
            </div>
          </div>

          {/* 4. RPM Stability */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> Speed Stability
              </span>
              <span className="font-bold text-slate-200">
                {breakdown?.rpm_stability_score.toFixed(0) || 100}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  (breakdown?.rpm_stability_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.rpm_stability_score ?? 100) > 50
                    ? "bg-cyber-amber"
                    : "bg-cyber-crimson shadow-glow-crimson"
                }`}
                style={{ width: `${breakdown?.rpm_stability_score || 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Badges Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-industrial-700/40">
        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 font-mono block">Uptime</span>
          <span className="text-sm font-hud font-bold text-slate-100 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {formatUptime(telemetry?.uptime_seconds)}
          </span>
        </div>

        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 font-mono block">OEE Efficiency</span>
          <span className="text-sm font-hud font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            {telemetry?.oee_percentage.toFixed(1) || 98.4}%
          </span>
        </div>

        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 font-mono block">Fabric Woven</span>
          <span className="text-sm font-hud font-bold text-cyan-300 flex items-center gap-1 mt-0.5">
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            {telemetry?.meters_woven.toFixed(1) || 0} m
          </span>
        </div>

        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 font-mono block">Active Alarms</span>
          <span
            className={`text-sm font-hud font-bold flex items-center gap-1 mt-0.5 ${
              (telemetry?.active_alerts_count || 0) > 0
                ? "text-cyber-crimson animate-pulse"
                : "text-slate-400"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            {telemetry?.active_alerts_count || 0} Events
          </span>
        </div>
      </div>
    </div>
  );
};
