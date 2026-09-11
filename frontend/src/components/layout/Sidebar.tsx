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

export const Sidebar: React.FC = () => {
  const {
    activeScenario,
    setScenario,
    selectedComponent,
    setSelectedComponent,
    setCameraPreset,
    telemetry,
  } = useTwin();

  const scenarios: {
    id: SimulationScenario;
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
  }[] = [
    {
      id: "normal",
      label: "Optimal Operation",
      description: "ISO Zone A (<150 mm/s), 650 RPM, 31°C",
      icon: CheckCircle2,
      color: "text-cyber-emerald border-emerald-500/30 hover:border-emerald-400",
    },
    {
      id: "bearing_wear",
      label: "Bearing Failure",
      description: "Severe vibration (>850 mm/s), raceway wear",
      icon: Activity,
      color: "text-amber-400 border-amber-500/30 hover:border-amber-400",
    },
    {
      id: "motor_overheat",
      label: "Thermal Overload",
      description: "Stator climbs >64°C, cooling blocked",
      icon: Flame,
      color: "text-rose-400 border-rose-500/30 hover:border-rose-400",
    },
    {
      id: "loom_jam",
      label: "Weft Insertion Jam",
      description: "Load surges to 1050A, speed drops",
      icon: ShieldAlert,
      color: "text-cyber-crimson border-red-500/40 hover:border-red-400",
    },
    {
      id: "rapid_estop",
      label: "Emergency Stop",
      description: "Safety gate tripped, 0 RPM shutdown",
      icon: OctagonX,
      color: "text-red-400 border-red-700/50 hover:border-red-500",
    },
    {
      id: "speed_fluctuation",
      label: "Belt Slip Fluctuation",
      description: "Erratic RPM oscillation (450-820 RPM)",
      icon: Gauge,
      color: "text-cyan-300 border-cyan-500/30 hover:border-cyan-400",
    },
  ];

  const components = [
    { id: "main_motor", name: "Main Motor", preset: "motor" as const },
    { id: "drive_shaft", name: "Drive Shaft", preset: "isometric" as const },
    { id: "bearings", name: "Bearings (Pillow)", preset: "bearings" as const },
    { id: "belt_system", name: "Belt Transmission", preset: "belt" as const },
    { id: "loom_section", name: "Loom Shed & Reed", preset: "loom" as const },
    { id: "power_unit", name: "Power Inverter", preset: "isometric" as const },
  ];

  return (
    <aside className="w-full lg:w-72 flex flex-col gap-4">
      {/* 1. SCENARIO INJECTION MATRIX */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-industrial-700/40">
          <Compass className="w-4 h-4 text-cyan-400" />
          <h3 className="font-hud text-xs tracking-wider text-cyan-200 uppercase font-bold">
            Fault Scenario Injector
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
                className={`w-full p-2.5 rounded-xl border text-left transition flex items-start gap-2.5 ${
                  isActive
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
                      className={`font-hud text-xs font-bold ${
                        isActive ? "text-cyan-300" : "text-slate-200"
                      }`}
                    >
                      {sc.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5 line-clamp-1">
                    {sc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 2. 3D COMPONENT ISOLATOR */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center gap-2 pb-3 mb-3 border-b border-industrial-700/40">
          <Box className="w-4 h-4 text-cyan-400" />
          <h3 className="font-hud text-xs tracking-wider text-cyan-200 uppercase font-bold">
            Sub-Assembly Isolator
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
                className={`w-full px-3 py-2 rounded-xl border text-xs font-mono transition flex items-center justify-between ${
                  isSelected
                    ? "bg-cyan-500/20 text-cyan-200 border-cyan-400 font-bold shadow-glow-cyan"
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
                <span className="text-[10px] font-hud text-slate-400 uppercase">
                  {compState?.health_score.toFixed(0) || 100}%
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. MACHINE SPECIFICATIONS */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel font-mono text-xs text-slate-400 space-y-1.5">
        <div className="text-[10px] font-hud text-slate-300 uppercase tracking-wider mb-1 font-bold">
          Technical Specifications
        </div>
        <div className="flex justify-between">
          <span>Machine Type:</span>
          <span className="text-slate-200">High-Speed Air-Jet Loom</span>
        </div>
        <div className="flex justify-between">
          <span>Rated Speed:</span>
          <span className="text-cyan-300">650 RPM (PPM)</span>
        </div>
        <div className="flex justify-between">
          <span>Standard:</span>
          <span className="text-slate-200">ISO 10816-3 Class II</span>
        </div>
        <div className="flex justify-between">
          <span>Sensors:</span>
          <span className="text-slate-200">Piezo / PT100 / CT / Hall</span>
        </div>
      </div>
    </aside>
  );
};
