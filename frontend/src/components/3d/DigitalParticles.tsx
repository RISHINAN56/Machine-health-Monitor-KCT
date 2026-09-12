import React, { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";

export const DigitalParticles: React.FC = () => {
  const { displayTelemetry } = useTwin();
  const status = displayTelemetry?.overall_status ?? "Healthy";
  const rpm = displayTelemetry?.sensors?.rpm ?? 650;

  const dataStreamRef = useRef<THREE.Points>(null);
  const transmissionRef = useRef<THREE.Points>(null);
  const healthRef = useRef<THREE.Points>(null);

  // Status-driven color
  const statusColor = useMemo(() => {
    if (status === "Critical") return new THREE.Color("#ef4444");
    if (status === "Warning") return new THREE.Color("#f59e0b");
    return new THREE.Color("#00e5ff");
  }, [status]);

  // -------------------------------------------------------------------------
  // Layer 1: Ambient Floating Factory Dust Motes
  // -------------------------------------------------------------------------
  const dustParticles = useMemo(() => {
    const count = 160;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 12;
      pos[i * 3 + 1] = 0.2 + Math.random() * 5.0;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
    }
    return pos;
  }, []);

  // -------------------------------------------------------------------------
  // Layer 2: Vertical Cybernetic Data Stream
  // -------------------------------------------------------------------------
  const dataParticles = useMemo(() => {
    const count = 80;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 3.8;
      pos[i * 3 + 1] = 0.3 + Math.random() * 3.2;
      pos[i * 3 + 2] = (Math.random() - 0.5) * 2.4;
    }
    return pos;
  }, []);

  // -------------------------------------------------------------------------
  // Layer 3: Sensor Transmission Pulses
  // -------------------------------------------------------------------------
  const transmissionParticles = useMemo(() => {
    const count = 64;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      // Anchored near key component clusters (Motor, Spindle, Sley)
      const cluster = i % 3;
      const originX = cluster === 0 ? -1.3 : cluster === 1 ? 0.0 : 1.1;
      pos[i * 3] = originX + (Math.random() - 0.5) * 0.4;
      pos[i * 3 + 1] = 0.8 + Math.random() * 2.8;
      pos[i * 3 + 2] = 0.4 + (Math.random() - 0.5) * 0.4;
    }
    return pos;
  }, []);

  // -------------------------------------------------------------------------
  // Layer 4: Machine Health Reactive Aura
  // -------------------------------------------------------------------------
  const healthParticles = useMemo(() => {
    const count = 90;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      const theta = Math.random() * Math.PI * 2;
      const radius = 1.4 + Math.random() * 1.8;
      pos[i * 3] = Math.cos(theta) * radius;
      pos[i * 3 + 1] = 0.2 + Math.random() * 2.2;
      pos[i * 3 + 2] = Math.sin(theta) * radius;
    }
    return pos;
  }, []);

  // Dynamic particle animation
  useFrame((state, delta) => {
    const t = state.clock.getElapsedTime();
    const speedMult = Math.max(0.5, Math.min(2.0, rpm / 650));

    // Animate Data Stream upward
    if (dataStreamRef.current) {
      const positions = dataStreamRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += delta * 1.2 * speedMult;
        if (positions[i * 3 + 1] > 3.8) {
          positions[i * 3 + 1] = 0.3;
        }
      }
      dataStreamRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate Transmission Pulses
    if (transmissionRef.current) {
      const positions = transmissionRef.current.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < positions.length / 3; i++) {
        positions[i * 3 + 1] += delta * 2.2 * speedMult;
        if (positions[i * 3 + 1] > 4.5) {
          positions[i * 3 + 1] = 0.8;
        }
      }
      transmissionRef.current.geometry.attributes.position.needsUpdate = true;
    }

    // Animate Health Aura rotation & pulsation
    if (healthRef.current) {
      healthRef.current.rotation.y = t * 0.15 * speedMult;
      const scale = 1.0 + Math.sin(t * 3.0) * (status === "Warning" ? 0.12 : 0.05);
      healthRef.current.scale.set(scale, 1, scale);
    }
  });

  return (
    <group name="multi-layer-particle-system">
      {/* Layer 1: Ambient Factory Dust */}
      <points>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={160}
            array={dustParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.035}
          color="#94a3b8"
          transparent
          opacity={0.35}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 2: Vertical Digital Data Stream */}
      <points ref={dataStreamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={80}
            array={dataParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.06}
          color="#00e5ff"
          transparent
          opacity={0.7}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 3: Sensor Transmission Pulses */}
      <points ref={transmissionRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={64}
            array={transmissionParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={0.075}
          color="#38bdf8"
          transparent
          opacity={0.8}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      {/* Layer 4: Machine Health Reactive Aura */}
      <points ref={healthRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={90}
            array={healthParticles}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial
          size={status === "Warning" ? 0.08 : 0.055}
          color={statusColor}
          transparent
          opacity={status === "Warning" ? 0.85 : 0.6}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
    </group>
  );
};
