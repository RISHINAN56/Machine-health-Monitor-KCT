import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ViewportMode } from "../../types";
import { getComponentMaterial } from "./PbrMaterials";

export interface ToyotaTwinProps {
  rpm: number;
  vibration: number;
  temperature: number;
  health: number;
  status: string;
  mode: ViewportMode;
  isExploded: boolean;
  faultBeamEnabled: boolean;
  activeScenario: string;
  selectedComponent: string | null;
  onInspect: (comp: string) => void;
}

export const ToyotaTwin: React.FC<ToyotaTwinProps> = ({
  rpm,
  temperature,
  mode,
  isExploded,
  selectedComponent,
  onInspect,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const leftCoverRef = useRef<THREE.Group>(null);
  const rightCoverRef = useRef<THREE.Group>(null);
  const eShedLinksRef = useRef<THREE.Group>(null);
  const sleyRef = useRef<THREE.Group>(null);
  const takeupRollRef = useRef<THREE.Group>(null);
  const subNozzleStreamRef = useRef<THREE.Points>(null);

  const subNozzlePositions = useMemo(() => {
    const count = 40;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -1.1 + (i / count) * 2.3;
      pos[i * 3 + 1] = 0.97 + (Math.random() - 0.5) * 0.04;
      pos[i * 3 + 2] = 0.12 + (Math.random() - 0.5) * 0.04;
    }
    return pos;
  }, []);

  useFrame((state, delta) => {
    const angularSpeed = (rpm / 60) * Math.PI * 2 * delta;

    if (takeupRollRef.current) takeupRollRef.current.rotation.x += angularSpeed * 0.2;

    // E-Shed independent servo undulating links
    if (rpm > 10 && eShedLinksRef.current) {
      const t = state.clock.getElapsedTime() * (rpm / 60) * Math.PI * 2;
      eShedLinksRef.current.children.forEach((child, index) => {
        child.position.y = 1.15 + Math.sin(t + index * 0.8) * 0.12;
      });
      if (sleyRef.current) {
        sleyRef.current.rotation.x = Math.sin(t) * 0.16;
      }
    }

    if (subNozzleStreamRef.current && subNozzleStreamRef.current.geometry.attributes.position) {
      const posAttr = subNozzleStreamRef.current.geometry.attributes.position;
      const array = posAttr.array as Float32Array;
      for (let i = 0; i < 40; i++) {
        array[i * 3] += delta * 6.2;
        if (array[i * 3] > 1.3) array[i * 3] = -1.2;
      }
      posAttr.needsUpdate = true;
    }

    // Exploded View Lerp
    const explodeT = isExploded ? 1.0 : 0.0;
    if (leftCoverRef.current) {
      leftCoverRef.current.position.x = THREE.MathUtils.lerp(
        leftCoverRef.current.position.x,
        -1.4 - explodeT * 0.8,
        0.08
      );
    }
    if (rightCoverRef.current) {
      rightCoverRef.current.position.x = THREE.MathUtils.lerp(
        rightCoverRef.current.position.x,
        1.4 + explodeT * 0.8,
        0.08
      );
    }
    if (sleyRef.current) {
      sleyRef.current.position.z = THREE.MathUtils.lerp(
        sleyRef.current.position.z,
        0.14 + explodeT * 0.7,
        0.08
      );
    }
  });

  const arcticWhite = "#f8fafc";
  const charcoal = "#1e293b";
  const toyotaRed = "#ef4444";
  const denimBlue = "#1e3a8a";

  return (
    <group ref={rootRef} name="toyota-jat910">
      {/* Status Beacon (Green for Healthy) */}
      <group position={[1.45, 2.3, -0.6]}>
        <mesh position={[0, -0.3, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.6, 12]} />
          <meshStandardMaterial color="#64748b" metalness={0.9} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.06, 0.06, 0.16, 16]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#00ff88" intensity={1.5} distance={3.5} />
      </group>

      {/* STREAMLINED ARCTIC WHITE CASINGS (EXPLODE LATERALLY) */}
      <group ref={leftCoverRef} position={[-1.4, 0.85, 0]}>
        <mesh castShadow receiveShadow onClick={() => onInspect("main_motor")}>
          <boxGeometry args={[0.26, 1.7, 1.55]} />
          {getComponentMaterial(mode, arcticWhite, temperature, false, selectedComponent === "main_motor")}
        </mesh>
        {/* Red Accent Strip */}
        <mesh position={[-0.14, 0.4, 0]}>
          <boxGeometry args={[0.02, 0.05, 1.4]} />
          <meshStandardMaterial color={toyotaRed} emissive={toyotaRed} emissiveIntensity={0.4} />
        </mesh>
      </group>

      <group ref={rightCoverRef} position={[1.4, 0.85, 0]}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[0.26, 1.7, 1.55]} />
          {getComponentMaterial(mode, arcticWhite, temperature, false, false)}
        </mesh>
      </group>

      {/* Charcoal Bed */}
      <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.7, 0.3, 1.4]} />
        {getComponentMaterial(mode, charcoal, temperature - 3, false, false)}
      </mesh>

      {/* 12-INCH FUNCTION PANEL TOUCH TERMINAL */}
      <group position={[1.52, 1.45, 0.45]} rotation={[0, -0.3, 0]}>
        <mesh position={[-0.1, -0.3, 0]} rotation={[0, 0, -0.4]}>
          <cylinderGeometry args={[0.025, 0.025, 0.5, 12]} />
          <meshStandardMaterial color="#cbd5e1" metalness={0.9} />
        </mesh>
        <mesh castShadow>
          <boxGeometry args={[0.36, 0.28, 0.04]} />
          <meshStandardMaterial color="#0f172a" />
        </mesh>
        <mesh position={[0, 0, 0.022]}>
          <planeGeometry args={[0.32, 0.24]} />
          <meshBasicMaterial color="#00ffc8" toneMapped={false} />
        </mesh>
      </group>

      {/* E-SHED ELECTRONIC INDEPENDENT SERVO SHEDDING LINKS */}
      <group ref={eShedLinksRef} position={[0, 0, -0.1]}>
        {[-0.8, -0.4, 0, 0.4, 0.8].map((x, idx) => (
          <group
            key={idx}
            position={[x, 1.15, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onInspect("loom_section");
            }}
          >
            <mesh castShadow>
              <cylinderGeometry args={[0.015, 0.015, 0.55, 12]} />
              <meshStandardMaterial color="#94a3b8" metalness={0.9} />
            </mesh>
            <mesh position={[0, 0.3, 0]} castShadow>
              <boxGeometry args={[0.12, 0.14, 0.1]} />
              <meshStandardMaterial color="#334155" metalness={0.8} />
            </mesh>
          </group>
        ))}
      </group>

      {/* SLEY & SUB-NOZZLE MANIFOLD */}
      <group ref={sleyRef} position={[0, 0.88, 0.14]}>
        <mesh castShadow>
          <boxGeometry args={[2.35, 0.07, 0.1]} />
          {getComponentMaterial(mode, "#cbd5e1", temperature - 2, false, selectedComponent === "loom_section")}
        </mesh>
        <mesh position={[0, 0.17, 0]}>
          <boxGeometry args={[2.25, 0.26, 0.02]} />
          <meshStandardMaterial color="#f1f5f9" metalness={0.9} />
        </mesh>
      </group>

      {/* Sub-nozzle air pulses */}
      <points ref={subNozzleStreamRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={40}
            array={subNozzlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.03} color="#00ffc8" transparent opacity={0.85} />
      </points>

      {/* DENIM ROLL & TAKEUP */}
      <group ref={takeupRollRef} position={[0, 0.55, 0.52]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.16, 0.16, 2.3, 24]} />
          <meshStandardMaterial color={denimBlue} roughness={0.9} />
        </mesh>
      </group>
      <mesh position={[0, 0.95, 0.33]} rotation={[-0.48, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 0.55]} />
        <meshStandardMaterial color="#1e3a8a" roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
