import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  Cpu,
  RotateCw,
  Layers,
  Zap,
  Activity,
  AlertOctagon,
  Clock,
  ShieldCheck,
  Crosshair,
} from "lucide-react";

export const ComponentHealthGrid: React.FC = () => {
  const { displayTelemetry, selectedComponent, setSelectedComponent, setCameraPreset } = useTwin();

  const components = displayTelemetry?.components || {};

  const getCompIcon = (key: string) => {
    switch (key) {
      case "main_motor":
        return <Cpu className="w-4 h-4 text-cyan-400" />;
      case "bearings":
        return <Activity className="w-4 h-4 text-amber-400" />;
      case "drive_shaft":
        return <RotateCw className="w-4 h-4 text-blue-400" />;
      case "belt_system":
        return <Layers className="w-4 h-4 text-teal-400" />;
      case "loom_section":
        return <RotateCw className="w-4 h-4 text-indigo-400" />;
      case "power_unit":
        return <Zap className="w-4 h-4 text-emerald-400" />;
      default:
        return <Cpu className="w-4 h-4 text-cyan-400" />;
    }
  };

  const getStatusBadge = (status: string, isFailing: boolean) => {
    if (isFailing || status === "Critical") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-hud uppercase rounded bg-red-500/20 text-red-300 border border-red-500/40 animate-pulse flex items-center gap-1">
          <AlertOctagon className="w-3 h-3 text-red-400" />
          Critical Fault
        </span>
      );
    }
    if (status === "Warning") {
      return (
        <span className="px-2 py-0.5 text-[10px] font-hud uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
          <Clock className="w-3 h-3 text-amber-400" />
          Warning / Due
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 text-[10px] font-hud uppercase rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3 text-emerald-400" />
        Optimal
      </span>
    );
  };

  const handleSelect = (key: string) => {
    if (selectedComponent === key) {
      setSelectedComponent(null);
      setCameraPreset("isometric");
    } else {
      setSelectedComponent(key);
      if (key === "main_motor") setCameraPreset("motor");
      else if (key === "bearings") setCameraPreset("bearings");
      else if (key === "drive_shaft") setCameraPreset("bearings");
      else if (key === "belt_system") setCameraPreset("belt");
      else if (key === "loom_section") setCameraPreset("loom");
      else if (key === "power_unit") setCameraPreset("isometric");
    }
  };

  const compKeys = Object.keys(components);

  return (
    <div className="glass-panel rounded-2xl p-5 border border-industrial-700/60 shadow-panel flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40 mb-4">
        <div>
          <h2 className="text-sm tracking-wider text-cyan-300 uppercase font-bold flex items-center gap-2">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Detailed Component Health Analysis
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Component Health &bull; Wear Level &bull; Time Until Replacement
          </p>
        </div>
        <span className="text-[11px] px-2 py-1 rounded bg-industrial-800 border border-industrial-700 text-slate-300">
          6 Monitored Components
        </span>
      </div>

      {/* Grid of 6 Components */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {compKeys.map((key) => {
          const comp = components[key];
          const isSelected = selectedComponent === key;
          const isFailing = comp.is_failing || comp.health_score < 50;

          return (
            <div
              key={key}
              onClick={() => handleSelect(key)}
              className={`p-3.5 rounded-xl border transition cursor-pointer relative overflow-hidden flex flex-col justify-between ${isFailing
                  ? "bg-red-950/30 border-red-500/70 shadow-glow-red"
                  : isSelected
                    ? "bg-cyan-950/40 border-cyan-400/80 shadow-glow-cyan"
                    : "bg-industrial-900/60 border-industrial-700/50 hover:border-industrial-500/80 hover:bg-industrial-800/40"
                }`}
            >
              {/* Top Row: Name & Status */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-industrial-800/80 border border-industrial-700/60">
                    {getCompIcon(key)}
                  </div>
                  <div>
                    <h4 className="text-xs font-semibold text-slate-100 tracking-wide">
                      {comp.name || key}
                    </h4>
                    <span className="text-[10px] text-slate-400">
                      {(comp.temperature ?? 32).toFixed(1)}°C | {(comp.vibration ?? 75).toFixed(1)} mm/s
                    </span>
                  </div>
                </div>
                {getStatusBadge(comp.status || "Healthy", isFailing)}
              </div>

              {/* Health Score & Progress Bar */}
              <div className="my-2">
                <div className="flex items-center justify-between text-[11px] mb-1">
                  <span className="text-slate-400">Health Index</span>
                  <span
                    className={`font-extrabold ${(comp.health_score ?? 100) > 75
                        ? "text-emerald-400"
                        : (comp.health_score ?? 100) > 50
                          ? "text-amber-400"
                          : "text-red-400"
                      }`}
                  >
                    {(comp.health_score ?? 100).toFixed(1)}%
                  </span>
                </div>
                <div className="h-1.5 w-full bg-industrial-950 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${(comp.health_score ?? 100) > 75
                        ? "bg-emerald-500 shadow-glow-emerald"
                        : (comp.health_score ?? 100) > 50
                          ? "bg-amber-500 shadow-glow-amber"
                          : "bg-red-500 shadow-glow-red"
                      }`}
                    style={{ width: `${Math.max(5, comp.health_score ?? 100)}%` }}
                  />
                </div>
              </div>

              {/* RUL & Risk Score Metrics */}
              <div className="grid grid-cols-2 gap-2 pt-2 border-t border-industrial-800/80 text-[11px]">
                <div className="bg-industrial-950/60 p-2 rounded-lg border border-industrial-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <Clock className="w-3 h-3 text-cyan-400" />
                    <span>Est. Life Remaining</span>
                  </div>
                  <div className="text-xs font-bold text-cyan-300 mt-0.5">
                    {comp.remaining_useful_life_days ?? 45}d{" "}
                    <span className="text-[10px] text-slate-400 font-normal">
                      ({comp.remaining_useful_life_hours ?? 1080}h)
                    </span>
                  </div>
                </div>

                <div className="bg-industrial-950/60 p-2 rounded-lg border border-industrial-800">
                  <div className="text-[10px] text-slate-500 uppercase flex items-center gap-1">
                    <AlertOctagon className="w-3 h-3 text-amber-400" />
                    <span>Breakdown Risk</span>
                  </div>
                  <div className={`text-xs font-bold mt-0.5 ${(comp.failure_probability ?? 0) > 0.4 ? "text-red-400" : "text-slate-300"
                    }`}>
                    {((comp.failure_probability ?? 0) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Maintenance Status SOP & Isolate Button */}
              <div className="mt-2.5 flex items-center justify-between text-[10px]">
                <span className="text-slate-400 truncate max-w-[170px]" title={comp.maintenance_status}>
                  {comp.maintenance_status || "Routine lubrication"}
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelect(key);
                  }}
                  className={`px-2 py-0.5 rounded text-[10px] font-medium uppercase flex items-center gap-1 transition ${isSelected
                      ? "bg-cyan-500 text-industrial-950"
                      : "bg-industrial-800 text-cyan-300 hover:bg-industrial-700"
                    }`}
                >
                  <Crosshair className="w-3 h-3" />
                  {isSelected ? "Isolated" : "Isolate Component"}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
