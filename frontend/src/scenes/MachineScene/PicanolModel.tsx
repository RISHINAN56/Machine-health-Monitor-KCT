import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { ViewportMode } from "../../types";
import { getComponentMaterial } from "./PbrMaterials";
import { LaserFaultBeam } from "./LaserFaultBeam";

export interface PicanolTwinProps {
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

export const PicanolTwin: React.FC<PicanolTwinProps> = ({
  rpm,
  temperature,
  mode,
  isExploded,
  faultBeamEnabled,
  activeScenario,
  selectedComponent,
  onInspect,
}) => {
  const rootRef = useRef<THREE.Group>(null);
  const sumoMotorGroupRef = useRef<THREE.Group>(null);
  const motorRotorRef = useRef<THREE.Group>(null);
  const mainShaftGroupRef = useRef<THREE.Group>(null);
  const mainShaftSpinRef = useRef<THREE.Group>(null);
  const sleyReedGroupRef = useRef<THREE.Group>(null);
  const healdFrame1Ref = useRef<THREE.Group>(null);
  const healdFrame2Ref = useRef<THREE.Group>(null);
  const takeupRollerGroupRef = useRef<THREE.Group>(null);
  const valveCabinetGroupRef = useRef<THREE.Group>(null);
  const airParticlesRef = useRef<THREE.Points>(null);

  const particlePositions = useMemo(() => {
    const count = 35;
    const pos = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      pos[i * 3] = -1.2 + Math.random() * 2.4;
      pos[i * 3 + 1] = 0.95 + (Math.random() - 0.5) * 0.05;
      pos[i * 3 + 2] = 0.15 + (Math.random() - 0.5) * 0.05;
    }
    return pos;
  }, []);

  const isFailingMotor = activeScenario === "motor_overload" || activeScenario === "overheating";
  const isFailingBearing = activeScenario === "bearing_wear";

  useFrame((state, delta) => {
    const angularSpeed = (rpm / 60) * Math.PI * 2 * delta;

    // 1. Live Mechanical Rotations
    if (motorRotorRef.current) motorRotorRef.current.rotation.x += angularSpeed;
    if (mainShaftSpinRef.current) mainShaftSpinRef.current.rotation.x += angularSpeed;
    if (takeupRollerGroupRef.current) takeupRollerGroupRef.current.rotation.x += angularSpeed * 0.22;

    // 2. Reciprocating Sley & Heald Frame Motion
    if (rpm > 10) {
      const beatCycle = state.clock.getElapsedTime() * (rpm / 60) * Math.PI * 2;
      if (sleyReedGroupRef.current) {
        sleyReedGroupRef.current.rotation.x = Math.sin(beatCycle) * 0.15;
      }
      if (healdFrame1Ref.current && healdFrame2Ref.current) {
        healdFrame1Ref.current.position.y = 1.1 + Math.sin(beatCycle) * 0.11;
        healdFrame2Ref.current.position.y = 1.1 - Math.sin(beatCycle) * 0.11;
      }
    }

    // 3. Airflow particles
    if (airParticlesRef.current && airParticlesRef.current.geometry.attributes.position) {
      const posAttr = airParticlesRef.current.geometry.attributes.position;
      const array = posAttr.array as Float32Array;
      for (let i = 0; i < 35; i++) {
        array[i * 3] += delta * 4.8;
        if (array[i * 3] > 1.3) array[i * 3] = -1.2;
      }
      posAttr.needsUpdate = true;
    }

    // 4. Exploded View Smooth Lerp Interpolation
    const explodeT = isExploded ? 1.0 : 0.0;
    if (sumoMotorGroupRef.current) {
      sumoMotorGroupRef.current.position.x = THREE.MathUtils.lerp(
        sumoMotorGroupRef.current.position.x,
        -1.62 - explodeT * 0.9,
        0.08
      );
    }
    if (mainShaftGroupRef.current) {
      mainShaftGroupRef.current.position.y = THREE.MathUtils.lerp(
        mainShaftGroupRef.current.position.y,
        0.88 + explodeT * 0.55,
        0.08
      );
    }
    if (sleyReedGroupRef.current) {
      sleyReedGroupRef.current.position.z = THREE.MathUtils.lerp(
        sleyReedGroupRef.current.position.z,
        0.15 + explodeT * 0.75,
        0.08
      );
    }
    if (valveCabinetGroupRef.current) {
      valveCabinetGroupRef.current.position.z = THREE.MathUtils.lerp(
        valveCabinetGroupRef.current.position.z,
        -0.55 - explodeT * 0.7,
        0.08
      );
    }
  });

  const aeroBlue = "#0284c7";
  const titanium = "#94a3b8";
  const graphite = "#1e293b";

  return (
    <group ref={rootRef} name="picanol-omniplus-summum">
      {/* Status Beacon (Green for Healthy) */}
      <group position={[1.4, 2.4, -0.6]}>
        <mesh position={[0, -0.4, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.8, 12]} />
          <meshStandardMaterial color="#475569" metalness={0.8} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.07, 0.07, 0.18, 16]} />
          <meshStandardMaterial
            color="#00ff88"
            emissive="#00ff88"
            emissiveIntensity={2.0}
            toneMapped={false}
          />
        </mesh>
        <pointLight color="#00ff88" intensity={1.6} distance={3.5} />
      </group>

      {/* Fault Localization Pointer Beam (if scenario triggered) */}
      {faultBeamEnabled && isFailingBearing && (
        <LaserFaultBeam
          targetPosition={[0.0, 1.0, 0.0]}
          componentName="Spindle Roller Bearing"
          metricInfo="Peak Vib > 480 mm/s"
          severity="warning"
          onIsolate={() => onInspect("bearings")}
        />
      )}
      {faultBeamEnabled && isFailingMotor && (
        <LaserFaultBeam
          targetPosition={[-1.62, 1.0, 0.1]}
          componentName="Sumo Direct-Drive Motor"
          metricInfo="Thermal Hotspot > 68°C"
          severity="critical"
          onIsolate={() => onInspect("main_motor")}
        />
      )}

      {/* Left Frame Stanchion */}
      <mesh position={[-1.4, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 1.7, 1.5]} />
        {getComponentMaterial(mode, aeroBlue, temperature, false, selectedComponent === "drive_shaft", "frame")}
      </mesh>

      {/* Right Frame Stanchion */}
      <mesh position={[1.4, 0.85, 0]} castShadow receiveShadow>
        <boxGeometry args={[0.22, 1.7, 1.5]} />
        {getComponentMaterial(mode, aeroBlue, temperature, false, false, "frame")}
      </mesh>

      {/* Crossbars */}
      <mesh position={[0, 0.25, -0.55]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.7, 16]} rotation={[0, 0, Math.PI / 2]} />
        {getComponentMaterial(mode, titanium, temperature - 2, false, false)}
      </mesh>
      <mesh position={[0, 0.25, 0.55]} castShadow>
        <cylinderGeometry args={[0.08, 0.08, 2.7, 16]} rotation={[0, 0, Math.PI / 2]} />
        {getComponentMaterial(mode, titanium, temperature - 2, false, false)}
      </mesh>

      {/* SUMO DIRECT-DRIVE MOTOR (LEFT SIDE - EXPLODES OUTWARD ALONG X) */}
      <group
        ref={sumoMotorGroupRef}
        position={[-1.62, 0.9, 0.1]}
        onClick={(e) => {
          e.stopPropagation();
          onInspect("main_motor");
        }}
      >
        <group ref={motorRotorRef}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.3, 0.3, 0.42, 24]} />
            {getComponentMaterial(
              mode,
              graphite,
              isFailingMotor ? 68.4 : temperature,
              isFailingMotor,
              selectedComponent === "main_motor"
            )}
          </mesh>
          <mesh position={[-0.22, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
            <ringGeometry args={[0.18, 0.25, 24]} />
            <meshBasicMaterial color={isFailingMotor ? "#ef4444" : "#00e5ff"} toneMapped={false} />
          </mesh>
        </group>
        {/* XR Inspection Floating Label */}
        {mode === "xr" && (
          <Html position={[0, 0.45, 0]} center distanceFactor={6}>
            <div className="bg-slate-950/90 border border-cyan-400 px-2 py-0.5 rounded text-[9px] font-mono text-cyan-300 whitespace-nowrap shadow-glow-cyan">
              [SUMO DRIVE: 650 RPM | EFF: 97.8%]
            </div>
          </Html>
        )}
      </group>

      {/* MAIN DRIVE SHAFT & BEARINGS (LIFTS UPWARD ON EXPLODED VIEW) */}
      <group
        ref={mainShaftGroupRef}
        position={[0, 0.88, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onInspect("bearings");
        }}
      >
        <group ref={mainShaftSpinRef}>
          <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.07, 0.07, 2.7, 24]} />
            {getComponentMaterial(mode, "#cbd5e1", temperature - 3, false, selectedComponent === "bearings", "roller")}
          </mesh>
        </group>
        {/* Bearing Housings */}
        <mesh position={[-1.22, 0, 0]}>
          <boxGeometry args={[0.16, 0.2, 0.2]} />
          {getComponentMaterial(
            mode,
            "#334155",
            isFailingBearing ? 58.0 : temperature,
            isFailingBearing,
            selectedComponent === "bearings"
          )}
        </mesh>
        <mesh position={[1.22, 0, 0]}>
          <boxGeometry args={[0.16, 0.2, 0.2]} />
          {getComponentMaterial(mode, "#334155", temperature, false, selectedComponent === "bearings")}
        </mesh>
        {mode === "xr" && (
          <Html position={[0, 0.22, 0]} center distanceFactor={6}>
            <div className="bg-slate-950/90 border border-emerald-400 px-2 py-0.5 rounded text-[9px] font-mono text-emerald-300 whitespace-nowrap">
              [SPINDLE BEARING: ISO ZONE A | 84 mm/s]
            </div>
          </Html>
        )}
      </group>

      {/* SLEY & WEAVING REED (SHIFTS FORWARD ON EXPLODE) */}
      <group
        ref={sleyReedGroupRef}
        position={[0, 0.9, 0.15]}
        onClick={(e) => {
          e.stopPropagation();
          onInspect("loom_section");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[2.35, 0.08, 0.12]} />
          {getComponentMaterial(mode, aeroBlue, temperature - 2, false, selectedComponent === "loom_section")}
        </mesh>
        <mesh position={[0, 0.18, 0]} castShadow>
          <boxGeometry args={[2.25, 0.28, 0.02]} />
          {getComponentMaterial(mode, "#e2e8f0", temperature - 2, false, false)}
        </mesh>
      </group>

      {/* HEALD FRAMES */}
      <group position={[0, 0, -0.15]}>
        <group ref={healdFrame1Ref} position={[0, 1.1, -0.05]}>
          <mesh castShadow>
            <boxGeometry args={[2.3, 0.5, 0.02]} />
            <meshStandardMaterial color="#64748b" wireframe={true} />
          </mesh>
        </group>
        <group ref={healdFrame2Ref} position={[0, 1.1, 0.05]}>
          <mesh castShadow>
            <boxGeometry args={[2.3, 0.5, 0.02]} />
            <meshStandardMaterial color="#94a3b8" wireframe={true} />
          </mesh>
        </group>
      </group>

      {/* AIRFLOW NOZZLES & PARTICLES */}
      <group position={[-1.25, 1.05, 0.15]}>
        <mesh rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.025, 0.025, 0.15, 12]} />
          <meshStandardMaterial color="#00e5ff" />
        </mesh>
      </group>
      <points ref={airParticlesRef}>
        <bufferGeometry>
          <bufferAttribute
            attach="attributes-position"
            count={35}
            array={particlePositions}
            itemSize={3}
          />
        </bufferGeometry>
        <pointsMaterial size={0.035} color="#00e5ff" transparent opacity={0.8} />
      </points>

      {/* CLOTH TAKEUP ROLLER & FABRIC */}
      <group ref={takeupRollerGroupRef} position={[0, 0.55, 0.55]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 2.3, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.8} />
        </mesh>
      </group>
      <mesh position={[0, 0.95, 0.35]} rotation={[-0.45, 0, 0]} receiveShadow>
        <planeGeometry args={[2.2, 0.55]} />
        <meshStandardMaterial color="#f1f5f9" roughness={0.7} side={THREE.DoubleSide} />
      </mesh>

      {/* REAR PNEUMATIC VALVE CABINET (SLIDES BACKWARD ON EXPLODE) */}
      <group ref={valveCabinetGroupRef} position={[0, 0.6, -0.55]}>
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.22, 0.22, 2.3, 24]} />
          {getComponentMaterial(mode, "#cbd5e1", 30, false, selectedComponent === "power_unit")}
        </mesh>
      </group>
    </group>
  );
};
