import React from "react";
import { motion } from "framer-motion";
import {
  Activity,
  Cpu,
  ShieldCheck,
  Zap,
  ArrowRight,
  Boxes,
  Database,
  Radio,
  Layers,
  Wrench,
} from "lucide-react";
import { useTwin } from "../../context/TwinContext";
import { CanvasContainer } from "../3d/CanvasContainer";

interface LandingHeroProps {
  onEnterConsole: () => void;
}

export const LandingHero: React.FC<LandingHeroProps> = ({ onEnterConsole }) => {
  const { telemetry, isConnected } = useTwin();

  const health = telemetry?.overall_health_score ?? 100;
  const status = telemetry?.overall_status ?? "Healthy";

  return (
    <div className="space-y-12 pb-16">
      {/* Hero Header Section */}
      <section className="relative pt-6 sm:pt-10 flex flex-col items-center text-center max-w-4xl mx-auto px-4">
        {/* Industry 4.0 Cyber Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 text-xs font-hud tracking-widest uppercase mb-6 shadow-glow-cyan"
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          Next-Gen Industrial IoT & Digital Twin Platform
        </motion.div>

        {/* Primary Punchy Title */}
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-tight uppercase"
        >
          MHM
        </motion.h1>

        {/* Subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15 }}
          className="text-xl sm:text-2xl font-bold tracking-wide text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 text-glow-cyan uppercase mt-2"
        >
          3D Visualization of Machine Health Monitoring
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-300 text-sm sm:text-base max-w-2xl mt-4 font-normal leading-relaxed"
        >
          Advanced real-time digital twin platform for industrial machinery. Engineered for engineering students, faculty, and industry professionals—featuring physics-based 3D kinematics, ISO 10816 vibration analysis, AI failure prediction, and predictive maintenance.
        </motion.p>

        {/* CTA Launch Button & Quick Telemetry Indicators */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3 }}
          className="flex flex-wrap items-center justify-center gap-4 mt-8"
        >
          <button
            onClick={onEnterConsole}
            className="px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-industrial-950 font-medium text-sm tracking-wider uppercase transition-all transform hover:scale-105 shadow-glow-cyan flex items-center gap-2.5"
          >
            <span>Launch 3D Machine Visualization</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Live Headline Telemetry Strip */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full mt-10 max-w-3xl"
        >
          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">SYSTEM STATUS</span>
            <span className={`text-base font-bold uppercase mt-0.5 block ${status === "Healthy" ? "text-cyber-emerald" : status === "Warning" ? "text-cyber-amber" : "text-cyber-crimson"
              }`}>
              {status}
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">MACHINE HEALTH SCORE</span>
            <span className="text-base font-extrabold text-cyan-300 mt-0.5 block">
              {health.toFixed(0)}% OPTIMAL
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">SPINDLE SPEED</span>
            <span className="text-base font-bold text-slate-100 mt-0.5 block">
              {(telemetry?.sensors?.rpm ?? 650).toFixed(0)} RPM
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-semibold text-slate-400 uppercase block">TELEMETRY STREAM</span>
            <span className="text-base font-bold text-emerald-400 mt-0.5 block">
              10 Hz Live
            </span>
          </div>
        </motion.div>
      </section>

      {/* Hero 3D Interactive Showcase */}
      <section className="max-w-[1500px] mx-auto px-4 h-[550px]">
        <div className="relative w-full h-full rounded-3xl overflow-hidden border border-cyan-500/30 shadow-2xl">
          <CanvasContainer />
        </div>
      </section>

      {/* Feature Pillar Architecture Grid */}
      <section className="max-w-[1400px] mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4">
        {/* Pillar 1 */}
        <div className="glass-panel-interactive p-6 rounded-2xl border border-industrial-700/60">
          <div className="w-12 h-12 rounded-xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 mb-4 shadow-glow-cyan">
            <Boxes className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Real-Time Sensor Data
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Continuous 10 Hz acquisition across triaxial vibration analysis, thermal stator thermocouples, RPM monitoring, and motor armature current.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-panel-interactive p-6 rounded-2xl border border-industrial-700/60">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4 shadow-glow-emerald">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Component Health Analysis
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            Multi-factor Remaining Useful Life (RUL) estimation, Weibull hazard failure probability modeling, and sub-assembly degradation tracking.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-panel-interactive p-6 rounded-2xl border border-industrial-700/60">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 shadow-glow-amber">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="text-lg font-semibold text-slate-100 mb-2">
            Predictive Maintenance
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed font-sans">
            AI failure prediction coupled with ISO 10816 standards, explainable root-cause diagnostics, and automated prescriptive maintenance work orders.
          </p>
        </div>
      </section>
    </div>
  );
};
