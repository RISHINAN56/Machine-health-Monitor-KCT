import React from "react";
import { useTwin } from "../../context/TwinContext";
import { REAL_WORLD_MACHINES } from "../../data/machines";
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
  const { telemetry, isConnected, activeMachineId } = useTwin();
  const activeMachine = REAL_WORLD_MACHINES[activeMachineId] || REAL_WORLD_MACHINES.picanol;

  const healthScore = telemetry?.overall_health_score ?? activeMachine.healthScore;
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
    <div className="glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-sm tracking-wider text-cyan-300 uppercase font-bold font-hud">
              {activeMachine.name}
            </h2>
            <span
              className={`inline-block w-2 h-2 rounded-full ${isConnected ? "bg-cyber-emerald animate-pulse" : "bg-red-500"
                }`}
            />
          </div>
          <p className="text-xs text-slate-400 font-mono mt-0.5">
            Unit ID: <strong className="text-white">{activeMachine.id.toUpperCase()}</strong> | {activeMachine.manufacturer} {activeMachine.type}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs px-2.5 py-1 rounded-lg bg-industrial-800/80 border border-industrial-700 text-slate-300">
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
            title="MACHINE HEALTH SCORE"
          />
        </div>

        {/* Multi-Factor Health Breakdown */}
        <div className="md:col-span-7 space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
            Physical Degradation Factors
          </div>

          {/* 1. Vibration Analysis */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 font-normal">
                <Activity className="w-3.5 h-3.5 text-cyber-cyan" /> Vibration Analysis (ISO 10816)
              </span>
              <span className="font-bold text-slate-200">
                {(breakdown?.vibration_score ?? 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${(breakdown?.vibration_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.vibration_score ?? 100) > 50
                      ? "bg-cyber-amber"
                      : "bg-cyber-crimson shadow-glow-crimson"
                  }`}
                style={{ width: `${breakdown?.vibration_score ?? 100}%` }}
              />
            </div>
          </div>

          {/* 2. Temperature Monitoring */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 font-normal">
                <Zap className="w-3.5 h-3.5 text-amber-400" /> Temperature Monitoring
              </span>
              <span className="font-bold text-slate-200">
                {(breakdown?.temperature_score ?? 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${(breakdown?.temperature_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.temperature_score ?? 100) > 50
                      ? "bg-cyber-amber"
                      : "bg-cyber-crimson shadow-glow-crimson"
                  }`}
                style={{ width: `${breakdown?.temperature_score ?? 100}%` }}
              />
            </div>
          </div>

          {/* 3. Motor Load Capacity */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 font-normal">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Motor Load Capacity
              </span>
              <span className="font-bold text-slate-200">
                {(breakdown?.motor_load_score ?? 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${(breakdown?.motor_load_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.motor_load_score ?? 100) > 50
                      ? "bg-cyber-amber"
                      : "bg-cyber-crimson shadow-glow-crimson"
                  }`}
                style={{ width: `${breakdown?.motor_load_score ?? 100}%` }}
              />
            </div>
          </div>

          {/* 4. RPM Stability */}
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="text-slate-300 flex items-center gap-1.5 font-normal">
                <Gauge className="w-3.5 h-3.5 text-emerald-400" /> RPM Stability
              </span>
              <span className="font-bold text-slate-200">
                {(breakdown?.rpm_stability_score ?? 100).toFixed(0)}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${(breakdown?.rpm_stability_score ?? 100) > 75
                    ? "bg-cyber-emerald"
                    : (breakdown?.rpm_stability_score ?? 100) > 50
                      ? "bg-cyber-amber"
                      : "bg-cyber-crimson shadow-glow-crimson"
                  }`}
                style={{ width: `${breakdown?.rpm_stability_score ?? 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Primary KPI Badges Footer */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-3 border-t border-industrial-700/40">
        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 block">Operating Uptime</span>
          <span className="text-sm font-bold text-slate-100 flex items-center gap-1 mt-0.5">
            <Clock className="w-3.5 h-3.5 text-cyan-400" />
            {formatUptime(telemetry?.uptime_seconds)}
          </span>
        </div>

        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 block">OEE Efficiency</span>
          <span className="text-sm font-bold text-emerald-400 flex items-center gap-1 mt-0.5">
            <Gauge className="w-3.5 h-3.5 text-emerald-400" />
            {(telemetry?.oee_percentage ?? 98.4).toFixed(1)}%
          </span>
        </div>

        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 block">Fabric Woven (Output)</span>
          <span className="text-sm font-bold text-cyan-300 flex items-center gap-1 mt-0.5">
            <Layers className="w-3.5 h-3.5 text-cyan-300" />
            {(telemetry?.meters_woven ?? 0).toFixed(1)} m
          </span>
        </div>

        <div className="bg-industrial-950/60 p-2.5 rounded-xl border border-industrial-800/80">
          <span className="text-[11px] text-slate-400 block">Active Alarms</span>
          <span
            className={`text-sm font-bold flex items-center gap-1 mt-0.5 ${(telemetry?.active_alerts_count || 0) > 0
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
