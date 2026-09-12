import React, { useState } from "react";
import { useTwin } from "../../context/TwinContext";
import { REAL_WORLD_MACHINES } from "../../data/machinesData";
import { soundEffects } from "../../utils/soundEffects";
import {
  BrainCircuit,
  AlertTriangle,
  Clock,
  Wrench,
  ShieldCheck,
  CheckCircle2,
  Send,
  Zap,
  Sparkles,
  ArrowUpRight,
} from "lucide-react";

export const AiPredictivePanel: React.FC = () => {
  const {
    telemetry,
    activeMachineId,
    createWorkOrder,
    activeScenario,
    setScenario,
  } = useTwin();

  const [isDispatched, setIsDispatched] = useState(false);

  const machine =
    REAL_WORLD_MACHINES[activeMachineId] || REAL_WORLD_MACHINES.picanol;
  const isTsudakoma = machine.id === "tsudakoma";

  // Dynamic values driven by active machine & scenario
  const isAnomaly =
    isTsudakoma ||
    activeScenario === "bearing_wear" ||
    activeScenario === "motor_overload" ||
    activeScenario === "overheating";

  const failureProbability = isTsudakoma
    ? 87
    : activeScenario === "bearing_wear"
    ? 91
    : activeScenario === "motor_overload"
    ? 78
    : activeScenario === "overheating"
    ? 94
    : 3.2;

  const rulHours = isTsudakoma
    ? 34
    : activeScenario === "bearing_wear"
    ? 28
    : activeScenario === "motor_overload"
    ? 56
    : activeScenario === "overheating"
    ? 12
    : 9120;

  const componentHealthPct = isTsudakoma
    ? 32
    : activeScenario === "bearing_wear"
    ? 24
    : activeScenario === "motor_overload"
    ? 38
    : 98;

  const targetComponent = isTsudakoma
    ? "Right Spindle Bearing Assembly"
    : activeScenario === "bearing_wear"
    ? "Spindle Roller Bearings"
    : activeScenario === "motor_overload"
    ? "Drive Motor Windings"
    : "Main Powertrain";

  const rootCauseAnalysis = isTsudakoma
    ? "Harmonic outer race defect on right spindle bearing. Vibration spectral peak at 3.2x shaft frequency (495 mm/s RMS). ISO 10816 Class II threshold exceeded."
    : activeScenario === "bearing_wear"
    ? "Severe fatigue spalling detected on inner roller race. High-frequency acoustic emission indicates lubrication dry-out."
    : activeScenario === "motor_overload"
    ? "Elevated phase current (+35%) causing stator thermal runaway. Continuous power factor degradation."
    : `${machine.name} operating within ISO 10816 Zone A optimal boundaries. Servo shedding and Sumo drive at 99.4% precision.`;

  const recommendation = isAnomaly
    ? `Replace ${targetComponent} during next scheduled maintenance window to avoid 8+ hours of unscheduled weaving stoppage.`
    : "No immediate intervention required. Maintain standard bi-weekly lubrication schedule.";

  const handleDispatch = async () => {
    soundEffects.playModeSwitch();
    await createWorkOrder(
      targetComponent,
      `AI Predictive Maintenance: ${recommendation}`,
      isAnomaly ? "HIGH" : "LOW"
    );
    setIsDispatched(true);
    setTimeout(() => setIsDispatched(false), 4000);
  };

  return (
    <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel font-sans relative overflow-hidden">
      {/* Background Ambient Glow */}
      <div
        className="absolute -top-10 -right-10 w-28 h-28 rounded-full pointer-events-none blur-3xl opacity-20"
        style={{ backgroundColor: isAnomaly ? "#ffb000" : "#00ffc8" }}
      />

      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-cyan-950/80 border border-cyan-500/40 text-[#00E5FF]">
            <BrainCircuit className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-hud text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <span>AI Maintenance Prediction</span>
              <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#00E5FF]/10 text-[#00E5FF] font-mono">
                99.2% Acc
              </span>
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Continuous Machine Condition Monitor
            </span>
          </div>
        </div>

        <span
          className={`text-[10px] font-hud uppercase px-2 py-0.5 rounded-full border flex items-center gap-1 font-bold ${
            isAnomaly
              ? "bg-amber-500/20 text-[#FFB000] border-amber-500/50 animate-pulse"
              : "bg-emerald-500/15 text-[#00FFC8] border-emerald-500/40"
          }`}
        >
          {isAnomaly ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle2 className="w-3 h-3" />}
          {isAnomaly ? "Action Needed" : "Optimal"}
        </span>
      </div>

      {/* Key Metrics: Failure Probability & RUL */}
      <div className="grid grid-cols-2 gap-2.5 my-3">
        {/* Failure Probability */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">
            Breakdown Risk
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-xl font-mono font-bold ${
                failureProbability > 70
                  ? "text-[#FF4D4D]"
                  : failureProbability > 40
                  ? "text-[#FFB000]"
                  : "text-[#00FFC8]"
              }`}
            >
              {failureProbability}%
            </span>
            <span className="text-[10px] text-slate-500 font-mono">estimated</span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                failureProbability > 70
                  ? "bg-gradient-to-r from-amber-500 to-[#FF4D4D]"
                  : "bg-gradient-to-r from-emerald-500 to-[#00FFC8]"
              }`}
              style={{ width: `${failureProbability}%` }}
            />
          </div>
        </div>

        {/* Estimated Remaining Useful Life */}
        <div className="bg-slate-950/70 p-2.5 rounded-xl border border-slate-800/80">
          <span className="text-[10px] text-slate-400 uppercase font-mono block">
            Time Until Replacement (RUL)
          </span>
          <div className="flex items-baseline gap-1.5 mt-0.5">
            <span
              className={`text-xl font-mono font-bold ${
                rulHours < 50 ? "text-[#FFB000]" : "text-[#00E5FF]"
              }`}
            >
              {rulHours < 100 ? `${rulHours} hrs` : `${Math.round(rulHours / 24)} days`}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {rulHours < 100 ? `(~${(rulHours / 24).toFixed(1)}d)` : "nominal"}
            </span>
          </div>
          <div className="w-full h-1.5 bg-slate-900 rounded-full overflow-hidden mt-1.5 border border-slate-800">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                rulHours < 50
                  ? "bg-[#FFB000]"
                  : "bg-gradient-to-r from-cyan-500 to-[#00FFC8]"
              }`}
              style={{ width: `${Math.min(100, (rulHours / 200) * 100)}%` }}
            />
          </div>
        </div>
      </div>

      {/* Target Component Health Card */}
      <div className="bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/70 font-mono text-xs mb-3">
        <div className="flex items-center justify-between mb-1">
          <span className="text-slate-400 font-semibold">{targetComponent}</span>
          <span
            className={`font-bold ${
              componentHealthPct < 50
                ? "text-[#FFB000]"
                : "text-[#00FFC8]"
            }`}
          >
            Health: {componentHealthPct}%
          </span>
        </div>
        <p className="text-[11px] text-slate-300 font-normal leading-relaxed">
          <strong className="text-white font-semibold">Identified Issue:</strong>{" "}
          {rootCauseAnalysis}
        </p>
      </div>

      {/* Prescriptive Recommendation & Dispatch Action */}
      <div className="bg-[#050f1f]/80 p-3 rounded-xl border border-cyan-500/30 text-xs font-mono">
        <div className="flex items-center gap-1.5 text-[#00E5FF] font-hud text-[11px] uppercase tracking-wider font-bold mb-1">
          <Wrench className="w-3.5 h-3.5" />
          <span>Recommended Action</span>
        </div>
        <p className="text-[11px] text-slate-300 leading-relaxed font-normal">
          {recommendation}
        </p>

        <button
          onClick={handleDispatch}
          disabled={isDispatched}
          className={`w-full mt-2.5 py-2 px-3 rounded-lg font-hud text-xs uppercase tracking-wider font-bold transition flex items-center justify-center gap-2 ${
            isDispatched
              ? "bg-emerald-500 text-black shadow-glow-emerald"
              : isAnomaly
              ? "bg-[#FFB000] hover:bg-amber-400 text-black shadow-[0_0_15px_rgba(255,176,0,0.4)]"
              : "bg-cyan-500 hover:bg-cyan-400 text-black shadow-glow-cyan"
          }`}
        >
          {isDispatched ? (
            <>
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Maintenance Task Created</span>
            </>
          ) : (
            <>
              <Send className="w-3.5 h-3.5" />
              <span>Create Maintenance Task</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
};
