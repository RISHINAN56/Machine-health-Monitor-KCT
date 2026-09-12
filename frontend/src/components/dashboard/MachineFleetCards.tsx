import React from "react";
import { useTwin } from "../../context/TwinContext";
import { REAL_MACHINES_LIST, RealWorldMachine } from "../../data/machinesData";
import { soundEffects } from "../../utils/soundEffects";
import {
  Activity,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Gauge,
  Zap,
  Radio,
  Sparkles,
} from "lucide-react";

interface MachineFleetCardsProps {
  onSelectMachine?: (machineId: string) => void;
  compact?: boolean;
}

export const MachineFleetCards: React.FC<MachineFleetCardsProps> = ({
  onSelectMachine,
  compact = false,
}) => {
  const {
    activeMachineId,
    setActiveMachineId,
    telemetry,
    activeScenario,
    setScenario,
  } = useTwin();

  const handleCardClick = (machine: RealWorldMachine) => {
    soundEffects.playModeSwitch();
    setActiveMachineId(machine.id);
    if (onSelectMachine) {
      onSelectMachine(machine.id);
    }
    // If selecting Tsudakoma, synchronize scenario if not already customized
    if (machine.id === "tsudakoma" && activeScenario === "normal") {
      setScenario("bearing_wear");
    } else if (machine.id !== "tsudakoma" && activeScenario === "bearing_wear") {
      setScenario("normal");
    }
  };

  return (
    <section aria-label="Textile Machines Fleet Selection" className="w-full">
      {/* Fleet Header */}
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-[#00E5FF] animate-pulse" />
          <h2 className="text-xs font-hud font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
            <span>Industry 4.0 Digital Twins</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#00E5FF]/10 text-[#00E5FF] border border-[#00E5FF]/30 font-mono font-medium">
              3 Connected Looms
            </span>
          </h2>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="inline-block w-2 h-2 rounded-full bg-[#00FFC8] animate-ping" />
          <span>Real-time Telemetry Active (2s sync)</span>
        </div>
      </div>

      {/* 3-Card Grid: Compact, Equal Height, Futuristic Industry 4.0 Styling */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {REAL_MACHINES_LIST.map((m) => {
          const isSelected = activeMachineId === m.id;

          // If this machine is currently selected, display live synced telemetry from twin context
          const liveRpm =
            isSelected && telemetry?.sensors?.rpm
              ? telemetry.sensors.rpm
              : m.rpm;
          const liveTemp =
            isSelected && telemetry?.sensors?.temperature
              ? telemetry.sensors.temperature
              : m.temperature;
          const liveVib =
            isSelected && telemetry?.sensors?.vibration
              ? telemetry.sensors.vibration
              : m.vibration;
          const liveHealth =
            isSelected && telemetry?.overall_health_score !== undefined
              ? telemetry.overall_health_score
              : m.healthScore;
          const liveEfficiency =
            isSelected && telemetry?.oee_percentage !== undefined
              ? telemetry.oee_percentage
              : m.efficiency;

          const isHealthy = m.status === "Healthy";

          return (
            <div
              key={m.id}
              onClick={() => handleCardClick(m)}
              onMouseEnter={() => soundEffects.playHoverTick()}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  handleCardClick(m);
                }
              }}
              className={`group relative rounded-xl transition-all duration-300 cursor-pointer overflow-hidden flex flex-col justify-between border text-left select-none ${
                isSelected
                  ? "bg-[#050e1e]/95 border-[#00E5FF] shadow-[0_0_24px_rgba(0,229,255,0.45)] ring-1 ring-[#00E5FF]/80 -translate-y-1 scale-[1.015]"
                  : "bg-[#0b1222]/80 border-slate-800/80 hover:border-[#00E5FF]/70 hover:shadow-[0_0_20px_rgba(0,229,255,0.28)] hover:-translate-y-1 hover:scale-[1.012] backdrop-blur-md"
              } p-4`}
              style={{ minHeight: compact ? "170px" : "198px" }}
            >
              {/* Active Pulsing Indicator Top Border */}
              {isSelected && (
                <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-[#00E5FF] via-[#00FFC8] to-[#00E5FF] animate-pulse" />
              )}

              {/* Ambient Glow for Active Machine */}
              {isSelected && (
                <div
                  className="absolute -top-10 -right-10 w-32 h-32 rounded-full pointer-events-none blur-3xl opacity-25"
                  style={{ backgroundColor: m.accentColor }}
                />
              )}

              {/* Top Row: Manufacturer Tag & Status Badge */}
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-mono tracking-wider font-semibold uppercase px-2 py-0.5 rounded bg-slate-900/90 text-slate-300 border border-slate-700/60">
                      {m.manufacturer}
                    </span>
                    <span className="text-[9px] font-mono text-slate-400">
                      {m.type}
                    </span>
                  </div>

                  {/* Status Badge */}
                  {isHealthy ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-hud font-bold tracking-wider uppercase bg-emerald-500/15 text-[#00FFC8] border border-emerald-500/40">
                      <CheckCircle2 className="w-3 h-3 text-[#00FFC8]" />
                      Healthy
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-hud font-bold tracking-wider uppercase bg-amber-500/20 text-[#FFB000] border border-amber-500/50 animate-pulse">
                      <AlertTriangle className="w-3 h-3 text-[#FFB000]" />
                      Warning
                    </span>
                  )}
                </div>

                {/* Machine Name & Headline */}
                <div className="flex items-baseline justify-between mt-1">
                  <h3
                    className={`font-hud text-sm font-extrabold tracking-wide uppercase transition-colors ${
                      isSelected
                        ? "text-white text-glow-cyan"
                        : "text-slate-100 group-hover:text-[#00E5FF]"
                    }`}
                  >
                    {m.name}
                  </h3>
                </div>

                {/* Health Score Radial Bar */}
                <div className="mt-2.5 mb-3">
                  <div className="flex items-center justify-between text-[11px] font-mono mb-1">
                    <span className="text-slate-400 flex items-center gap-1">
                      <Activity className="w-3 h-3 text-slate-400" />
                      <span>Health Score</span>
                    </span>
                    <span
                      className={`font-extrabold tracking-wider font-mono ${
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
                  <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
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
              </div>

              {/* Real-time Metric Chips Grid: RPM, Temp, Vibration, Efficiency */}
              <div className="grid grid-cols-4 gap-1.5 pt-2 border-t border-slate-800/80 font-mono text-center">
                {/* RPM */}
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 group-hover:border-slate-700/80 transition">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium">
                    RPM
                  </span>
                  <span className="text-xs font-bold text-slate-100 font-mono">
                    {liveRpm.toFixed(0)}
                  </span>
                </div>

                {/* Temp */}
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 group-hover:border-slate-700/80 transition">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium flex items-center justify-center gap-0.5">
                    <Flame className="w-2.5 h-2.5 text-slate-400" />
                    <span>Temp</span>
                  </span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      liveTemp > 45 ? "text-[#FFB000]" : "text-slate-100"
                    }`}
                  >
                    {liveTemp.toFixed(1)}°
                  </span>
                </div>

                {/* Vibration */}
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 group-hover:border-slate-700/80 transition">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium flex items-center justify-center gap-0.5">
                    <Gauge className="w-2.5 h-2.5 text-slate-400" />
                    <span>Vib</span>
                  </span>
                  <span
                    className={`text-xs font-bold font-mono ${
                      liveVib > 300 ? "text-[#FFB000]" : "text-slate-100"
                    }`}
                  >
                    {liveVib.toFixed(0)}
                  </span>
                </div>

                {/* Efficiency */}
                <div className="bg-slate-950/70 p-1.5 rounded-lg border border-slate-800/80 group-hover:border-slate-700/80 transition">
                  <span className="text-[9px] text-slate-400 uppercase block font-medium flex items-center justify-center gap-0.5">
                    <Zap className="w-2.5 h-2.5 text-slate-400" />
                    <span>OEE</span>
                  </span>
                  <span className="text-xs font-bold text-[#00E5FF] font-mono">
                    {liveEfficiency.toFixed(1)}%
                  </span>
                </div>
              </div>

              {/* Bottom Card Footer with Selection Cue */}
              <div className="mt-2.5 flex items-center justify-between text-[10px] font-mono pt-1.5 text-slate-400">
                <span className="flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-[#00E5FF]" />
                  <span className="truncate max-w-[130px]">{m.badgeText}</span>
                </span>
                <span
                  className={`font-semibold uppercase tracking-wider ${
                    isSelected ? "text-[#00E5FF]" : "text-slate-500 group-hover:text-slate-300"
                  }`}
                >
                  {isSelected ? "3D TWIN LOADED" : "CLICK TO VIEW"}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};
