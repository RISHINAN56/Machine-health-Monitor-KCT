export const ISO_10816_VIBRATION = {
  ZONE_A_MAX: 112, // Good condition (ISO Class II)
  ZONE_B_MAX: 280, // Acceptable continuous operation
  ZONE_C_MAX: 710, // Restricted operation / warning
  // Above 710 is Zone D (Danger / Critical trip)
};

export const TEMPERATURE_THRESHOLDS = {
  NORMAL_MAX: 45.0,
  WARNING_MAX: 55.0,
  CRITICAL_MAX: 75.0,
};

export const HEALTH_THRESHOLDS = {
  HEALTHY_MIN: 75.0,
  WARNING_MIN: 50.0,
  CRITICAL_BELOW: 50.0,
};

export const MACHINE_STATUS_COLORS = {
  Healthy: {
    text: "text-cyan-400",
    border: "border-cyan-500/50",
    bg: "bg-cyan-500/10",
    hex: "#00E5FF",
    glow: "shadow-[0_0_12px_rgba(0,229,255,0.4)]",
  },
  Warning: {
    text: "text-amber-400",
    border: "border-amber-500/50",
    bg: "bg-amber-500/10",
    hex: "#F59E0B",
    glow: "shadow-[0_0_12px_rgba(245,158,11,0.4)]",
  },
  Critical: {
    text: "text-red-400",
    border: "border-red-500/50",
    bg: "bg-red-500/10",
    hex: "#EF4444",
    glow: "shadow-[0_0_12px_rgba(239,68,68,0.4)]",
  },
};
