import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";

import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { soundEffects } from "../../utils/soundEffects";

export const TextileMachine: React.FC = () => {
  const { displayTelemetry, selectedComponent, setSelectedComponent, wireframeMode, viewportMode, setCameraPreset } = useTwin();

  // References for dynamic animated sub-assemblies
  const machineRootRef = useRef<THREE.Group>(null);
  const motorShaftRef = useRef<THREE.Group>(null);
  const coolingFanRef = useRef<THREE.Group>(null);
  const driveShaftRef = useRef<THREE.Group>(null);
  const beltPulley1Ref = useRef<THREE.Mesh>(null);
  const beltPulley2Ref = useRef<THREE.Group>(null);
  const loomHealdFrameRef = useRef<THREE.Group>(null);
  const loomReedRef = useRef<THREE.Group>(null);

  const telemetry = displayTelemetry;
  const rpm = telemetry?.sensors?.rpm ?? 0;
  const vibration = telemetry?.sensors?.vibration ?? 0;
  const healthScore = telemetry?.overall_health_score ?? 100;
  const componentsHealth = telemetry?.components;

  const handlePointerOver = (e: any) => {
    e.stopPropagation();
    document.body.style.cursor = "pointer";
  };

  const handlePointerOut = () => {
    document.body.style.cursor = "auto";
  };

  // Phase 8 & 12: Double-click component inspection
  const handleComponentDoubleClick = (compKey: string, preset: any) => {
    soundEffects.playInspectionSound();
    setSelectedComponent(compKey);
    setCameraPreset(preset);
  };

  // Phase 9: Multi-stop Thermal Heat Map gradient
  // Blue -> Cool (<35)
  // Green -> Normal (35-45)
  // Yellow -> Warm (45-55)
  // Orange -> Hot (55-65)
  // Red -> Critical (>65)
  const getThermalColor = (temp: number) => {
    if (temp < 35) return "#0077b6"; // Cool Blue
    if (temp < 45) return "#10b981"; // Normal Green
    if (temp < 55) return "#eab308"; // Warm Yellow
    if (temp < 65) return "#f97316"; // Hot Orange
    return "#ff0055"; // Critical Red
  };

  // Animation Loop (60 FPS)
  useFrame((state, delta) => {
    // 1. Rotation speed derived from real-time RPM
    const angularSpeed = (rpm / 60) * Math.PI * 2 * delta;

    if (motorShaftRef.current) motorShaftRef.current.rotation.x += angularSpeed;
    if (coolingFanRef.current) coolingFanRef.current.rotation.x += angularSpeed * 1.5;
    if (driveShaftRef.current) driveShaftRef.current.rotation.x += angularSpeed;
    if (beltPulley2Ref.current) beltPulley2Ref.current.rotation.x += angularSpeed * 0.85;

    // 2. Loom Beat-Up Motion (Reciprocating back & forth)
    if (loomHealdFrameRef.current) {
      if (rpm > 20) {
        const beatCycle = state.clock.getElapsedTime() * (rpm / 60) * Math.PI * 2;
        loomHealdFrameRef.current.position.y = 1.05 + Math.sin(beatCycle) * 0.12;
        if (loomReedRef.current) {
          loomReedRef.current.position.z = -0.15 + Math.cos(beatCycle) * 0.22;
          loomReedRef.current.rotation.x = Math.sin(beatCycle) * 0.15;
        }
      } else {
        loomHealdFrameRef.current.position.y = 1.05;
        if (loomReedRef.current) {
          loomReedRef.current.position.z = -0.15;
          loomReedRef.current.rotation.x = 0;
        }
      }
    }

    // 3. Vibration Shaking Simulation
    if (machineRootRef.current) {
      if (vibration > 300) {
        const jitterIntensity = Math.min(0.045, ((vibration - 300) / 1000) * 0.035);
        const freq = state.clock.getElapsedTime() * 75;
        machineRootRef.current.position.x = Math.sin(freq * 1.1) * jitterIntensity;
        machineRootRef.current.position.y = Math.cos(freq * 0.9) * (jitterIntensity * 0.7);
        machineRootRef.current.position.z = Math.sin(freq * 1.3) * (jitterIntensity * 0.5);
      } else {
        machineRootRef.current.position.set(0, 0, 0);
      }
    }
  });

  // Phase 5: Intelligent Component Visualization (Neon Green, Electric Blue, Amber, Red)
  const getComponentVisuals = (compKey: string, defaultColor: string) => {
    const comp = componentsHealth ? componentsHealth[compKey] : null;
    const isCompSelected = selectedComponent === compKey;
    const isFailing = comp?.is_failing || (comp?.health_score !== undefined && comp.health_score < 50);
    const score = comp?.health_score ?? healthScore;
    const temp = comp?.temperature ?? telemetry?.sensors?.temperature ?? 32;

    if (viewportMode === "thermal") {
      const thermalColor = getThermalColor(temp);
      return {
        color: thermalColor,
        emissive: thermalColor,
        emissiveIntensity: 0.7,
        wireframe: false,
      };
    }

    if (isFailing) {
      return {
        color: "#dc2626",
        emissive: "#ff0055",
        emissiveIntensity: 0.9,
        wireframe: wireframeMode,
      };
    }

    // Phase 5 color mapping:
    // Excellent (>= 85): Neon Green
    // Good (70-85): Electric Blue
    // Attention Needed (50-70): Amber
    // Critical (< 50): Red
    let glowColor = "#00ff88"; // Neon Green
    if (score < 50) {
      glowColor = "#ff0055"; // Red
    } else if (score < 70) {
      glowColor = "#ffb703"; // Amber
    } else if (score < 85) {
      glowColor = "#00e5ff"; // Electric Blue
    }

    return {
      color: isCompSelected ? "#38bdf8" : defaultColor,
      emissive: glowColor,
      emissiveIntensity: isCompSelected ? 0.8 : 0.25,
      wireframe: wireframeMode,
    };
  };

  const isSelected = (compKey: string) => selectedComponent === compKey;

  const motorTemp = (telemetry?.sensors?.temperature ?? 0).toFixed(1);
  const motorLoad = (telemetry?.sensors?.motor_load ?? 0).toFixed(0);
  const bearingVib = (telemetry?.sensors?.vibration ?? 0).toFixed(1);

  const motorVis = getComponentVisuals("main_motor", "#25344d");
  const beltVis = getComponentVisuals("belt_system", "#64748b");
  const shaftVis = getComponentVisuals("drive_shaft", "#cbd5e1");
  const bearingVis = getComponentVisuals("bearings", "#1e293b");
  const loomVis = getComponentVisuals("loom_section", "#475569");
  const powerVis = getComponentVisuals("power_unit", "#1e293b");

  return (
    <group ref={machineRootRef} position={[0, 0, 0]}>
      {/* ========================================================= */}
      {/* 1. CAST IRON BASE BED & STRUCTURAL CHASSIS                 */}
      {/* ========================================================= */}
      <group position={[0, 0, 0]}>
        {/* Main Machine Bed */}
        <mesh position={[0, 0.15, 0]} castShadow receiveShadow>
          <boxGeometry args={[4.4, 0.3, 2.0]} />
          <meshStandardMaterial
            color="#1e293b"
            roughness={0.65}
            metalness={0.7}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Safety Hazard Stripes On Front Edge */}
        <mesh position={[0, 0.301, 0.95]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[4.2, 0.08]} />
          <meshBasicMaterial color="#eab308" />
        </mesh>

        {/* Vibration Isolation Dampener Feet */}
        {[-1.9, 1.9].map((x) =>
          [-0.8, 0.8].map((z) => (
            <mesh key={`${x}-${z}`} position={[x, 0.04, z]} castShadow>
              <cylinderGeometry args={[0.12, 0.15, 0.08, 16]} />
              <meshStandardMaterial color="#0f172a" roughness={0.9} />
            </mesh>
          ))
        )}

        {/* Side Structural Uprights (A-Frames) */}
        <mesh position={[-1.85, 1.1, 0]} castShadow>
          <boxGeometry args={[0.22, 1.6, 1.7]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} wireframe={wireframeMode} />
        </mesh>
        <mesh position={[1.85, 1.1, 0]} castShadow>
          <boxGeometry args={[0.22, 1.6, 1.7]} />
          <meshStandardMaterial color="#334155" roughness={0.5} metalness={0.6} wireframe={wireframeMode} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 2. MAIN MOTOR SUB-ASSEMBLY                                 */}
      {/* ========================================================= */}
      <group
        position={[-1.3, 0.75, 0.55]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("main_motor") ? null : "main_motor");
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleComponentDoubleClick("main_motor", "motor");
        }}
      >
        {/* Motor Stator Body with Cooling Fins */}
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.85, 24]} />
          <meshStandardMaterial
            color={motorVis.color}
            emissive={motorVis.emissive}
            emissiveIntensity={motorVis.emissiveIntensity}
            roughness={0.4}
            metalness={0.8}
            wireframe={motorVis.wireframe}
          />
        </mesh>

        {/* Motor Cooling Fins (Procedural Rings) */}
        {[-0.3, -0.15, 0, 0.15, 0.3].map((off, i) => (
          <mesh key={i} position={[off, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.37, 0.37, 0.025, 24]} />
            <meshStandardMaterial
              color={viewportMode === "thermal" ? motorVis.color : "#1e293b"}
              metalness={0.9}
              roughness={0.3}
              wireframe={wireframeMode}
            />
          </mesh>
        ))}

        {/* Motor Terminal / Junction Box */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.28, 0.18, 0.22]} />
          <meshStandardMaterial
            color={viewportMode === "thermal" ? motorVis.color : "#0f172a"}
            roughness={0.5}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Motor Shaft & Pulley Hub */}
        <group ref={motorShaftRef} position={[0.48, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.22, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} wireframe={wireframeMode} />
          </mesh>
          {/* Drive Pulley */}
          <mesh ref={beltPulley1Ref} position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
            <meshStandardMaterial
              color={viewportMode === "thermal" ? beltVis.color : "#475569"}
              metalness={0.85}
              roughness={0.3}
              wireframe={wireframeMode}
            />
          </mesh>
        </group>

        {/* Cooling Fan Cowl & Spinning Fan */}
        <group position={[-0.48, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.33, 0.33, 0.15, 24]} />
            <meshStandardMaterial
              color={viewportMode === "thermal" ? motorVis.color : "#0284c7"}
              metalness={0.6}
              roughness={0.4}
              wireframe={wireframeMode}
            />
          </mesh>
          <group ref={coolingFanRef}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <mesh key={deg} rotation={[THREE.MathUtils.degToRad(deg), 0, 0]}>
                <boxGeometry args={[0.02, 0.26, 0.06]} />
                <meshStandardMaterial color={viewportMode === "thermal" ? motorVis.color : "#38bdf8"} wireframe={wireframeMode} />
              </mesh>
            ))}
          </group>
        </group>


      </group>

      {/* ========================================================= */}
      {/* 3. BELT & PULLEY TRANSMISSION SYSTEM                       */}
      {/* ========================================================= */}
      <group
        position={[-0.65, 0.95, 0.55]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("belt_system") ? null : "belt_system");
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleComponentDoubleClick("belt_system", "belt");
        }}
      >
        {/* Upper Driven Pulley */}
        <group ref={beltPulley2Ref} position={[0, 0.45, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
            <meshStandardMaterial
              color={beltVis.color}
              emissive={beltVis.emissive}
              emissiveIntensity={beltVis.emissiveIntensity}
              metalness={0.8}
              roughness={0.3}
              wireframe={beltVis.wireframe}
            />
          </mesh>
        </group>

        {/* Dual Heavy-Duty Timing Belts */}
        <mesh position={[-0.08, 0.05, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.04, 0.95, 0.07]} />
          <meshStandardMaterial
            color={beltVis.color}
            roughness={0.8}
            emissive={beltVis.emissive}
            emissiveIntensity={beltVis.emissiveIntensity}
            wireframe={beltVis.wireframe}
          />
        </mesh>
        <mesh position={[0.08, 0.05, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.04, 0.95, 0.07]} />
          <meshStandardMaterial
            color={beltVis.color}
            roughness={0.8}
            emissive={beltVis.emissive}
            emissiveIntensity={beltVis.emissiveIntensity * 0.7}
            wireframe={beltVis.wireframe}
          />
        </mesh>

        {/* Belt Tension Guard Shell */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.32, 1.15, 0.16]} />
          <meshStandardMaterial
            color={viewportMode === "thermal" ? beltVis.color : "#38bdf8"}
            transparent
            opacity={wireframeMode ? 0.8 : 0.18}
            wireframe={wireframeMode}
          />
        </mesh>


      </group>

      {/* ========================================================= */}
      {/* 4. MAIN DRIVE SHAFT & BEARING HOUSINGS                    */}
      {/* ========================================================= */}
      <group position={[0, 1.4, 0.55]}>
        {/* Rotating Stainless Steel Drive Shaft */}
        <group
          ref={driveShaftRef}
          position={[0, 0, 0]}
          onPointerOver={handlePointerOver}
          onPointerOut={handlePointerOut}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedComponent(isSelected("drive_shaft") ? null : "drive_shaft");
          }}
          onDoubleClick={(e) => {
            e.stopPropagation();
            handleComponentDoubleClick("drive_shaft", "motor");
          }}
        >
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 3.5, 24]} />
            <meshStandardMaterial
              color={shaftVis.color}
              emissive={shaftVis.emissive}
              emissiveIntensity={shaftVis.emissiveIntensity}
              metalness={0.95}
              roughness={0.15}
              wireframe={shaftVis.wireframe}
            />
          </mesh>

          {/* Shaft Cam Wheels & Eccentrics */}
          {[-1.0, -0.3, 0.3, 1.0].map((pos, idx) => (
            <mesh key={idx} position={[pos, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.06, 16]} />
              <meshStandardMaterial
                color={viewportMode === "thermal" ? shaftVis.color : "#475569"}
                metalness={0.8}
                roughness={0.3}
                wireframe={wireframeMode}
              />
            </mesh>
          ))}
        </group>

        {/* Bearing Pillow Blocks (Non-rotating precision housings) */}
        {[-1.6, -0.55, 0.55, 1.6].map((xPos, idx) => (
          <group
            key={idx}
            position={[xPos, 0, 0]}
            onPointerOver={handlePointerOver}
            onPointerOut={handlePointerOut}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedComponent(isSelected("bearings") ? null : "bearings");
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              handleComponentDoubleClick("bearings", "bearings");
            }}
          >
            {/* Pillow Block Cast Housing */}
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.26, 0.22]} />
              <meshStandardMaterial
                color={bearingVis.color}
                emissive={bearingVis.emissive}
                emissiveIntensity={bearingVis.emissiveIntensity}
                roughness={0.5}
                metalness={0.7}
                wireframe={bearingVis.wireframe}
              />
            </mesh>
            {/* Grease Nipple / Lubrication Port */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.9} />
            </mesh>
          </group>
        ))}


      </group>

      {/* ========================================================= */}
      {/* 5. LOOM SECTION (Heald Frames, Sley Sword, Reed & Shed)    */}
      {/* ========================================================= */}
      <group
        position={[0, 0, 0]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("loom_section") ? null : "loom_section");
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleComponentDoubleClick("loom_section", "loom");
        }}
      >
        {/* Reciprocating Heald Harness Frames */}
        <group ref={loomHealdFrameRef} position={[0, 1.05, -0.3]}>
          {[-0.08, 0.08].map((zOffset, idx) => (
            <mesh key={idx} position={[0, 0, zOffset]} castShadow>
              <boxGeometry args={[2.8, 0.75, 0.03]} />
              <meshStandardMaterial
                color={loomVis.color}
                emissive={loomVis.emissive}
                emissiveIntensity={loomVis.emissiveIntensity}
                wireframe={loomVis.wireframe}
              />
            </mesh>
          ))}
          {/* Vertical Wire Healds Texture / Representation */}
          <mesh position={[0, 0, 0]}>
            <planeGeometry args={[2.7, 0.65]} />
            <meshStandardMaterial
              color="#94a3b8"
              transparent
              opacity={0.35}
              wireframe={wireframeMode}
              side={THREE.DoubleSide}
            />
          </mesh>
        </group>

        {/* Oscillating Reed & Sley Sword */}
        <group ref={loomReedRef} position={[0, 0.85, -0.15]}>
          {/* Sley Beam */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[2.9, 0.12, 0.16]} />
            <meshStandardMaterial
              color={viewportMode === "thermal" ? loomVis.color : "#334155"}
              roughness={0.4}
              metalness={0.7}
              wireframe={wireframeMode}
            />
          </mesh>
          {/* Steel Reed Comb */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[2.8, 0.32, 0.02]} />
            <meshStandardMaterial
              color={viewportMode === "thermal" ? loomVis.color : "#cbd5e1"}
              metalness={0.9}
              roughness={0.2}
              wireframe={wireframeMode}
            />
          </mesh>
        </group>

        {/* Warp Yarn Beam (Back of machine) */}
        <mesh position={[0, 0.75, -0.75]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 2.9, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} wireframe={wireframeMode} />
        </mesh>

        {/* Woven Fabric Cloth Roll (Front of machine) */}
        <mesh position={[0, 0.55, 0.75]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 2.8, 24]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} wireframe={wireframeMode} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 6. INDUSTRIAL POWER UNIT & INVERTER ENCLOSURE              */}
      {/* ========================================================= */}
      <group
        position={[1.55, 0.95, -0.55]}
        onPointerOver={handlePointerOver}
        onPointerOut={handlePointerOut}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("power_unit") ? null : "power_unit");
        }}
        onDoubleClick={(e) => {
          e.stopPropagation();
          handleComponentDoubleClick("power_unit", "top");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.55, 1.1, 0.65]} />
          <meshStandardMaterial
            color={powerVis.color}
            emissive={powerVis.emissive}
            emissiveIntensity={powerVis.emissiveIntensity}
            roughness={0.3}
            metalness={0.75}
            wireframe={powerVis.wireframe}
          />
        </mesh>

        {/* Cabinet Door Seam & Vent Grills */}
        <mesh position={[0.28, 0, 0]} rotation={[0, Math.PI / 2, 0]}>
          <planeGeometry args={[0.6, 0.95]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} side={THREE.DoubleSide} wireframe={wireframeMode} />
        </mesh>

        {/* Live Status Pilot Lights (Green / Amber / Red LEDs) */}
        <mesh position={[0.282, 0.35, 0.15]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color={healthScore > 75 ? "#10b981" : "#047857"} />
        </mesh>
        <mesh position={[0.282, 0.35, 0.0]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color={healthScore <= 75 && healthScore > 50 ? "#f59e0b" : "#78350f"} />
        </mesh>
        <mesh position={[0.282, 0.35, -0.15]}>
          <sphereGeometry args={[0.025, 16, 16]} />
          <meshBasicMaterial color={healthScore <= 50 ? "#ef4444" : "#7f1d1d"} />
        </mesh>
      </group>
    </group>
  );
};
