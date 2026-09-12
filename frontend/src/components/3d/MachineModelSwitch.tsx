import React, { useRef, useMemo, useEffect } from "react";
import { useFrame } from "@react-three/fiber";
import { Html } from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { ViewportMode } from "../../types";
import { AlertTriangle, Wrench, Flame, Gauge, Zap, Sparkles } from "lucide-react";

interface MachineModelSwitchProps {
  machineId: string;
}

// Function to log/manage model loading semantics as requested:
function loadModel(modelFile: string) {
  if (typeof window !== "undefined") {
    (window as any).__ACTIVE_DIGITAL_TWIN_MODEL__ = modelFile;
  }
  return modelFile;
}

// =========================================================================
// FAULT LOCALIZATION LASER BEAM & 3D OVERHEAD POINTER
// =========================================================================
const FaultPointerBeam: React.FC<{
  targetPosition: [number, number, number];
  componentName: string;
  metricInfo: string;
  severity: "warning" | "critical";
  onIsolate: () => void;
}> = ({ targetPosition, componentName, metricInfo, severity, onIsolate }) => {
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

// =========================================================================
// MATERIAL RESOLVER HELPER (NORMAL, HOLOGRAPHIC, THERMAL, WIREFRAME, XR)
// =========================================================================
function getComponentMaterial(
  mode: ViewportMode,
  baseColor: string,
  temp: number,
  isFailing: boolean,
  isSelected: boolean,
  materialType: "frame" | "roller" | "belt" | "sensor" | "glass" | "default" = "default"
) {
  if (mode === "holographic") {
    return (
      <meshStandardMaterial
        color={isFailing ? "#ff0055" : isSelected ? "#38bdf8" : "#00e5ff"}
        emissive={isFailing ? "#ff0055" : "#00e5ff"}
        emissiveIntensity={0.85}
        transparent={true}
        opacity={0.38}
        wireframe={false}
      />
    );
  }

  if (mode === "thermal") {
    // Blue: Cool (<35), Green: Normal (35-45), Orange: Warning (45-60), Red: Critical (>60)
    const thermalColor =
      temp < 35 ? "#0077b6" : temp < 45 ? "#10b981" : temp < 60 ? "#f59e0b" : "#ef4444";
    return (
      <meshStandardMaterial
        color={thermalColor}
        emissive={thermalColor}
        emissiveIntensity={0.8}
        roughness={0.4}
        metalness={0.2}
      />
    );
  }

  if (mode === "wireframe") {
    return (
      <meshBasicMaterial
        color={isFailing ? "#ef4444" : isSelected ? "#38bdf8" : "#00e5ff"}
        wireframe={true}
      />
    );
  }

  // Normal / XR inspection mode with realistic PBR specs
  if (isFailing) {
    return (
      <meshStandardMaterial
        color="#ef4444"
        emissive="#ff0055"
        emissiveIntensity={1.0}
        metalness={0.8}
        roughness={0.2}
        toneMapped={false}
      />
    );
  }

  if (isSelected) {
    return (
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#00e5ff"
        emissiveIntensity={0.8}
        metalness={0.85}
        roughness={0.25}
        toneMapped={false}
      />
    );
  }

  // Specialized PBR Material Presets
  switch (materialType) {
    case "frame":
      // Powder-Coated Steel Chassis
      return (
        <meshStandardMaterial
          color={baseColor}
          metalness={0.65}
          roughness={0.34}
        />
      );
    case "roller":
      // Brushed High-Finish Aluminium
      return (
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.94}
          roughness={0.18}
        />
      );
    case "belt":
      // Industrial Textured Rubber
      return (
        <meshStandardMaterial
          color="#18181b"
          metalness={0.06}
          roughness={0.88}
        />
      );
    case "sensor":
      // Gloss Piano Black Housing
      return (
        <meshStandardMaterial
          color="#05070a"
          metalness={0.2}
          roughness={0.12}
        />
      );
    case "glass":
      // Translucent Inspection Assembly Enclosure
      return (
        <meshStandardMaterial
          color="#e0f2fe"
          metalness={0.1}
          roughness={0.1}
          transparent={true}
          opacity={0.55}
        />
      );
    default:
      return (
        <meshStandardMaterial
          color={baseColor}
          metalness={0.75}
          roughness={0.3}
        />
      );
  }
}

// =========================================================================
// 1. PICANOL OMNIPLUS SUMMUM 3D DIGITAL TWIN
// =========================================================================
const PicanolTwin: React.FC<{
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
}> = ({
  rpm,
  vibration,
  temperature,
  health,
  status,
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
        <FaultPointerBeam
          targetPosition={[0.0, 1.0, 0.0]}
          componentName="Spindle Roller Bearing"
          metricInfo="Peak Vib > 480 mm/s"
          severity="warning"
          onIsolate={() => onInspect("bearings")}
        />
      )}
      {faultBeamEnabled && isFailingMotor && (
        <FaultPointerBeam
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

// =========================================================================
// 2. TOYOTA JAT910 3D DIGITAL TWIN
// =========================================================================
const ToyotaTwin: React.FC<{
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
}> = ({
  rpm,
  vibration,
  temperature,
  health,
  status,
  mode,
  isExploded,
  faultBeamEnabled,
  activeScenario,
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

// =========================================================================
// 3. TSUDAKOMA ZAX001 NEO PLUS 3D DIGITAL TWIN (WARNING / FAULT FOCUS)
// =========================================================================
const TsudakomaTwin: React.FC<{
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
}> = ({
  rpm,
  vibration,
  temperature,
  health,
  status,
  mode,
  isExploded,
  faultBeamEnabled,
  activeScenario,
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
        <FaultPointerBeam
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

// =========================================================================
// MAIN DIGITAL TWIN MODEL ROUTER
// =========================================================================
export const MachineModelSwitch: React.FC<MachineModelSwitchProps> = ({ machineId }) => {
  const {
    displayTelemetry,
    viewportMode,
    isExploded,
    faultBeamEnabled,
    activeScenario,
    selectedComponent,
    setSelectedComponent,
    setCameraPreset,
  } = useTwin();

  const telemetry = displayTelemetry;
  const rpm = telemetry?.sensors?.rpm ?? 650;
  const vibration = telemetry?.sensors?.vibration ?? 100;
  const temperature = telemetry?.sensors?.temperature ?? 32;
  const health = telemetry?.overall_health_score ?? 98;
  const status = telemetry?.overall_status ?? "Healthy";

  // Trigger loadModel semantics
  useEffect(() => {
    if (machineId === "toyota") {
      loadModel("toyota_jat910.glb");
    } else if (machineId === "tsudakoma") {
      loadModel("tsudakoma_zax001.glb");
    } else {
      loadModel("picanol.glb");
    }
  }, [machineId]);

  const handleInspect = (compKey: string) => {
    setSelectedComponent(compKey);
    if (compKey === "main_motor") setCameraPreset("motor");
    else if (compKey === "bearings") setCameraPreset("bearings");
    else if (compKey === "loom_section") setCameraPreset("loom");
    else if (compKey === "belt_system") setCameraPreset("belt");
  };

  if (machineId === "toyota") {
    return (
      <ToyotaTwin
        rpm={rpm}
        vibration={vibration}
        temperature={temperature}
        health={health}
        status={status}
        mode={viewportMode}
        isExploded={isExploded}
        faultBeamEnabled={faultBeamEnabled}
        activeScenario={activeScenario}
        selectedComponent={selectedComponent}
        onInspect={handleInspect}
      />
    );
  }

  if (machineId === "tsudakoma") {
    return (
      <TsudakomaTwin
        rpm={rpm}
        vibration={vibration}
        temperature={temperature}
        health={health}
        status={status}
        mode={viewportMode}
        isExploded={isExploded}
        faultBeamEnabled={faultBeamEnabled}
        activeScenario={activeScenario}
        selectedComponent={selectedComponent}
        onInspect={handleInspect}
      />
    );
  }

  // Default: Picanol OmniPlus Summum
  return (
    <PicanolTwin
      rpm={rpm}
      vibration={vibration}
      temperature={temperature}
      health={health}
      status={status}
      mode={viewportMode}
      isExploded={isExploded}
      faultBeamEnabled={faultBeamEnabled}
      activeScenario={activeScenario}
      selectedComponent={selectedComponent}
      onInspect={handleInspect}
    />
  );
};
