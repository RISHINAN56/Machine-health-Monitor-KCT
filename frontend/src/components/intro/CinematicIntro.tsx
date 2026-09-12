import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Cpu, ShieldCheck, Zap, Activity, ChevronRight, Volume2, VolumeX } from "lucide-react";
import { soundEffects } from "../../utils/soundEffects";

interface CinematicIntroProps {
  onComplete: () => void;
}

const BOOT_STEPS = [
  { label: "MHM KERNEL v4.8 INITIALIZING", progress: 15 },
  { label: "ESTABLISHING HIGH-FREQUENCY 10Hz TELEMETRY STREAM", progress: 38 },
  { label: "CALIBRATING OMNIVERSE DIGITAL TWIN MATRIX", progress: 62 },
  { label: "SYNCHRONIZING ISO 10816 VIBRATION & THERMAL DIAGNOSTICS", progress: 85 },
  { label: "ALL INDUSTRIAL SYSTEMS OPTIMAL • DIGITAL TWIN READY", progress: 100 },
];

export const CinematicIntro: React.FC<CinematicIntroProps> = ({ onComplete }) => {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [progress, setProgress] = useState(10);
  const [soundEnabled, setSoundEnabled] = useState(true);

  useEffect(() => {
    soundEffects.enabled = soundEnabled;
  }, [soundEnabled]);

  useEffect(() => {
    // Play startup deep drone on mount
    soundEffects.playStartupSound();

    const stepInterval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        if (prev < BOOT_STEPS.length - 1) {
          const next = prev + 1;
          setProgress(BOOT_STEPS[next].progress);
          soundEffects.playHoverTick();
          return next;
        }
        return prev;
      });
    }, 1100);

    const completionTimer = setTimeout(() => {
      soundEffects.playSystemOnline();
      setTimeout(onComplete, 700);
    }, 5800);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" || e.key === "Enter" || e.key === " ") {
        onComplete();
      }
    };
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      clearInterval(stepInterval);
      clearTimeout(completionTimer);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [onComplete]);

  return (
    <motion.div
      initial={{ opacity: 1 }}
      exit={{ opacity: 0, transition: { duration: 0.8, ease: "easeInOut" } }}
      className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#020617] text-white overflow-hidden select-none font-sans"
    >
      {/* Background Cyber Grid & Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(6,182,212,0.12)_0%,rgba(2,6,23,0.95)_75%,#020617_100%)] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: `linear-gradient(to right, rgba(0, 240, 255, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(0, 240, 255, 0.1) 1px, transparent 1px)`,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Futuristic Moving Scan Line */}
      <motion.div
        animate={{ y: ["-100vh", "100vh"] }}
        transition={{ repeat: Infinity, duration: 2.8, ease: "linear" }}
        className="absolute inset-x-0 h-32 bg-gradient-to-b from-transparent via-cyan-500/10 to-transparent pointer-events-none"
      />

      {/* Top Left Status & Controls */}
      <div className="absolute top-6 left-6 flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-industrial-900/80 border border-cyan-500/30 text-[11px] font-mono tracking-widest text-cyan-400 backdrop-blur-md">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>SYSTEM ACTIVATION SEQUENCE</span>
        </div>
      </div>

      {/* Top Right Sound & Skip Controls */}
      <div className="absolute top-6 right-6 flex items-center gap-3">
        <button
          onClick={() => {
            const next = !soundEnabled;
            setSoundEnabled(next);
            soundEffects.enabled = next;
          }}
          className="p-2 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-300 transition backdrop-blur-md"
          title={soundEnabled ? "Mute Audio" : "Unmute Audio"}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4 text-cyan-400" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
        </button>

        <button
          onClick={onComplete}
          className="px-4 py-2 rounded-xl bg-industrial-900/90 border border-cyan-500/40 hover:border-cyan-400 text-xs font-semibold tracking-wider uppercase text-cyan-300 hover:text-white transition flex items-center gap-1.5 shadow-glow-cyan backdrop-blur-md"
        >
          <span>Skip [Esc]</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Main Center Holographic Presentation */}
      <div className="relative z-10 flex flex-col items-center text-center max-w-xl px-6">
        {/* Holographic Glowing Emblem */}
        <div className="relative mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
            className="absolute -inset-6 rounded-full border border-dashed border-cyan-400/30"
          />
          <motion.div
            animate={{ rotate: -360 }}
            transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
            className="absolute -inset-10 rounded-full border border-cyan-500/20"
          />
          <div className="relative w-24 h-24 rounded-2xl bg-gradient-to-br from-cyan-500/20 via-blue-600/30 to-industrial-950 border border-cyan-400/60 flex items-center justify-center shadow-[0_0_50px_rgba(6,182,212,0.4)] backdrop-blur-xl">
            <Cpu className="w-12 h-12 text-cyan-300 animate-pulse" />
          </div>
        </div>

        {/* Brand Title */}
        <motion.h1
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-5xl font-extrabold tracking-wider bg-gradient-to-r from-white via-cyan-200 to-cyan-400 bg-clip-text text-transparent mb-2"
        >
          MHM
        </motion.h1>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="text-xs sm:text-sm font-semibold tracking-widest text-cyan-300 uppercase mb-8"
        >
          3D Visualization of Machine Health Monitoring
        </motion.p>

        {/* Real-time Boot Console Terminal Log */}
        <div className="w-full bg-industrial-950/80 border border-industrial-700/60 rounded-xl p-4 backdrop-blur-md shadow-2xl mb-6">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mb-2.5 border-b border-industrial-800 pb-2">
            <span className="flex items-center gap-1.5 text-cyan-300 font-bold">
              <Activity className="w-3.5 h-3.5 animate-spin" />
              OMNIVERSE INITIALIZATION
            </span>
            <span className="text-cyan-400 font-bold">{progress}%</span>
          </div>

          <div className="h-6 flex items-center justify-center">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStepIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
                className="text-xs font-mono font-medium text-slate-200 tracking-wide flex items-center gap-2"
              >
                <Zap className="w-3.5 h-3.5 text-amber-400" />
                <span>{BOOT_STEPS[currentStepIndex].label}</span>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Progress Bar with Cyan Specular Glow */}
          <div className="w-full h-1.5 rounded-full bg-industrial-800 overflow-hidden mt-3 relative">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 via-cyan-400 to-emerald-400 shadow-[0_0_12px_rgba(6,182,212,0.8)]"
              style={{ width: `${progress}%` }}
              transition={{ ease: "easeOut", duration: 0.4 }}
            />
          </div>
        </div>

        {/* Feature Highlights Pills */}
        <div className="flex flex-wrap items-center justify-center gap-2 text-[11px] font-mono text-slate-400">
          <span className="px-2.5 py-1 rounded-lg bg-industrial-900/60 border border-industrial-800 flex items-center gap-1">
            <ShieldCheck className="w-3 h-3 text-emerald-400" /> ISO 10816 Grade
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-industrial-900/60 border border-industrial-800 flex items-center gap-1">
            <Zap className="w-3 h-3 text-cyan-400" /> 10Hz Real-Time Twin
          </span>
          <span className="px-2.5 py-1 rounded-lg bg-industrial-900/60 border border-industrial-800 flex items-center gap-1">
            <Activity className="w-3 h-3 text-purple-400" /> Omniverse Lighting
          </span>
        </div>
      </div>
    </motion.div>
  );
};
