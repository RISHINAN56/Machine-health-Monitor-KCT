import React from "react";
import { useTwin } from "../../context/TwinContext";
import { Thermometer, Activity, Zap, Gauge } from "lucide-react";

// Reusable mini SVG Sparkline component
const Sparkline: React.FC<{
  data: number[];
  color: string;
  min: number;
  max: number;
}> = ({ data, color, min, max }) => {
  if (data.length < 2) {
    return <div className="h-8 w-full bg-industrial-950/40 rounded" />;
  }

  const width = 140;
  const height = 36;
  const padding = 2;

  const points = data
    .map((val, idx) => {
      const x = padding + (idx / (data.length - 1)) * (width - 2 * padding);
      const normalizedY = (val - min) / Math.max(1, max - min);
      const clampedY = Math.max(0, Math.min(1, normalizedY));
      const y = height - padding - clampedY * (height - 2 * padding);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width={width} height={height} className="overflow-visible">
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
    </svg>
  );
};

export const LiveSensorPanel: React.FC = () => {
  const { telemetry, history } = useTwin();

  const tempHistory = history.map((h) => h.sensors.temperature);
  const vibHistory = history.map((h) => h.sensors.vibration);
  const loadHistory = history.map((h) => h.sensors.motor_load);
  const rpmHistory = history.map((h) => h.sensors.rpm);

  const sensors = [
    {
      id: "temp",
      name: "Temperature",
      value: telemetry?.sensors.temperature ?? 0,
      unit: "°C",
      safe: 45.0,
      crit: 55.0,
      icon: Thermometer,
      history: tempHistory,
      min: 20,
      max: 80,
      zone:
        (telemetry?.sensors.temperature ?? 0) >= 55.0
          ? "CRITICAL"
          : (telemetry?.sensors.temperature ?? 0) >= 45.0
          ? "WARNING"
          : "NORMAL",
    },
    {
      id: "vib",
      name: "Vibration RMS",
      value: telemetry?.sensors.vibration ?? 0,
      unit: "mm/s",
      safe: 450.0,
      crit: 750.0,
      icon: Activity,
      history: vibHistory,
      min: 0,
      max: 1500,
      zone:
        (telemetry?.sensors.vibration ?? 0) >= 750.0
          ? "ISO ZONE D"
          : (telemetry?.sensors.vibration ?? 0) >= 450.0
          ? "ISO ZONE C"
          : "ISO ZONE A/B",
    },
    {
      id: "load",
      name: "Motor Load",
      value: telemetry?.sensors.motor_load ?? 0,
      unit: "A",
      safe: 650.0,
      crit: 850.0,
      icon: Zap,
      history: loadHistory,
      min: 0,
      max: 1200,
      zone:
        (telemetry?.sensors.motor_load ?? 0) >= 850.0
          ? "OVERLOAD"
          : (telemetry?.sensors.motor_load ?? 0) >= 650.0
          ? "ELEVATED"
          : "NORMAL",
    },
    {
      id: "rpm",
      name: "Loom Speed",
      value: telemetry?.sensors.rpm ?? 0,
      unit: "RPM",
      safe: 760.0,
      crit: 900.0,
      icon: Gauge,
      history: rpmHistory,
      min: 0,
      max: 1000,
      zone:
        (telemetry?.sensors.rpm ?? 0) === 0
          ? "HALTED"
          : Math.abs((telemetry?.sensors.rpm ?? 0) - 650) > 150
          ? "UNSTABLE"
          : "SYNCHRONOUS",
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
      {sensors.map((sensor) => {
        const Icon = sensor.icon;
        const isCrit = sensor.value >= sensor.crit;
        const isWarn = !isCrit && sensor.value >= sensor.safe;

        const statusColor = isCrit
          ? "text-cyber-crimson"
          : isWarn
          ? "text-cyber-amber"
          : "text-cyber-emerald";

        const borderColor = isCrit
          ? "border-cyber-crimson/50 shadow-glow-crimson"
          : isWarn
          ? "border-cyber-amber/40 shadow-glow-amber"
          : "border-industrial-700/60";

        const sparkColor = isCrit
          ? "#ef4444"
          : isWarn
          ? "#f59e0b"
          : "#10b981";

        return (
          <div
            key={sensor.id}
            className={`glass-panel-interactive rounded-2xl p-4 border flex flex-col justify-between ${borderColor}`}
          >
            {/* Top row: Label & Icon */}
            <div className="flex items-center justify-between">
              <span className="text-xs font-hud tracking-wider text-slate-400 uppercase">
                {sensor.name}
              </span>
              <div
                className={`p-1.5 rounded-lg bg-industrial-950/70 border border-industrial-800 ${statusColor}`}
              >
                <Icon className="w-4 h-4" />
              </div>
            </div>

            {/* Middle: Big Value & Sparkline */}
            <div className="flex items-baseline justify-between my-2">
              <div>
                <span className="font-hud text-3xl font-extrabold tracking-tight text-slate-100">
                  {sensor.value.toFixed(1)}
                </span>
                <span className="text-xs text-slate-400 font-mono ml-1">
                  {sensor.unit}
                </span>
              </div>
              <div className="hidden sm:block">
                <Sparkline
                  data={sensor.history.slice(-30)}
                  color={sparkColor}
                  min={sensor.min}
                  max={sensor.max}
                />
              </div>
            </div>

            {/* Bottom: Threshold metadata & zone */}
            <div className="pt-2 border-t border-industrial-800/80 flex items-center justify-between text-[11px] font-mono">
              <span className="text-slate-400">
                Warn ≥ {sensor.safe.toFixed(0)} | Crit ≥ {sensor.crit.toFixed(0)}
              </span>
              <span className={`font-bold tracking-wider uppercase ${statusColor}`}>
                {sensor.zone}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
};
