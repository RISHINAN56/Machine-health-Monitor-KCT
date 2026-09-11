import React, { useState } from "react";
import { useTwin } from "../../context/TwinContext";
import { LineChart, BarChart3, TrendingUp, Filter } from "lucide-react";

export const HistoricalAnalytics: React.FC = () => {
  const { history } = useTwin();
  const [selectedRange, setSelectedRange] = useState<number>(60);
  const [activeMetrics, setActiveMetrics] = useState({
    temperature: true,
    vibration: true,
    motor_load: true,
    rpm: true,
  });

  const slice = history.slice(-selectedRange);

  // Compute statistical summaries
  const getStats = (values: number[]) => {
    if (values.length === 0) return { min: 0, max: 0, avg: 0 };
    const min = Math.min(...values);
    const max = Math.max(...values);
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    return { min, max, avg };
  };

  const tempStats = getStats(slice.map((s) => s.sensors.temperature));
  const vibStats = getStats(slice.map((s) => s.sensors.vibration));
  const loadStats = getStats(slice.map((s) => s.sensors.motor_load));
  const rpmStats = getStats(slice.map((s) => s.sensors.rpm));

  // Multi-line SVG chart renderer
  const renderMultiChart = () => {
    if (slice.length < 2) {
      return (
        <div className="h-56 flex items-center justify-center text-xs font-mono text-slate-500">
          Gathering time-series telemetry buffer...
        </div>
      );
    }

    const width = 800;
    const height = 210;
    const pad = 24;

    const buildPath = (values: number[], minVal: number, maxVal: number) => {
      return values
        .map((val, idx) => {
          const x = pad + (idx / (values.length - 1)) * (width - 2 * pad);
          const norm = (val - minVal) / Math.max(1, maxVal - minVal);
          const y = height - pad - Math.max(0, Math.min(1, norm)) * (height - 2 * pad);
          return `${idx === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
        })
        .join(" ");
    };

    const tempPath = buildPath(
      slice.map((s) => s.sensors.temperature),
      20,
      80
    );
    const vibPath = buildPath(
      slice.map((s) => s.sensors.vibration),
      0,
      1400
    );
    const loadPath = buildPath(
      slice.map((s) => s.sensors.motor_load),
      0,
      1200
    );
    const rpmPath = buildPath(
      slice.map((s) => s.sensors.rpm),
      0,
      1000
    );

    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="w-full h-56 overflow-visible select-none"
      >
        {/* Horizontal grid lines */}
        {[0.25, 0.5, 0.75].map((pct, i) => (
          <line
            key={i}
            x1={pad}
            y1={pad + pct * (height - 2 * pad)}
            x2={width - pad}
            y2={pad + pct * (height - 2 * pad)}
            stroke="#1e293b"
            strokeDasharray="4 4"
            strokeWidth="1"
          />
        ))}

        {/* Warning and Critical Bands */}
        <line
          x1={pad}
          y1={pad + 0.35 * (height - 2 * pad)}
          x2={width - pad}
          y2={pad + 0.35 * (height - 2 * pad)}
          stroke="#ef4444"
          strokeDasharray="6 6"
          strokeWidth="1.5"
          opacity="0.4"
        />

        {/* Metric Polyline Traces */}
        {activeMetrics.temperature && (
          <path
            d={tempPath}
            fill="none"
            stroke="#f43f5e"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        {activeMetrics.vibration && (
          <path
            d={vibPath}
            fill="none"
            stroke="#00f0ff"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        {activeMetrics.motor_load && (
          <path
            d={loadPath}
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
        {activeMetrics.rpm && (
          <path
            d={rpmPath}
            fill="none"
            stroke="#10b981"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        )}
      </svg>
    );
  };

  return (
    <div className="glass-panel rounded-2xl p-5 border border-industrial-700/60 shadow-panel flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-industrial-700/40 gap-3">
        <div className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-cyan-400" />
          <div>
            <h2 className="font-hud text-sm tracking-wider text-cyan-300 uppercase font-bold">
              Historical Telemetry & Multi-Metric Trends
            </h2>
            <p className="text-xs text-slate-400 font-mono">
              Live ISO 10816 Mechanical Sensor History & Statistical Envelopes
            </p>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Metric Toggles */}
          <div className="flex items-center gap-1 bg-industrial-950/80 p-1 rounded-xl border border-industrial-800 text-xs font-mono">
            <button
              onClick={() =>
                setActiveMetrics((p) => ({ ...p, vibration: !p.vibration }))
              }
              className={`px-2 py-0.5 rounded transition ${
                activeMetrics.vibration
                  ? "bg-cyan-500/20 text-cyan-300 font-bold"
                  : "text-slate-500"
              }`}
            >
              Vib
            </button>
            <button
              onClick={() =>
                setActiveMetrics((p) => ({ ...p, temperature: !p.temperature }))
              }
              className={`px-2 py-0.5 rounded transition ${
                activeMetrics.temperature
                  ? "bg-rose-500/20 text-rose-300 font-bold"
                  : "text-slate-500"
              }`}
            >
              Temp
            </button>
            <button
              onClick={() =>
                setActiveMetrics((p) => ({ ...p, motor_load: !p.motor_load }))
              }
              className={`px-2 py-0.5 rounded transition ${
                activeMetrics.motor_load
                  ? "bg-amber-500/20 text-amber-300 font-bold"
                  : "text-slate-500"
              }`}
            >
              Load
            </button>
            <button
              onClick={() =>
                setActiveMetrics((p) => ({ ...p, rpm: !p.rpm }))
              }
              className={`px-2 py-0.5 rounded transition ${
                activeMetrics.rpm
                  ? "bg-emerald-500/20 text-emerald-300 font-bold"
                  : "text-slate-500"
              }`}
            >
              RPM
            </button>
          </div>

          {/* Time Window Buttons */}
          <div className="flex items-center gap-1 bg-industrial-950/80 p-1 rounded-xl border border-industrial-800 text-xs font-mono">
            {[30, 60, 120].map((count) => (
              <button
                key={count}
                onClick={() => setSelectedRange(count)}
                className={`px-2.5 py-0.5 rounded transition ${
                  selectedRange === count
                    ? "bg-cyan-500 text-industrial-950 font-bold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                {count}s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="my-2">{renderMultiChart()}</div>

      {/* Statistical Summary Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3 border-t border-industrial-700/40 font-mono text-xs">
        <div className="p-2.5 rounded-xl bg-industrial-950/60 border border-industrial-800">
          <span className="text-[10px] text-cyan-400 block font-hud">VIBRATION RMS</span>
          <div className="flex justify-between mt-1 text-slate-300">
            <span>Avg: <b>{vibStats.avg.toFixed(0)}</b></span>
            <span>Max: <b className="text-cyan-300">{vibStats.max.toFixed(0)}</b> mm/s</span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-industrial-950/60 border border-industrial-800">
          <span className="text-[10px] text-rose-400 block font-hud">TEMPERATURE</span>
          <div className="flex justify-between mt-1 text-slate-300">
            <span>Avg: <b>{tempStats.avg.toFixed(1)}°C</b></span>
            <span>Max: <b className="text-rose-300">{tempStats.max.toFixed(1)}°C</b></span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-industrial-950/60 border border-industrial-800">
          <span className="text-[10px] text-amber-400 block font-hud">MOTOR LOAD</span>
          <div className="flex justify-between mt-1 text-slate-300">
            <span>Avg: <b>{loadStats.avg.toFixed(0)} A</b></span>
            <span>Max: <b className="text-amber-300">{loadStats.max.toFixed(0)} A</b></span>
          </div>
        </div>

        <div className="p-2.5 rounded-xl bg-industrial-950/60 border border-industrial-800">
          <span className="text-[10px] text-emerald-400 block font-hud">SPEED STABILITY</span>
          <div className="flex justify-between mt-1 text-slate-300">
            <span>Avg: <b>{rpmStats.avg.toFixed(0)}</b></span>
            <span>Max: <b className="text-emerald-300">{rpmStats.max.toFixed(0)}</b> RPM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
