import React from "react";
import { useTwin } from "../../context/TwinContext";
import { soundEffects } from "../../utils/soundEffects";
import { SimulationScenario } from "../../types";
import {
  Sliders,
  Layers,
  ShieldCheck,
  Activity,
  Zap,
  Gauge,
  Flame,
} from "lucide-react";

export const MachineScenariosTab: React.FC = () => {
  const {
    activeScenario,
    setScenario,
    selectedComponent,
    setSelectedComponent,
    setCameraPreset,
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
      label: "Nominal Baseline",
      description: "ISO 10816 Zone A (<150 mm/s), optimal pneumatic pressure",
      icon: ShieldCheck,
      color: "text-[#00FFC8] border-emerald-500/30",
    },
    {
      id: "bearing_wear",
      label: "Bearing Degradation",
      description: "Severe spindle vibration (>480 mm/s), thermal hotspot",
      icon: Activity,
      color: "text-[#FFB000] border-amber-500/40",
    },
    {
      id: "motor_overload",
      label: "Drive Motor Overload",
      description: "Power kW surge (+35%), thermal ramp up",
      icon: Zap,
      color: "text-[#FF4D4D] border-red-500/40",
    },
    {
      id: "belt_slippage",
      label: "Drive Belt Slippage",
      description: "Speed fluctuation, erratic weft insertion",
      icon: Gauge,
      color: "text-cyan-300 border-cyan-500/30",
    },
    {
      id: "overheating",
      label: "Thermal Runaway",
      description: "Hot bearing race (>65°C), imminent seizure",
      icon: Flame,
      color: "text-rose-400 border-rose-500/40",
    },
  ];

  const components = [
    { id: "main_motor", name: "Main Motor (Sumo / Servo)", preset: "motor" as const },
    { id: "drive_shaft", name: "Main Drive Shaft", preset: "isometric" as const },
    { id: "bearings", name: "Spindle Roller Bearings", preset: "bearings" as const },
    { id: "belt_system", name: "Belt Transmission & Pulley", preset: "belt" as const },
    { id: "loom_section", name: "Weaving Sley & Reed", preset: "loom" as const },
    { id: "power_unit", name: "Pneumatic Valve Cabinet", preset: "isometric" as const },
  ];

  return (
    <div className="space-y-3">
      {/* Failure Modes Injection */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-industrial-700/40">
          <Sliders className="w-4 h-4 text-[#00E5FF]" />
          <h3 className="font-hud text-xs font-bold text-slate-200 uppercase tracking-wider">
            Industrial Simulation Scenarios
          </h3>
        </div>

        <div className="space-y-1.5">
          {scenarios.map((sc) => {
            const Icon = sc.icon;
            const isActive = activeScenario === sc.id;

            return (
              <button
                key={sc.id}
                onClick={() => {
                  soundEffects.playHoverTick();
                  setScenario(sc.id);
                }}
                className={`w-full p-2 rounded-xl border text-left transition flex items-start gap-2 text-xs font-mono ${
                  isActive
                    ? "bg-slate-900 border-[#00E5FF] shadow-[0_0_15px_rgba(0,229,255,0.3)]"
                    : "bg-slate-950/60 border-slate-800/80 hover:bg-slate-900/80"
                }`}
              >
                <div className={`p-1 rounded-lg bg-slate-950 border shrink-0 mt-0.5 ${sc.color}`}>
                  <Icon className="w-3 h-3" />
                </div>
                <div>
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold ${
                        isActive ? "text-[#00E5FF]" : "text-slate-200"
                      }`}
                    >
                      {sc.label}
                    </span>
                    {isActive && (
                      <span className="w-1.5 h-1.5 rounded-full bg-[#00E5FF] animate-ping" />
                    )}
                  </div>
                  <p className="text-[10px] text-slate-400 font-normal line-clamp-1 mt-0.5">
                    {sc.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Component Health & Camera Preset Isolation */}
      <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel">
        <div className="flex items-center gap-1.5 pb-2 mb-2 border-b border-industrial-700/40">
          <Layers className="w-4 h-4 text-[#00E5FF]" />
          <h3 className="font-hud text-xs font-bold text-slate-200 uppercase tracking-wider">
            Sub-Assembly Isolation
          </h3>
        </div>

        <div className="space-y-1">
          {components.map((c) => {
            const isSelected = selectedComponent === c.id;
            return (
              <button
                key={c.id}
                onClick={() => {
                  if (isSelected) {
                    setSelectedComponent(null);
                    setCameraPreset("isometric");
                  } else {
                    setSelectedComponent(c.id);
                    setCameraPreset(c.preset);
                  }
                  soundEffects.playInspectionSound();
                }}
                className={`w-full px-2.5 py-1.5 rounded-lg border text-[11px] font-mono transition flex items-center justify-between ${
                  isSelected
                    ? "bg-[#00E5FF]/20 text-[#00E5FF] border-[#00E5FF]/60 font-semibold"
                    : "bg-slate-950/60 border-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-900"
                }`}
              >
                <span>{c.name}</span>
                <span className="text-[10px] text-slate-400 uppercase">
                  {isSelected ? "[ISOLATED]" : "INSPECT"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
