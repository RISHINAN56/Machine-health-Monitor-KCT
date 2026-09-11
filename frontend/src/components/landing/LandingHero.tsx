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
          className="text-4xl sm:text-6xl font-black font-hud tracking-tight text-white leading-tight uppercase"
        >
          Industrial <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-blue-500 text-glow-cyan">Digital Twin</span> Platform
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2 }}
          className="text-slate-300 text-sm sm:text-base max-w-2xl mt-4 font-sans leading-relaxed"
        >
          Continuous spatial 3D kinematic monitoring, physics-informed ISO 10816 vibration health indexing, and explainable AI-driven predictive maintenance for advanced industrial textile looms.
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
            className="px-8 py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-industrial-950 font-hud text-sm font-black tracking-wider uppercase transition-all transform hover:scale-105 shadow-glow-cyan flex items-center gap-2.5"
          >
            <span>Launch Mission Control Twin</span>
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
            <span className="text-[10px] font-hud text-slate-400 uppercase block">SYSTEM STATUS</span>
            <span className={`text-base font-hud font-bold uppercase mt-0.5 block ${
              status === "Healthy" ? "text-cyber-emerald" : status === "Warning" ? "text-cyber-amber" : "text-cyber-crimson"
            }`}>
              {status}
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-hud text-slate-400 uppercase block">ISO HEALTH SCORE</span>
            <span className="text-base font-hud font-bold text-cyan-300 mt-0.5 block">
              {health.toFixed(0)}% OPTIMAL
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-hud text-slate-400 uppercase block">SPINDLE SPEED</span>
            <span className="text-base font-hud font-bold text-slate-100 mt-0.5 block">
              {telemetry?.sensors.rpm.toFixed(0) || 650} RPM
            </span>
          </div>

          <div className="glass-panel p-3 rounded-xl border border-industrial-700/60 text-left">
            <span className="text-[10px] font-hud text-slate-400 uppercase block">DSP LATENCY</span>
            <span className="text-base font-hud font-bold text-emerald-400 mt-0.5 block">
              0.08s (10 Hz)
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
          <h3 className="font-hud text-lg font-bold text-slate-100 mb-2">
            Spatial 3D Digital Twin
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            WebGL / Three.js procedural loom model with dynamic RPM shaft kinematics, reciprocating reed animation, structural vibration shake physics, and real-time state glow shaders.
          </p>
        </div>

        {/* Pillar 2 */}
        <div className="glass-panel-interactive p-6 rounded-2xl border border-industrial-700/60">
          <div className="w-12 h-12 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300 mb-4 shadow-glow-emerald">
            <Cpu className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-lg font-bold text-slate-100 mb-2">
            Explainable AI Diagnostics
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Machine learning classifier coupled with physical ISO 10816 vibration standards. Generates probabilistic failure forecasts and natural-language explanations of WHY anomalies occur.
          </p>
        </div>

        {/* Pillar 3 */}
        <div className="glass-panel-interactive p-6 rounded-2xl border border-industrial-700/60">
          <div className="w-12 h-12 rounded-xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 mb-4 shadow-glow-amber">
            <Wrench className="w-6 h-6" />
          </div>
          <h3 className="font-hud text-lg font-bold text-slate-100 mb-2">
            Prescriptive Maintenance
          </h3>
          <p className="text-sm text-slate-300 leading-relaxed">
            Automated work order generation, execution window countdowns, active alarm deduplication, and single-click technician dispatching before catastrophic downtime occurs.
          </p>
        </div>
      </section>
    </div>
  );
};
