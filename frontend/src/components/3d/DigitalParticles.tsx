import React, { useMemo } from "react";
import { Sparkles } from "@react-three/drei";
import { useTwin } from "../../context/TwinContext";

export const DigitalParticles: React.FC = () => {
  const { displayTelemetry } = useTwin();

  const status = displayTelemetry?.overall_status ?? "Healthy";
  const rpm = displayTelemetry?.sensors?.rpm ?? 850;

  const particleColor = useMemo(() => {
    if (status === "Healthy") return "#38bdf8";
    if (status === "Warning") return "#fbbf24";
    return "#ef4444";
  }, [status]);

  const speed = useMemo(() => {
    return Math.max(0.2, Math.min(1.2, (rpm / 850) * 0.4));
  }, [rpm]);

  return (
    <group position={[0, 1.5, 0]}>
      <Sparkles
        count={50}
        scale={[7, 4, 7]}
        size={2.4}
        speed={speed}
        noise={0.3}
        color={particleColor}
        opacity={0.65}
      />
    </group>
  );
};
