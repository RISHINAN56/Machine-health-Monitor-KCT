import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { Float, Html } from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";

interface HolographicRingsProps {
  visible?: boolean;
}

export const HolographicRings: React.FC<HolographicRingsProps> = ({ visible = true }) => {
  const { displayTelemetry, selectedComponent } = useTwin();
  const isInspectionMode = Boolean(selectedComponent);
  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const ring3Ref = useRef<THREE.Group>(null);

  const telemetry = displayTelemetry;
  const health = telemetry?.overall_health_score ?? 100;
  const status = telemetry?.overall_status ?? "Healthy";
  const rpm = (telemetry?.sensors?.rpm ?? 0).toFixed(0);
  const temp = (telemetry?.sensors?.temperature ?? 0).toFixed(1);

  // Dynamic status color
  const statusTheme =
    status === "Healthy"
      ? {
          glow: "#00ff88",
          text: "text-[#00ff88]",
          border: "border-[#00ff88]/60",
          bg: "bg-[#00ff88]/10",
          risk: "LOW RISK",
        }
      : status === "Warning"
      ? {
          glow: "#fbbf24",
          text: "text-[#fbbf24]",
          border: "border-[#fbbf24]/60",
          bg: "bg-[#fbbf24]/10",
          risk: "MODERATE RISK",
        }
      : {
          glow: "#ef4444",
          text: "text-[#ef4444]",
          border: "border-[#ef4444]/60",
          bg: "bg-[#ef4444]/10",
          risk: "HIGH RISK",
        };

  useFrame((_, delta) => {
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += delta * 0.18;
    }
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.12;
      ring2Ref.current.rotation.x = Math.sin(Date.now() * 0.0008) * 0.08;
    }
    if (ring3Ref.current) {
      ring3Ref.current.rotation.y += delta * 0.06;
    }
  });

  if (!visible) return null;

  return (
    <group position={[0, 0.2, 0]}>
      {/* Outer Ground Radar Grid Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
        <ringGeometry args={[2.8, 2.84, 64]} />
        <meshBasicMaterial
          color={statusTheme.glow}
          transparent
          opacity={0.35}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* Primary Floating Holographic Gyro Rings */}
      <Float speed={1.5} rotationIntensity={0.15} floatIntensity={0.3}>
        {/* Ring 1: High-speed counter-clockwise ring with telemetry points */}
        <group ref={ring1Ref}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[2.5, 0.012, 16, 80]} />
            <meshStandardMaterial
              color={statusTheme.glow}
              emissive={statusTheme.glow}
              emissiveIntensity={1.8}
              transparent
              opacity={0.7}
              roughness={0.2}
            />
          </mesh>

          {/* Orbiting Badge: Health Score (Hidden in inspection mode, compact HUD styling) */}
          {!isInspectionMode && (
            <group position={[2.5, 0.3, 0]}>
              <Html center distanceFactor={4.5} transform>
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-sm border ${statusTheme.border} bg-slate-950/50 shadow-md text-[8px] font-mono select-none pointer-events-none whitespace-nowrap`}
                >
                  <span className="uppercase tracking-wider text-slate-400">HEALTH</span>
                  <span className={`font-bold ${statusTheme.text}`}>
                    {health.toFixed(0)}%
                  </span>
                </div>
              </Html>
            </group>
          )}

          {/* Orbiting Badge: RPM */}
          {!isInspectionMode && (
            <group position={[-2.5, -0.2, 0]}>
              <Html center distanceFactor={4.5} transform>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-sm border border-cyan-400/40 bg-slate-950/50 shadow-md text-[8px] font-mono select-none pointer-events-none whitespace-nowrap">
                  <span className="uppercase tracking-wider text-cyan-300">RPM</span>
                  <span className="font-bold text-cyan-200">{rpm}</span>
                </div>
              </Html>
            </group>
          )}
        </group>

        {/* Ring 2: Tilted counter-rotating ring with Temp & Risk level */}
        <group ref={ring2Ref} rotation={[0.2, 0, 0]}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.2, 0.008, 16, 96]} />
            <meshStandardMaterial
              color="#38bdf8"
              emissive="#0284c7"
              emissiveIntensity={1.4}
              transparent
              opacity={0.5}
            />
          </mesh>

          {/* Orbiting Badge: Temperature */}
          {!isInspectionMode && (
            <group position={[0, 0.4, 3.2]}>
              <Html center distanceFactor={4.5} transform>
                <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-sm border border-amber-400/40 bg-slate-950/50 shadow-md text-[8px] font-mono select-none pointer-events-none whitespace-nowrap">
                  <span className="uppercase tracking-wider text-amber-300">TEMP</span>
                  <span className="font-bold text-amber-200">{temp}°C</span>
                </div>
              </Html>
            </group>
          )}

          {/* Orbiting Badge: Risk Level */}
          {!isInspectionMode && (
            <group position={[0, -0.3, -3.2]}>
              <Html center distanceFactor={4.5} transform>
                <div
                  className={`flex items-center gap-1.5 px-2 py-0.5 rounded-md backdrop-blur-sm border ${statusTheme.border} bg-slate-950/50 shadow-md text-[8px] font-mono select-none pointer-events-none whitespace-nowrap`}
                >
                  <span className="uppercase tracking-wider text-slate-400">RISK</span>
                  <span className={`font-bold ${statusTheme.text}`}>
                    {statusTheme.risk}
                  </span>
                </div>
              </Html>
            </group>
          )}
        </group>

        {/* Ring 3: Outer Horizon Orbit Ring */}
        <group ref={ring3Ref}>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[3.8, 0.006, 16, 120]} />
            <meshBasicMaterial
              color="#00f0ff"
              transparent
              opacity={0.25}
            />
          </mesh>
        </group>
      </Float>
    </group>
  );
};
