import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";

interface HolographicRingsProps {
  visible?: boolean;
}

export const HolographicRings: React.FC<HolographicRingsProps> = ({ visible = true }) => {
  const { displayTelemetry } = useTwin();

  const ring1Ref = useRef<THREE.Group>(null);
  const ring2Ref = useRef<THREE.Group>(null);
  const radarTicksRef = useRef<THREE.Group>(null);

  const telemetry = displayTelemetry;
  const status = telemetry?.overall_status ?? "Healthy";
  const rpm = telemetry?.sensors?.rpm ?? 650;

  // Refined, elegant, low-intensity status palette
  const statusTheme = useMemo(() => {
    if (status === "Critical") {
      return {
        primary: "#ef4444",
        emissiveIntensity: 0.9,
      };
    }
    if (status === "Warning") {
      return {
        primary: "#f59e0b",
        emissiveIntensity: 0.85,
      };
    }
    return {
      primary: "#00e5ff",
      emissiveIntensity: 0.7,
    };
  }, [status]);

  // Subtle radial tick marks along the ground radar perimeter
  const tickGeometries = useMemo(() => {
    const ticks: [number, number, number][] = [];
    const count = 32;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r1 = 2.92;
      const r2 = i % 4 === 0 ? 3.04 : 2.98;
      ticks.push([Math.cos(angle) * r1, 0, Math.sin(angle) * r1]);
      ticks.push([Math.cos(angle) * r2, 0, Math.sin(angle) * r2]);
    }
    return ticks;
  }, []);

  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speedMult = Math.max(0.5, Math.min(1.8, rpm / 650));

    // 1. Slow, elegant rotation for ground radar tick ring
    if (radarTicksRef.current) {
      radarTicksRef.current.rotation.y = t * 0.04 * speedMult;
    }

    // 2. Primary Gyro Ring (Horizontal thin torus)
    if (ring1Ref.current) {
      ring1Ref.current.rotation.y += delta * 0.2 * speedMult;
      ring1Ref.current.position.y = 0.18 + Math.sin(t * 1.5) * 0.02;
    }

    // 3. Inner Counter-Rotating Ring
    if (ring2Ref.current) {
      ring2Ref.current.rotation.y -= delta * 0.16 * speedMult;
      ring2Ref.current.rotation.x = Math.sin(t * 0.8) * 0.06;
    }
  });

  if (!visible) return null;

  return (
    <group position={[0, 0.015, 0]} name="digital-twin-energy-platform">
      {/* 1. Subtle Ground Projection Ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.9, 2.92, 80]} />
        <meshBasicMaterial
          color={statusTheme.primary}
          transparent
          opacity={0.25}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>

      {/* Rotating Radial Ticks */}
      <group ref={radarTicksRef}>
        {tickGeometries.map((pos, idx) => {
          if (idx % 2 !== 0) return null;
          const next = tickGeometries[idx + 1];
          return (
            <line key={`tick-${idx}`}>
              <bufferGeometry>
                <bufferAttribute
                  attach="attributes-position"
                  count={2}
                  array={new Float32Array([...pos, ...next])}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={statusTheme.primary}
                transparent
                opacity={0.28}
                depthWrite={false}
              />
            </line>
          );
        })}
      </group>

      {/* 2. Primary Elegant Holographic Ring (Thin, Non-Blinding) */}
      <group ref={ring1Ref} position={[0, 0.18, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.7, 0.007, 16, 96]} />
          <meshStandardMaterial
            color={statusTheme.primary}
            emissive={statusTheme.primary}
            emissiveIntensity={statusTheme.emissiveIntensity}
            transparent
            opacity={0.65}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>

      {/* 3. Inner Precessing Energy Ring */}
      <group ref={ring2Ref} position={[0, 0.26, 0]}>
        <mesh rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[2.1, 0.006, 16, 80]} />
          <meshStandardMaterial
            color={statusTheme.primary}
            emissive={statusTheme.primary}
            emissiveIntensity={statusTheme.emissiveIntensity * 0.75}
            transparent
            opacity={0.5}
            roughness={0.2}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
};
