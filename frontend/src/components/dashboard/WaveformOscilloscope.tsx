import React, { useEffect, useRef } from "react";
import { useTwin } from "../../context/TwinContext";
import { Activity, Radio } from "lucide-react";

export const WaveformOscilloscope: React.FC = () => {
  const { telemetry } = useTwin();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);

  // Keep references to live values without re-binding the RAF loop
  const telemetryRef = useRef(telemetry);
  useEffect(() => {
    telemetryRef.current = telemetry;
  }, [telemetry]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let phase = 0;
    const historyPoints: number[] = new Array(150).fill(0);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      const t = telemetryRef.current;

      const rpm = t?.sensors.rpm ?? 650;
      const vib = t?.sensors.vibration ?? 100;
      const load = t?.sensors.motor_load ?? 300;

      // Calculate vibration normalized severity (0.0 to 2.5)
      const severity = Math.min(2.5, vib / 400.0);
      const isCritical = vib >= 750;
      const isWarning = vib >= 450;

      // Generate next waveform sample based on physical physics
      // Fundamental shaft frequency + 3rd harmonic bearing noise + beat-up impulse
      phase += (rpm / 60) * 0.18;
      const fundamental = Math.sin(phase) * 0.45;
      const bearingHarmonic = Math.sin(phase * 4.3) * (severity * 0.35);
      const beatSpike =
        Math.sin(phase * 0.5) > 0.85
          ? (Math.random() - 0.5) * severity * 0.8
          : 0;

      const newSample = fundamental + bearingHarmonic + beatSpike;
      historyPoints.push(newSample);
      if (historyPoints.length > width) {
        historyPoints.shift();
      }

      // 1. Clear background with slight fade for phosphorescent persistence
      ctx.fillStyle = "rgba(4, 7, 14, 0.35)";
      ctx.fillRect(0, 0, width, height);

      // 2. Draw CRT Oscilloscope Grid
      ctx.strokeStyle = "rgba(30, 41, 59, 0.45)";
      ctx.lineWidth = 1;
      const gridSize = 24;

      ctx.beginPath();
      for (let x = 0; x <= width; x += gridSize) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
      }
      for (let y = 0; y <= height; y += gridSize) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
      }
      ctx.stroke();

      // Center baseline crosshair
      ctx.strokeStyle = "rgba(56, 189, 248, 0.18)";
      ctx.beginPath();
      ctx.moveTo(0, height / 2);
      ctx.lineTo(width, height / 2);
      ctx.stroke();

      // 3. Draw Waveform Trace
      ctx.beginPath();
      const centerY = height / 2;
      const ampScale = (height / 2.6) * Math.max(0.3, Math.min(1.8, severity));

      for (let i = 0; i < historyPoints.length; i++) {
        const x = (i / historyPoints.length) * width;
        const y = centerY - historyPoints[i] * ampScale;
        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      // Trace color depending on vibration state
      const traceColor = isCritical
        ? "#ef4444"
        : isWarning
        ? "#f59e0b"
        : "#00f0ff";

      ctx.strokeStyle = traceColor;
      ctx.lineWidth = isCritical ? 2.5 : 2;
      ctx.shadowColor = traceColor;
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      // 4. Scanning vertical sweep line
      const sweepX = (phase * 15) % width;
      const sweepGrad = ctx.createLinearGradient(sweepX - 20, 0, sweepX + 2, 0);
      sweepGrad.addColorStop(0, "transparent");
      sweepGrad.addColorStop(1, traceColor + "55");
      ctx.fillStyle = sweepGrad;
      ctx.fillRect(sweepX - 20, 0, 20, height);

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  const vibration = telemetry?.sensors.vibration ?? 0;
  const vppEstimate = (vibration * 0.0028).toFixed(3);

  return (
    <div className="glass-panel rounded-2xl p-4 border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-industrial-700/40">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400" />
          <h3 className="font-hud text-xs tracking-wider text-cyan-200 uppercase font-bold">
            Live Vibration & Acoustic Oscilloscope
          </h3>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <Radio className="w-3 h-3 text-cyber-emerald animate-pulse" /> 10 kHz DSP
          </span>
          <span className="text-cyan-300 font-bold">Vpp: {vppEstimate} V</span>
        </div>
      </div>

      {/* CRT Canvas Container */}
      <div className="relative rounded-xl overflow-hidden border border-cyan-900/40 bg-industrial-950">
        <canvas
          ref={canvasRef}
          width={640}
          height={130}
          className="w-full h-[120px] block"
        />
        <div className="scanline-overlay pointer-events-none" />
      </div>

      {/* Bottom status bar */}
      <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 mt-2 pt-1 border-t border-industrial-800/60">
        <span>Timebase: 2.0 ms/div</span>
        <span>Sensor: Piezo Triaxial (Ch-1 Drive Shaft)</span>
        <span
          className={
            vibration >= 750
              ? "text-cyber-crimson font-bold"
              : vibration >= 450
              ? "text-cyber-amber font-bold"
              : "text-cyber-emerald"
          }
        >
          HARMONICS: {vibration >= 750 ? "CRITICAL SEVERITY" : vibration >= 450 ? "MODERATE MODULATION" : "CLEAN SINE"}
        </span>
      </div>
    </div>
  );
};
