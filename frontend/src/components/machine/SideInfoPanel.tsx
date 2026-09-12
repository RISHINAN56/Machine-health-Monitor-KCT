import React, { useState } from "react";
import { useTwin } from "../../context/TwinContext";
import { REAL_WORLD_MACHINES } from "../../data/machines";
import { soundEffects } from "../../utils/soundEffects";
import { MachineSpecsTab } from "./MachineSpecsTab";
import { MachineScenariosTab } from "./MachineScenariosTab";
import { AiPredictivePanel } from "../dashboard/AiPredictivePanel";
import {
  Zap,
  Gauge,
  Activity,
  Flame,
  Wind,
  AlertTriangle,
  RotateCcw,
} from "lucide-react";

export const SideInfoPanel: React.FC = () => {
  const { activeMachineId, telemetry } = useTwin();
  const [activeTab, setActiveTab] = useState<"details" | "ai" | "diagnostics">("details");

  const machine = REAL_WORLD_MACHINES[activeMachineId] || REAL_WORLD_MACHINES.picanol;

  const liveRpm = telemetry?.sensors?.rpm ?? machine.rpm;
  const liveTemp = telemetry?.sensors?.temperature ?? machine.temperature;
  const liveVib = telemetry?.sensors?.vibration ?? machine.vibration;
  const liveHealth = telemetry?.overall_health_score ?? machine.healthScore;
  const livePower =
    telemetry && telemetry.sensors
      ? (machine.powerConsumptionKw * (liveRpm / machine.rpm) * (1 + (liveVib > 300 ? 0.25 : 0))).toFixed(2)
      : machine.powerConsumptionKw.toFixed(2);
  const liveAirPressure =
    machine.id === "toyota" ? "4.6 bar (Eco)" : machine.id === "tsudakoma" ? "5.8 bar" : "5.2 bar";

  const isHealthy = machine.status === "Healthy" && (telemetry?.overall_status ?? "Healthy") !== "Critical";

  return (
    <aside
      aria-label="Machine Inspector Side Panel"
      className="w-full flex flex-col gap-3 font-sans"
    >
      {/* 1. Header Card: Selected Machine Identity */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel relative overflow-hidden">
        <div
          className="absolute top-0 right-0 w-28 h-28 rounded-full pointer-events-none blur-3xl opacity-20"
          style={{ backgroundColor: machine.accentColor }}
        />

        <div className="flex items-start justify-between gap-2 border-b border-industrial-700/40 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-cyan-950/80 text-[#00E5FF] border border-[#00E5FF]/40">
                {machine.id.toUpperCase()}
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {machine.manufacturer}
              </span>
            </div>
            <h2 className="font-hud text-sm font-extrabold text-white mt-1 uppercase tracking-wide">
              {machine.name}
            </h2>
            <div className="text-[11px] font-mono text-slate-400 flex items-center gap-1.5 mt-0.5">
              <span>{machine.type}</span>
              <span>&bull;</span>
              <span className="text-slate-300">{machine.location}</span>
            </div>
          </div>

          {/* Status Badge */}
          {isHealthy ? (
            <span className="px-2.5 py-1 text-[11px] font-hud uppercase tracking-wider rounded-lg bg-emerald-500/15 text-[#00FFC8] border border-emerald-500/40 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC8] animate-ping" />
              Healthy
            </span>
          ) : (
            <span className="px-2.5 py-1 text-[11px] font-hud uppercase tracking-wider rounded-lg bg-amber-500/20 text-[#FFB000] border border-amber-500/50 flex items-center gap-1 animate-pulse">
              <AlertTriangle className="w-3.5 h-3.5 text-[#FFB000]" />
              Warning
            </span>
          )}
        </div>

        {/* Live Health Progress */}
        <div className="mt-3">
          <div className="flex items-center justify-between text-xs font-mono mb-1">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-[#00E5FF]" />
              <span>Digital Twin Health Index</span>
            </span>
            <span
              className={`font-bold font-mono tracking-wider text-sm ${
                liveHealth >= 90
                  ? "text-[#00FFC8]"
                  : liveHealth >= 70
                  ? "text-[#FFB000]"
                  : "text-[#FF4D4D]"
              }`}
            >
              {liveHealth.toFixed(1)}%
            </span>
          </div>
          <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden border border-industrial-800">
            <div
              className={`h-full rounded-full transition-all duration-700 ${
                liveHealth >= 90
                  ? "bg-gradient-to-r from-emerald-500 to-[#00FFC8]"
                  : liveHealth >= 70
                  ? "bg-gradient-to-r from-amber-500 to-[#FFB000]"
                  : "bg-gradient-to-r from-red-500 to-[#FF4D4D]"
              }`}
              style={{ width: `${Math.min(100, Math.max(5, liveHealth))}%` }}
            />
          </div>
        </div>

        {/* Tab Toggle: Machine Details vs AI Predictive vs Scenarios */}
        <div className="grid grid-cols-3 gap-1.5 mt-3 pt-2 border-t border-industrial-800/80">
          <button
            onClick={() => {
              soundEffects.playHoverTick();
              setActiveTab("details");
            }}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-hud uppercase tracking-wider transition font-semibold text-center ${
              activeTab === "details"
                ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.25)]"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
            }`}
          >
            Specs
          </button>
          <button
            onClick={() => {
              soundEffects.playHoverTick();
              setActiveTab("ai");
            }}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-hud uppercase tracking-wider transition font-semibold text-center relative ${
              activeTab === "ai"
                ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.25)]"
                : machine.status === "Warning"
                ? "text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-500/30"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
            }`}
          >
            AI Engine
            {machine.status === "Warning" && (
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 absolute top-1 right-1 animate-ping" />
            )}
          </button>
          <button
            onClick={() => {
              soundEffects.playHoverTick();
              setActiveTab("diagnostics");
            }}
            className={`py-1.5 px-1 rounded-lg text-[11px] font-hud uppercase tracking-wider transition font-semibold text-center ${
              activeTab === "diagnostics"
                ? "bg-[#00E5FF]/20 text-[#00E5FF] border border-[#00E5FF]/50 shadow-[0_0_10px_rgba(0,229,255,0.25)]"
                : "text-slate-400 hover:text-slate-200 bg-slate-900/50"
            }`}
          >
            Scenarios
          </button>
        </div>
      </div>

      {/* 2. LIVE METRICS GAUGES */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-industrial-700/40">
          <div className="flex items-center gap-1.5">
            <Gauge className="w-4 h-4 text-[#00E5FF]" />
            <h3 className="font-hud text-xs font-bold text-slate-200 uppercase tracking-wider">
              Live Sensor Telemetry
            </h3>
          </div>
          <span className="text-[10px] font-mono text-[#00FFC8] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#00FFC8] animate-ping" />
            2s Live
          </span>
        </div>

        <div className="space-y-2 font-mono">
          {/* RPM Gauge */}
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/30 text-[#00E5FF]">
                <RotateCcw className="w-3.5 h-3.5 animate-spin" style={{ animationDuration: "3s" }} />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Loom Speed</span>
                <span className="text-xs text-slate-300 font-normal">Picks Per Minute</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white font-mono">{liveRpm.toFixed(0)} RPM</div>
              <span className="text-[10px] text-[#00FFC8] font-semibold">Rated 650 PPM</span>
            </div>
          </div>

          {/* Temperature Gauge */}
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${
                  liveTemp > 45
                    ? "bg-amber-950/80 border-amber-500/40 text-[#FFB000]"
                    : "bg-emerald-950/80 border-emerald-500/30 text-[#00FFC8]"
                }`}
              >
                <Flame className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Bearing Temp</span>
                <span className="text-xs text-slate-300 font-normal">PT100 RTD Sensor</span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-bold font-mono ${
                  liveTemp > 45 ? "text-[#FFB000]" : "text-white"
                }`}
              >
                {liveTemp.toFixed(1)}°C
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  liveTemp > 45 ? "text-[#FFB000]" : "text-slate-400"
                }`}
              >
                {liveTemp > 45 ? "Elevated Warning" : "Nominal (<45°C)"}
              </span>
            </div>
          </div>

          {/* Vibration Gauge */}
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className={`p-1.5 rounded-lg border ${
                  liveVib > 300
                    ? "bg-amber-950/80 border-amber-500/40 text-[#FFB000]"
                    : "bg-cyan-950/80 border-cyan-500/30 text-[#00E5FF]"
                }`}
              >
                <Activity className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Vibration RMS</span>
                <span className="text-xs text-slate-300 font-normal">ISO 10816 Class II</span>
              </div>
            </div>
            <div className="text-right">
              <div
                className={`text-sm font-bold font-mono ${
                  liveVib > 300 ? "text-[#FFB000]" : "text-white"
                }`}
              >
                {liveVib.toFixed(0)} mm/s
              </div>
              <span
                className={`text-[10px] font-semibold ${
                  liveVib > 300 ? "text-[#FFB000]" : "text-[#00FFC8]"
                }`}
              >
                {liveVib > 300 ? "Zone C Alert" : "Zone A (Good)"}
              </span>
            </div>
          </div>

          {/* Air Pressure */}
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-blue-950/80 border border-blue-500/30 text-blue-400">
                <Wind className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Pneumatic Air Pressure</span>
                <span className="text-xs text-slate-300 font-normal">Weft Nozzle Line</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white font-mono">{liveAirPressure}</div>
              <span className="text-[10px] text-cyan-400 font-semibold">Constant Supply</span>
            </div>
          </div>

          {/* Energy Usage */}
          <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-950/80 border border-amber-500/30 text-amber-400">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <div>
                <span className="text-[10px] text-slate-400 uppercase block font-medium">Energy Consumption</span>
                <span className="text-xs text-slate-300 font-normal">IEC 60034 Power</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm font-bold text-white font-mono">{livePower} kW</div>
              <span className="text-[10px] text-[#00E5FF] font-semibold">
                Eff: {machine.efficiency}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 3. SUB-TABS: DETAILS / SCENARIOS / AI ENGINE */}
      {activeTab === "details" && <MachineSpecsTab machine={machine} />}
      {activeTab === "diagnostics" && <MachineScenariosTab />}
      {activeTab === "ai" && <AiPredictivePanel />}
    </aside>
  );
};
