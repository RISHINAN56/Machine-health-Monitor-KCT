import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Factory,
  CheckCircle2,
  AlertTriangle,
  AlertOctagon,
  Zap,
  Activity,
  ArrowRight,
  Gauge,
  Sliders,
} from "lucide-react";
import { MachineSummary } from "../../types";

import { REAL_MACHINES_LIST } from "../../data/machines";

export const FactoryFloorView: React.FC = () => {
  const { fleet, activeMachineId, setActiveMachineId, setActiveTab, setScenario } = useTwin();

  const machines: MachineSummary[] = REAL_MACHINES_LIST.map((m) => ({
    machine_id: m.id,
    name: m.name,
    model: `${m.manufacturer} ${m.type}`,
    status: m.status,
    health_score: m.healthScore,
    rpm: m.rpm,
    temperature: m.temperature,
    vibration: m.vibration,
    scenario: m.id === "tsudakoma" ? "bearing_wear" : "normal",
    oee_percentage: m.efficiency,
    location: m.location,
    meters_woven_today: m.metersWovenToday,
    active_alerts_count: m.activeAlertsCount,
  }));

  const handleSelectMachine = (machine: MachineSummary) => {
    setActiveMachineId(machine.machine_id);
    if (machine.machine_id === "tsudakoma") {
      setScenario("bearing_wear");
    } else {
      setScenario("normal");
    }
    setActiveTab("console");
  };

  const getStatusBadge = (status: string) => {
    if (status === "Critical") {
      return (
        <span className="px-2.5 py-1 text-xs font-hud uppercase rounded-lg bg-red-500/20 text-red-300 border border-red-500/50 flex items-center gap-1.5 animate-pulse">
          <AlertOctagon className="w-3.5 h-3.5 text-red-400" />
          Critical
        </span>
      );
    }
    if (status === "Warning") {
      return (
        <span className="px-2.5 py-1 text-xs font-hud uppercase rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          Warning
        </span>
      );
    }
    return (
      <span className="px-2.5 py-1 text-xs font-hud uppercase rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 flex items-center gap-1.5">
        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
        Healthy
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Factory Floor Plant Overview Summary Banner */}
      <div className="glass-panel p-5 rounded-2xl border border-industrial-700/60 shadow-panel">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-industrial-700/40">
          <div>
            <div className="flex items-center gap-2">
              <Factory className="w-5 h-5 text-cyan-400" />
              <h2 className="font-hud text-base font-bold text-slate-100 uppercase tracking-wider">
                {fleet?.factory_name || "Coimbatore Smart Weaving Facility 4.0"}
              </h2>
            </div>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Industry 4.0 Fleet Digital Twin &bull; Real-time Shop Floor SCADA / MES Ingestion
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs font-mono px-3 py-1.5 rounded-lg bg-industrial-900 border border-industrial-700 text-slate-300">
              Fleet Size: <strong className="text-cyan-400">3 Connected Air-Jet Looms</strong>
            </span>
          </div>
        </div>

        {/* Fleet KPI Highlights Bar */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="p-3 rounded-xl bg-industrial-950/60 border border-industrial-800">
            <span className="text-[10px] font-hud text-slate-400 uppercase">Factory Health Index</span>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-0.5">
              {(fleet?.factory_health_score ?? 86.2).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Weighted fleet aggregate</span>
          </div>

          <div className="p-3 rounded-xl bg-industrial-950/60 border border-industrial-800">
            <span className="text-[10px] font-hud text-slate-400 uppercase">Fleet OEE Average</span>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-0.5">
              {(fleet?.fleet_oee_average ?? 94.6).toFixed(1)}%
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Overall Equipment Effectiveness</span>
          </div>

          <div className="p-3 rounded-xl bg-industrial-950/60 border border-industrial-800">
            <span className="text-[10px] font-hud text-slate-400 uppercase">Total Facility Power</span>
            <div className="text-xl font-bold font-mono text-amber-300 mt-0.5">
              {(fleet?.total_power_kw ?? 74.4).toFixed(1)} kW
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Real-time load demand</span>
          </div>

          <div className="p-3 rounded-xl bg-industrial-950/60 border border-industrial-800">
            <span className="text-[10px] font-hud text-slate-400 uppercase">Production Today</span>
            <div className="text-xl font-bold font-mono text-slate-100 mt-0.5">
              751.4 m
            </div>
            <span className="text-[10px] text-slate-500 font-mono">Total fabric woven</span>
          </div>
        </div>
      </div>

      {/* Grid of Machines A - E (1-Click Twin Switching) */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {machines.map((m) => {
          const isCurrentActive = activeMachineId === m.machine_id;

          return (
            <div
              key={m.machine_id}
              className={`glass-panel p-5 rounded-2xl border transition relative flex flex-col justify-between ${isCurrentActive
                  ? "border-cyan-400/80 shadow-glow-cyan bg-industrial-900/90"
                  : m.status === "Critical"
                    ? "border-red-500/70 bg-red-950/20"
                    : m.status === "Warning"
                      ? "border-amber-500/60 bg-amber-950/15"
                      : "border-industrial-700/60 hover:border-industrial-500/70"
                }`}
            >
              <div>
                {/* Header Row */}
                <div className="flex items-start justify-between pb-3 border-b border-industrial-700/40">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-hud font-bold text-cyan-300 uppercase px-2 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/40">
                        {m.machine_id}
                      </span>
                      <h3 className="font-hud text-sm font-semibold text-slate-100 tracking-wide">
                        {m.name}
                      </h3>
                    </div>
                    <div className="text-[11px] font-mono text-slate-400 mt-1 font-normal">
                      {m.model}
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 font-normal">
                      {m.location}
                    </div>
                  </div>
                  {getStatusBadge(m.status)}
                </div>

                {/* Health Bar & OEE */}
                <div className="my-4 space-y-2">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-slate-400">Machine Health Score</span>
                    <span
                      className={`font-extrabold ${m.health_score > 75
                          ? "text-emerald-400"
                          : m.health_score > 50
                            ? "text-amber-400"
                            : "text-red-400"
                        }`}
                    >
                      {m.health_score.toFixed(1)}%
                    </span>
                  </div>
                  <div className="h-2 w-full bg-industrial-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${m.health_score > 75
                          ? "bg-emerald-500 shadow-glow-emerald"
                          : m.health_score > 50
                            ? "bg-amber-500 shadow-glow-amber"
                            : "bg-red-500 shadow-glow-red"
                        }`}
                      style={{ width: `${Math.max(5, m.health_score)}%` }}
                    />
                  </div>
                </div>

                {/* Sensor Telemetry Stats */}
                <div className="grid grid-cols-3 gap-2.5 py-3 border-y border-industrial-800/80 text-center font-mono">
                  <div className="bg-industrial-950/50 p-2 rounded-lg border border-industrial-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Speed</span>
                    <span className="text-xs font-bold text-slate-200">{m.rpm.toFixed(0)} RPM</span>
                  </div>
                  <div className="bg-industrial-950/50 p-2 rounded-lg border border-industrial-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Temp</span>
                    <span className={`text-xs font-bold ${m.temperature > 50 ? "text-red-400" : "text-slate-200"
                      }`}>
                      {m.temperature.toFixed(1)}°C
                    </span>
                  </div>
                  <div className="bg-industrial-950/50 p-2 rounded-lg border border-industrial-800">
                    <span className="text-[10px] text-slate-500 uppercase block font-medium">Vib RMS</span>
                    <span className={`text-xs font-bold ${m.vibration > 300 ? "text-amber-400" : "text-slate-200"
                      }`}>
                      {m.vibration.toFixed(0)} mm/s
                    </span>
                  </div>
                </div>

                {/* Additional Factory Floor Attributes */}
                <div className="mt-3 flex items-center justify-between text-[11px] font-mono text-slate-400">
                  <span>Woven: <strong className="text-slate-200 font-semibold">{m.meters_woven_today.toFixed(1)}m</strong></span>
                  <span>OEE: <strong className="text-cyan-400 font-semibold">{m.oee_percentage.toFixed(1)}%</strong></span>
                  <span>Alarms: <strong className={m.active_alerts_count > 0 ? "text-red-400 font-semibold" : "text-emerald-400 font-semibold"}>{m.active_alerts_count}</strong></span>
                </div>
              </div>

              {/* 1-Click Twin Switch Button */}
              <div className="mt-5 pt-3 border-t border-industrial-700/40">
                <button
                  onClick={() => handleSelectMachine(m)}
                  className={`w-full py-2 px-3 rounded-xl text-xs font-hud uppercase tracking-wider flex items-center justify-center gap-2 transition font-medium ${isCurrentActive
                      ? "bg-cyan-500 text-industrial-950 shadow-glow-cyan"
                      : "bg-industrial-800/90 text-cyan-300 hover:bg-cyan-500/20 hover:border-cyan-400 border border-industrial-700"
                    }`}
                >
                  <span>{isCurrentActive ? "Active 3D Twin" : "Switch 3D Twin"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
