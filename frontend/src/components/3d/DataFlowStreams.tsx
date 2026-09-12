import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";

export const DataFlowStreams: React.FC = () => {
  const { displayTelemetry } = useTwin();
  const pointsRef = useRef<THREE.Points>(null);
  const beaconRef = useRef<THREE.Group>(null);

  const rpm = displayTelemetry?.sensors?.rpm ?? 850;
  const status = displayTelemetry?.overall_status ?? "Healthy";

  const streamColor = useMemo(() => {
    if (status === "Healthy") return new THREE.Color("#00f0ff");
    if (status === "Warning") return new THREE.Color("#fbbf24");
    return new THREE.Color("#ef4444");
  }, [status]);

  // Construct pathway points (from motor along drive shaft to loom and sensor beacon)
  const particleCount = 48;
  const { positions, progressArray, speeds } = useMemo(() => {
    const pos = new Float32Array(particleCount * 3);
    const prog = new Float32Array(particleCount);
    const spd = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      prog[i] = Math.random();
      spd[i] = 0.15 + Math.random() * 0.15;
      pos[i * 3] = -1.3 + prog[i] * 2.1;
      pos[i * 3 + 1] = 0.72 + Math.sin(prog[i] * Math.PI) * 0.15;
      pos[i * 3 + 2] = 0.55;
    }
    return { positions: pos, progressArray: prog, speeds: spd };
  }, []);

  useFrame((_, delta) => {
    if (!pointsRef.current) return;
    const posAttr = pointsRef.current.geometry.attributes.position;
    const rpmFactor = Math.max(0.3, Math.min(2.5, rpm / 800));

    for (let i = 0; i < particleCount; i++) {
      progressArray[i] += delta * speeds[i] * rpmFactor;
      if (progressArray[i] > 1) {
        progressArray[i] = 0;
      }
      const t = progressArray[i];
      // Curve from motor [-1.3, 0.72, 0.55] to loom [0.8, 0.72, 0.55]
      posAttr.setXYZ(
        i,
        -1.3 + t * 2.1,
        0.72 + Math.sin(t * Math.PI) * 0.08,
        0.55 + Math.cos(t * Math.PI * 2) * 0.04
      );
    }
    posAttr.needsUpdate = true;

    if (beaconRef.current) {
      beaconRef.current.rotation.y += delta * 0.8;
      const s = 1 + Math.sin(Date.now() * 0.005) * 0.1;
      beaconRef.current.scale.set(s, s, s);
    }
  });

  return (
    <group>
      {/* Physical Optical Pathway Cable */}
      <mesh position={[-0.25, 0.72, 0.55]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.012, 0.012, 2.1, 16]} />
        <meshStandardMaterial
          color="#0f172a"
          roughness={0.4}
          metalness={0.8}
        />
      </mesh>

      {/* Energy Stream Pulse Particles */}
      <points ref={pointsRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={particleCount}
            array={positions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.08}
          color={streamColor}
          transparent
          opacity={0.85}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Sensor Hub Gateway Beacon above bearings */}
      <group position={[0.0, 2.3, 0.55]}>
        <group ref={beaconRef}>
          <mesh>
            <octahedronGeometry args={[0.08, 0]} />
            <meshStandardMaterial
              color={streamColor}
              emissive={streamColor}
              emissiveIntensity={2.5}
              roughness={0.1}
            />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.15, 0.006, 16, 32]} />
            <meshBasicMaterial color={streamColor} transparent opacity={0.6} />
          </mesh>
        </group>

        {/* Vertical laser beam from bearings to beacon */}
        <mesh position={[0, -0.6, 0]}>
          <cylinderGeometry args={[0.004, 0.004, 1.2, 8]} />
          <meshBasicMaterial color={streamColor} transparent opacity={0.45} />
        </mesh>
      </group>
    </group>
  );
};
