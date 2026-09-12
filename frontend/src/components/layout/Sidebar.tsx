import React from "react";
import { useTwin } from "../../context/TwinContext";
import { SimulationScenario } from "../../types";
import {
  ShieldAlert,
  Flame,
  Zap,
  Activity,
  OctagonX,
  Gauge,
  CheckCircle2,
  Box,
  Compass,
} from "lucide-react";

import { REAL_WORLD_MACHINES } from "../../data/machinesData";

export const Sidebar: React.FC = () => {
  const {
    activeScenario,
    setScenario,
    selectedComponent,
    setSelectedComponent,
    setCameraPreset,
    telemetry,
    activeMachineId,
  } = useTwin();

  const machine = REAL_WORLD_MACHINES[activeMachineId] || REAL_WORLD_MACHINES.picanol;

  const scenarios: {
    id: SimulationScenario;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }[] = [
      {
        id: "normal",
        label: "Normal Operation (Baseline)",
        description: "ISO Zone A (<150 mm/s), 650 RPM, 31°C nominal",
        icon: CheckCircle2,
        color: "text-cyber-emerald border-emerald-500/30 hover:border-emerald-400",
      },
      {
        id: "bearing_wear",
        label: "1. Bearing Wear & Failure",
        description: "Vibration spikes (>850 mm/s), RUL degradation",
        icon: Activity,
        color: "text-amber-400 border-amber-500/30 hover:border-amber-400",
      },
      {
        id: "motor_overload",
        label: "2. Motor Overload & Overheating",
        description: "Motor load surges, power kW spikes, alert triggered",
        icon: Zap,
        color: "text-rose-400 border-rose-500/30 hover:border-rose-400",
      },
      {
        id: "shaft_misalignment",
        label: "3. Shaft Misalignment & Harmonics",
        description: "Vibration harmonics, RPM fluctuation, pillow stress",
        icon: ShieldAlert,
        color: "text-purple-400 border-purple-500/40 hover:border-purple-400",
      },
      {
        id: "belt_slippage",
        label: "4. Drive Belt Slippage & Tension Loss",
        description: "RPM drops, load fluctuates, efficiency degraded",
        icon: Gauge,
        color: "text-cyan-300 border-cyan-500/30 hover:border-cyan-400",
      },
      {
        id: "overheating",
        label: "5. Thermal Runaway & Overheating",
        description: "Critical thermal runaway (>68°C), shutdown timer",
        icon: Flame,
        color: "text-cyber-crimson border-red-500/40 hover:border-red-400",
      },
    ];

  const components = [
    { id: "main_motor", name: "Main Motor", preset: "motor" as const },
    { id: "drive_shaft", name: "Drive Shaft", preset: "isometric" as const },
    { id: "bearings", name: "Spindle Bearings", preset: "bearings" as const },
    { id: "belt_system", name: "Belt Transmission", preset: "belt" as const },
    { id: "loom_section", name: "Weaving Loom", preset: "loom" as const },
    { id: "power_unit", name: "Power Unit", preset: "isometric" as const },
  ];

  return (
    <aside className="w-full lg:w-72 flex flex-col gap-4">
      {/* 1. SIMULATION CONTROLS */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-industrial-700/40">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="font-hud text-xs tracking-wider text-cyan-200 uppercase font-semibold">
            Simulation Controls
          </h3>
        </div>

        <div className="space-y-2">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isActive = activeScenario === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => setScenario(sc.id)}
                className={`w-full p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 font-medium ${isActive
                    ? "bg-industrial-800 border-cyan-400 shadow-glow-cyan"
                    : "bg-industrial-950/60 border-industrial-800/80 hover:bg-industrial-900"
                  }`}
              >
                <div
                  className={`p-1.5 rounded-lg bg-industrial-950 border shrink-0 mt-0.5 ${sc.color}`}
                >
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-hud text-xs font-semibold ${isActive ? "text-cyan-300" : "text-slate-200"
                        }`}
                    >
                      {sc.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1 font-normal">
                    {sc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. COMPONENT HEALTH ISOLATOR */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-industrial-700/40">
          <Box className="w-4 h-4 text-cyan-400" />
          <h3 className="font-hud text-xs tracking-wider text-cyan-200 uppercase font-semibold">
            Component Health Analysis
          </h3>
        </div>

        <div className="space-y-1.5">
          {components.map((comp) => {
            const compState = telemetry?.components?.[comp.id];
            const isSelected = selectedComponent === comp.id;

            return (
              <button
                key={comp.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedComponent(null);
                    setCameraPreset("isometric");
                  } else {
                    setSelectedComponent(comp.id);
                    setCameraPreset(comp.preset);
                  }
                }}
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition flex items-center justify-between font-medium ${isSelected
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 font-semibold shadow-glow-cyan"
                    : "bg-industrial-950/60 border-industrial-800 text-slate-300 hover:text-white hover:bg-industrial-900"
                  }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: compState?.glow_color || "#10b981" }}
                  />
                  <span>{comp.name}</span>
                </div>
                <span className="text-[10px] font-hud text-slate-400 uppercase font-semibold">
                  {(compState?.health_score ?? 100).toFixed(0)}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MACHINE SPECIFICATIONS */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel font-mono text-xs text-slate-400 space-y-1.5">
        <div className="text-[10px] font-hud text-slate-300 uppercase tracking-wider mb-1 font-semibold">
          Machine Specifications
        </div>
        <div className="flex justify-between">
          <span>Unit ID:</span>
          <span className="text-cyan-300 font-bold uppercase">{machine.id}</span>
        </div>
        <div className="flex justify-between">
          <span>Machine:</span>
          <span className="text-slate-100 font-semibold">{machine.name}</span>
        </div>
        <div className="flex justify-between">
          <span>Machine Type:</span>
          <span className="text-slate-200">{machine.manufacturer} {machine.type}</span>
        </div>
        <div className="flex justify-between">
          <span>Rated Speed:</span>
          <span className="text-cyan-300">{machine.rpm} RPM (PPM)</span>
        </div>
        <div className="flex justify-between">
          <span>Standard:</span>
          <span className="text-slate-200">ISO 10816-3 Class II</span>
        </div>
        <div className="flex justify-between">
          <span>Sensor Array:</span>
          <span className="text-slate-200">Piezo / PT100 / CT / Hall</span>
        </div>
      </div>
    </aside>
  );
};
