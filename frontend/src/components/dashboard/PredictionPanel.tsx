import React from "react";
import { useTwin } from "../../context/TwinContext";
import {
  BrainCircuit,
  AlertOctagon,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Clock,
  Sparkles,
  ArrowRight,
} from "lucide-react";

export const PredictionPanel: React.FC = () => {
  const { telemetry, createWorkOrder } = useTwin();

  const pred = telemetry?.ai_prediction;
  const status = pred?.status || "Healthy";
  const confidence = (pred?.confidence ?? 0.95) * 100;
  const failProb = pred?.failure_probability ?? 0;
  const riskPct = pred?.risk_percentage ?? 0;
  const rulHours = pred?.remaining_useful_life_hours ?? 1000;
  const probs = pred?.probabilities || { Healthy: 0.95, Warning: 0.04, Critical: 0.01 };

  const isCritical = status === "Critical";
  const isWarning = status === "Warning";

  const statusBadgeColor = isCritical
    ? "bg-cyber-crimson/20 border-cyber-crimson text-cyber-crimson shadow-glow-crimson"
    : isWarning
    ? "bg-cyber-amber/20 border-cyber-amber text-cyber-amber shadow-glow-amber"
    : "bg-cyber-emerald/20 border-cyber-emerald text-cyber-emerald shadow-glow-emerald";

  const StatusIcon = isCritical
    ? AlertOctagon
    : isWarning
    ? AlertTriangle
    : ShieldCheck;

  return (
    <div className="glass-panel rounded-2xl p-5 border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-industrial-700/40">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-5 h-5 text-cyan-400" />
          <h2 className="font-hud text-sm tracking-wider text-cyan-300 uppercase font-bold">
            AI Health Prediction & Diagnostics
          </h2>
        </div>
        <div className="flex items-center gap-1.5 bg-industrial-800/80 px-2.5 py-1 rounded-lg border border-industrial-700">
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
          <span className="text-xs font-mono text-slate-300">
            Confidence: <b className="text-white">{confidence.toFixed(1)}%</b>
          </span>
        </div>
      </div>

      {/* Prediction Status & Failure Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 my-4 items-center">
        {/* Status Badge & Primary State */}
        <div className="md:col-span-4 flex flex-col items-center justify-center p-4 rounded-xl bg-industrial-950/60 border border-industrial-800">
          <div
            className={`p-3 rounded-2xl border mb-2 flex items-center justify-center ${statusBadgeColor}`}
          >
            <StatusIcon className="w-8 h-8" />
          </div>
          <span className="text-xs font-hud text-slate-400 tracking-wider">
            PREDICTED STATE
          </span>
          <span className="font-hud text-2xl font-black tracking-wide text-white uppercase mt-0.5">
            {status}
          </span>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 font-mono mt-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            <span>RUL: <b className="text-cyan-300">{rulHours.toFixed(1)}h</b></span>
          </div>
        </div>

        {/* Probability Distribution & Risk Bars */}
        <div className="md:col-span-8 space-y-2.5">
          {/* Failure Risk Meter */}
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-300 flex items-center gap-1">
                Failure Risk Probability
              </span>
              <span
                className={`font-bold ${
                  failProb > 50
                    ? "text-cyber-crimson"
                    : failProb > 25
                    ? "text-cyber-amber"
                    : "text-cyber-emerald"
                }`}
              >
                {failProb.toFixed(1)}%
              </span>
            </div>
            <div className="w-full bg-industrial-950 rounded-full h-2.5 overflow-hidden border border-industrial-800">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  failProb > 50
                    ? "bg-cyber-crimson shadow-glow-crimson"
                    : failProb > 25
                    ? "bg-cyber-amber shadow-glow-amber"
                    : "bg-cyber-emerald"
                }`}
                style={{ width: `${Math.max(2, failProb)}%` }}
              />
            </div>
          </div>

          {/* Model Class Probabilities */}
          <div className="grid grid-cols-3 gap-2 pt-1 text-center font-mono text-xs">
            <div className="p-2 rounded-lg bg-industrial-950/70 border border-emerald-950/60">
              <span className="text-[10px] text-slate-400 block">HEALTHY</span>
              <span className="font-bold text-cyber-emerald">
                {((probs["Healthy"] || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-industrial-950/70 border border-amber-950/60">
              <span className="text-[10px] text-slate-400 block">WARNING</span>
              <span className="font-bold text-cyber-amber">
                {((probs["Warning"] || 0) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-2 rounded-lg bg-industrial-950/70 border border-red-950/60">
              <span className="text-[10px] text-slate-400 block">CRITICAL</span>
              <span className="font-bold text-cyber-crimson">
                {((probs["Critical"] || 0) * 100).toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* AI Root-Cause Explainability Box ("WHY") */}
      <div className="rounded-xl p-3.5 bg-industrial-950/80 border border-cyan-900/40 mt-1">
        <div className="flex items-center gap-1.5 mb-1.5 text-xs font-hud text-cyan-300 font-semibold tracking-wide">
          <HelpCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>EXPLAINABLE AI DIAGNOSTIC REASONING:</span>
        </div>
        <p className="text-xs text-slate-300 font-sans leading-relaxed">
          {pred?.explanation ||
            "Loom sensors are operating synchronously within acceptable ISO 10816 Class II vibration tolerances and nominal thermal thresholds."}
        </p>
      </div>
    </div>
  );
};
