import React from "react";

interface CircularGaugeProps {
  score: number; // 0 to 100
  size?: number;
  strokeWidth?: number;
  title?: string;
  statusText?: string;
}

export const CircularGauge: React.FC<CircularGaugeProps> = ({
  score,
  size = 180,
  strokeWidth = 14,
  title = "MACHINE HEALTH",
  statusText,
}) => {
  const normalizedScore = Math.max(0, Math.min(100, score));
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  // Use a 270 degree arc for a classic gauge appearance
  const arcLength = circumference * 0.75;
  const strokeDashoffset = arcLength - (arcLength * normalizedScore) / 100;

  // Determine colors based on score
  const color =
    normalizedScore >= 75
      ? "#10b981" // Emerald
      : normalizedScore >= 50
      ? "#f59e0b" // Amber
      : "#ef4444"; // Crimson

  const glowClass =
    normalizedScore >= 75
      ? "shadow-glow-emerald"
      : normalizedScore >= 50
      ? "shadow-glow-amber"
      : "shadow-glow-crimson";

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-[135deg] transition-all duration-700 ease-out"
        >
          {/* Background Track Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke="#1e293b"
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeLinecap="round"
          />

          {/* Active Colored Score Arc */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="transparent"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={`${arcLength} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
            style={{
              filter: `drop-shadow(0 0 8px ${color}88)`,
            }}
          />
        </svg>

        {/* Center Content */}
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[10px] font-hud tracking-widest text-slate-400 uppercase">
            {title}
          </span>
          <span
            className="text-4xl font-extrabold font-hud tracking-tight mt-0.5"
            style={{ color }}
          >
            {normalizedScore.toFixed(0)}
            <span className="text-lg font-normal text-slate-400">%</span>
          </span>
          <span
            className="text-[11px] font-semibold uppercase px-2 py-0.5 rounded-full mt-1 border"
            style={{
              color,
              borderColor: `${color}40`,
              backgroundColor: `${color}15`,
            }}
          >
            {statusText ||
              (normalizedScore >= 75
                ? "Optimal"
                : normalizedScore >= 50
                ? "Warning"
                : "Critical")}
          </span>
        </div>
      </div>
    </div>
  );
};
