import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { AlertTriangle } from "lucide-react";

export interface LaserFaultBeamProps {
  targetPosition: [number, number, number];
  componentName: string;
  metricInfo: string;
  severity: "warning" | "critical";
  onIsolate: () => void;
}

export const LaserFaultBeam: React.FC<LaserFaultBeamProps> = ({
  targetPosition,
  componentName,
  metricInfo,
  severity,
  onIsolate,
}) => {
  const beamRef = useRef<THREE.Mesh>(null);
  const ringRef = useRef<THREE.Mesh>(null);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (beamRef.current) {
      (beamRef.current.material as THREE.MeshBasicMaterial).opacity =
        0.45 + Math.sin(t * 8) * 0.25;
    }
    if (ringRef.current) {
      ringRef.current.scale.setScalar(1 + Math.sin(t * 6) * 0.25);
    }
  });

  const beamColor = severity === "critical" ? "#ef4444" : "#ffb000";

  return (
    <group position={targetPosition}>
      {/* 1. Concentric Holographic Target Rings on Component Surface */}
      <mesh ref={ringRef} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.2, 0.28, 32]} />
        <meshBasicMaterial color={beamColor} side={THREE.DoubleSide} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[0.08, 0.12, 24]} />
        <meshBasicMaterial color="#ffffff" side={THREE.DoubleSide} />
      </mesh>

      {/* 2. Vertical Overhead Laser Beam from Gantry down to Target */}
      <mesh ref={beamRef} position={[0, 3.2, 0]}>
        <cylinderGeometry args={[0.02, 0.16, 6.4, 16, 1, true]} />
        <meshBasicMaterial
          color={beamColor}
          transparent
          opacity={0.6}
          side={THREE.DoubleSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>

      {/* 3. Floating 3D Diagnostic Billboard */}
      <group position={[0, 0.65, 0]}>
        <Html center distanceFactor={7}>
          <div className="flex flex-col items-center gap-1.5 select-none pointer-events-auto">
            <div
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border backdrop-blur-md shadow-2xl font-hud text-[11px] font-extrabold uppercase tracking-wider animate-pulse ${
                severity === "critical"
                  ? "bg-red-950/90 border-red-500/80 text-red-200 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                  : "bg-amber-950/90 border-amber-500/80 text-amber-200 shadow-[0_0_20px_rgba(255,176,0,0.6)]"
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>FAULT LOCALIZED: {componentName}</span>
              <span className="font-mono text-[10px] opacity-80">({metricInfo})</span>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onIsolate();
              }}
              className="px-2 py-0.5 rounded bg-slate-900/90 hover:bg-cyan-500 hover:text-black border border-cyan-400/60 text-cyan-300 font-mono text-[9px] uppercase tracking-wider transition font-bold"
            >
              Isolate Component [Space]
            </button>
          </div>
        </Html>
      </group>
    </group>
  );
};
