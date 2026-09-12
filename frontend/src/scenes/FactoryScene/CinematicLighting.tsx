import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ViewportMode } from "../../types";

export interface CinematicLightingProps {
  status?: string;
  viewportMode: ViewportMode;
}

/**
 * Cinematic 5-Point Industrial Lighting Rig (65% Intensity, Soft Non-Overexposed Balance)
 * Calibrated to NVIDIA Omniverse / Siemens Xcelerator standard.
 */
export const CinematicLighting: React.FC<CinematicLightingProps> = ({
  status = "Healthy",
  viewportMode,
}) => {
  const statusLightRef = useRef<THREE.PointLight>(null);
  const isWarning = status === "Warning";
  const isCritical = status === "Critical";

  const statusColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#00e5ff";

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (statusLightRef.current) {
      if (isCritical) {
        statusLightRef.current.intensity = Math.sin(t * 10) > 0 ? 2.4 : 0.3;
      } else if (isWarning) {
        statusLightRef.current.intensity = 1.1 + Math.sin(t * 3.5) * 0.45;
      } else {
        statusLightRef.current.intensity = 0.9 + Math.sin(t * 1.5) * 0.15;
      }
    }
  });

  return (
    <>
      {/* 1. Main Top Spotlight: 65% Intensity, Soft Non-Overexposed Falloff */}
      <spotLight
        position={[0, 8.5, 1.2]}
        intensity={1.8}
        angle={0.65}
        penumbra={0.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        color="#f8fafc"
      />

      {/* 2. Cyan Rim Light: Edge Highlights */}
      <directionalLight
        position={[-7, 5, -4]}
        intensity={1.25}
        color="#00e5ff"
      />

      {/* 3. Blue Back Light: Depth and Spatial Separation */}
      <directionalLight
        position={[6, 5, -6]}
        intensity={0.95}
        color="#2563eb"
      />

      {/* 4. Ambient Floor Bounce Light: Ground Realism */}
      <pointLight
        position={[0, 0.25, 0]}
        intensity={0.35}
        color="#0f2744"
        distance={9}
      />

      {/* 5. Dynamic Status Lighting: Subtle Non-Blinding Aura */}
      <pointLight
        ref={statusLightRef}
        position={[0, 3.0, 0.6]}
        intensity={0.9}
        color={statusColor}
        distance={8}
      />

      {/* Soft Industrial Ambient Fill */}
      <ambientLight
        intensity={viewportMode === "thermal" ? 0.75 : 0.35}
        color="#64748b"
      />
    </>
  );
};
