import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { ViewportMode } from "../../types";
import { getComponentMaterial } from "./PbrMaterials";
import { LaserFaultBeam } from "./LaserFaultBeam";

export interface TsudakomaTwinProps {
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

export const TsudakomaTwin: React.FC<TsudakomaTwinProps> = ({
  rpm,
  temperature,
  mode,
  isExploded,
  faultBeamEnabled,
  selectedComponent,
  onInspect,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const flywheelGroupRef = useRef<THREE.Group>(null);
  const flywheelSpinRef = useRef<THREE.Group>(null);
  const bearingBlockGroupRef = useRef<THREE.Group>(null);
  const sleyGroupRef = useRef<THREE.Group>(null);
  const warningBeaconRef = useRef<THREE.PointLight>(null);

  useFrame((state, delta) => {
    const angularSpeed = (rpm / 60) * Math.PI * 2 * delta;

    if (flywheelSpinRef.current) flywheelSpinRef.current.rotation.x += angularSpeed;

    // Physical Shaking Vibration Effect (derived from 495 mm/s bearing vibration)
    if (rootRef.current) {
      const jitterIntensity = 0.025;
      const freq = state.clock.getElapsedTime() * 85;
      rootRef.current.position.x = Math.sin(freq * 1.2) * jitterIntensity;
      rootRef.current.position.y = Math.cos(freq * 0.9) * (jitterIntensity * 0.7);
      rootRef.current.position.z = Math.sin(freq * 1.5) * (jitterIntensity * 0.5);
    }

    if (rpm > 10 && sleyGroupRef.current) {
      const beatCycle = state.clock.getElapsedTime() * (rpm / 60) * Math.PI * 2;
      sleyGroupRef.current.rotation.x = Math.sin(beatCycle) * 0.17;
    }

    if (warningBeaconRef.current) {
      warningBeaconRef.current.intensity =
        1.6 + Math.sin(state.clock.getElapsedTime() * 9) * 1.3;
    }

    // Exploded View Lerp
    const explodeT = isExploded ? 1.0 : 0.0;
    if (flywheelGroupRef.current) {
      flywheelGroupRef.current.position.x = THREE.MathUtils.lerp(
        flywheelGroupRef.current.position.x,
        -1.65 - explodeT * 0.85,
        0.08
      );
    }
    if (bearingBlockGroupRef.current) {
      bearingBlockGroupRef.current.position.y = THREE.MathUtils.lerp(
        bearingBlockGroupRef.current.position.y,
        0.9 + explodeT * 0.65,
        0.08
      );
    }
    if (sleyGroupRef.current) {
      sleyGroupRef.current.position.z = THREE.MathUtils.lerp(
        sleyGroupRef.current.position.z,
        0.16 + explodeT * 0.75,
        0.08
      );
    }
  });

  const crimsonRed = "#dc2626";
  const castIron = "#0f172a";
  const polySilver = "#cbd5e1";

  return (
    <group ref={rootRef} name="tsudakoma-zax001-neo-plus">
      {/* Warning Beacon Mast with Pulsing Strobe */}
      <group position={[1.4, 2.5, -0.6]}>
        <mesh position={[0, -0.45, 0]}>
          <cylinderGeometry args={[0.025, 0.025, 0.9, 12]} />
          <meshStandardMaterial color="#334155" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.08, 0]}>
          <cylinderGeometry args={[0.08, 0.08, 0.22, 16]} />
          <meshStandardMaterial
            color="#ffb000"
            emissive="#ffb000"
            emissiveIntensity={2.6}
            toneMapped={false}
          />
        </mesh>
        <pointLight
          ref={warningBeaconRef}
          color="#ffb000"
          intensity={2.4}
          distance={4.5}
        />
      </group>

      {/* FLAGSHIP FEATURE: FAULT LOCALIZATION LASER BEAM ON RIGHT SPINDLE BEARING */}
      {faultBeamEnabled && (
        <LaserFaultBeam
          targetPosition={[-1.25, 0.9, 0.2]}
          componentName="Spindle Roller Bearing"
          metricInfo="495 mm/s ISO Class II Violation"
          severity="warning"
          onIsolate={() => onInspect("bearings")}
        />
      )}

      {/* Left Heavy Box Wall */}
      <mesh position={[-1.4, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 1.7, 1.6]} />
        {getComponentMaterial(mode, crimsonRed, temperature, false, selectedComponent === "bearings")}
      </mesh>

      {/* Right Heavy Box Wall */}
      <mesh position={[1.4, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.3, 1.7, 1.6]} />
        {getComponentMaterial(mode, crimsonRed, temperature, false, false)}
      </mesh>

      {/* Cast Iron Tie Beam */}
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <boxGeometry args={[2.8, 0.35, 1.45]} />
        {getComponentMaterial(mode, castIron, temperature - 4, false, false)}
      </mesh>

      {/* OVERSIZED HEAVY FLYWHEEL & BELT SYSTEM (EXPLODES OUTWARD) */}
      <group
        ref={flywheelGroupRef}
        position={[-1.65, 0.9, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onInspect("belt_system");
        }}
      >
        <group ref={flywheelSpinRef}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <torusGeometry args={[0.42, 0.04, 16, 32]} />
            {getComponentMaterial(mode, "#18181b", 42, false, selectedComponent === "belt_system", "belt")}
          </mesh>
        </group>
      </group>

      {/* FAULT HOTSPOT: BEARING HOUSING (LIFTS UPWARD ON EXPLODE) */}
      <group
        ref={bearingBlockGroupRef}
        position={[-1.25, 0.9, 0.2]}
        onClick={(e) => {
          e.stopPropagation();
          onInspect("bearings");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.22, 0.25, 0.25]} />
          {getComponentMaterial(
            mode,
            "#f97316",
            temperature,
            true, // isFailing = true
            selectedComponent === "bearings"
          )}
        </mesh>
        <pointLight color="#ff4500" intensity={2.0} distance={2.5} />
      </group>

      {/* SLEY & DENSE REED */}
      <group ref={sleyGroupRef} position={[0, 0.9, 0.16]}>
        <mesh castShadow>
          <boxGeometry args={[2.35, 0.1, 0.15]} />
          {getComponentMaterial(mode, crimsonRed, temperature - 2, false, selectedComponent === "loom_section")}
        </mesh>
        <mesh position={[0, 0.2, 0]} castShadow>
          <boxGeometry args={[2.25, 0.3, 0.025]} />
          <meshStandardMaterial color="#94a3b8" metalness={0.9} />
        </mesh>
      </group>

      {/* TECHNICAL POLYESTER WEAVE */}
      <mesh position={[0, 0.55, 0.55]} castShadow rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.15, 0.15, 2.3, 24]} />
        <meshStandardMaterial color={polySilver} metalness={0.7} roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.95, 0.35]} rotation={[-0.45, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 0.55]} />
        <meshStandardMaterial color="#cbd5e1" metalness={0.6} roughness={0.4} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};
