import React, { useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { Html } from "@react-three/drei";

export const TextileMachine: React.FC = () => {
  const { telemetry, selectedComponent, setSelectedComponent, wireframeMode } = useTwin();

  // References for dynamic animated sub-assemblies
  const machineRootRef = useRef<THREE.Group>(null);
  const motorShaftRef = useRef<THREE.Group>(null);
  const coolingFanRef = useRef<THREE.Group>(null);
  const driveShaftRef = useRef<THREE.Group>(null);
  const beltPulley1Ref = useRef<THREE.Group>(null);
  const beltPulley2Ref = useRef<THREE.Group>(null);
  const loomHealdFrameRef = useRef<THREE.Group>(null);
  const loomReedRef = useRef<THREE.Group>(null);

  const rpm = telemetry?.sensors.rpm || 0;
  const vibration = telemetry?.sensors.vibration || 0;
  const healthScore = telemetry?.overall_health_score ?? 100;
  const componentsHealth = telemetry?.components;

  // Animation Loop (60 FPS)
  useFrame((state, delta) => {
    // 1. Rotation speed derived from real-time RPM
    // 600 RPM = 10 rev/sec = 20 * PI rad/sec
    const angularSpeed = (rpm / 60) * Math.PI * 2 * delta;

    if (motorShaftRef.current) motorShaftRef.current.rotation.x += angularSpeed;
    if (coolingFanRef.current) coolingFanRef.current.rotation.x += angularSpeed * 1.5;
    if (driveShaftRef.current) driveShaftRef.current.rotation.x += angularSpeed;
    if (beltPulley1Ref.current) beltPulley1Ref.current.rotation.x += angularSpeed;
    if (beltPulley2Ref.current) beltPulley2Ref.current.rotation.x += angularSpeed * 0.85;

    // 2. Loom Beat-Up Motion (Reciprocating back & forth)
    if (loomHealdFrameRef.current && rpm > 20) {
      const beatCycle = state.clock.getElapsedTime() * (rpm / 60) * Math.PI * 2;
      loomHealdFrameRef.current.position.y = 1.05 + Math.sin(beatCycle) * 0.12;
      if (loomReedRef.current) {
        loomReedRef.current.position.z = -0.15 + Math.cos(beatCycle) * 0.22;
        loomReedRef.current.rotation.x = Math.sin(beatCycle) * 0.15;
      }
    }

    // 3. Vibration Shaking Simulation
    // When vibration rises past 450 mm/s, add high-frequency displacement jitter
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

  // Color selection helper
  const getGlowColor = (compKey: string) => {
    if (componentsHealth && componentsHealth[compKey]) {
      return componentsHealth[compKey].glow_color;
    }
    return healthScore > 75 ? "#10b981" : healthScore > 50 ? "#f59e0b" : "#ef4444";
  };

  const isSelected = (compKey: string) => selectedComponent === compKey;

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
        <mesh position={[0, 0.301, 0.95]}>
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
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("main_motor") ? null : "main_motor");
        }}
      >
        {/* Motor Stator Body with Cooling Fins */}
        <mesh castShadow rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.34, 0.34, 0.85, 24]} />
          <meshStandardMaterial
            color={isSelected("main_motor") ? "#38bdf8" : "#25344d"}
            emissive={getGlowColor("main_motor")}
            emissiveIntensity={isSelected("main_motor") ? 0.7 : 0.25}
            roughness={0.4}
            metalness={0.8}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Motor Cooling Fins (Procedural Rings) */}
        {[-0.3, -0.15, 0, 0.15, 0.3].map((off, i) => (
          <mesh key={i} position={[off, 0, 0]} rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.37, 0.37, 0.025, 24]} />
            <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.3} />
          </mesh>
        ))}

        {/* Motor Terminal / Junction Box */}
        <mesh position={[0, 0.38, 0]} castShadow>
          <boxGeometry args={[0.28, 0.18, 0.22]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>

        {/* Motor Shaft & Pulley Hub */}
        <group ref={motorShaftRef} position={[0.48, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.065, 0.065, 0.22, 16]} />
            <meshStandardMaterial color="#94a3b8" metalness={0.95} roughness={0.15} />
          </mesh>
          {/* Drive Pulley */}
          <mesh ref={beltPulley1Ref} position={[0.06, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.18, 0.18, 0.08, 24]} />
            <meshStandardMaterial
              color="#475569"
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
            <meshStandardMaterial color="#0284c7" metalness={0.6} roughness={0.4} />
          </mesh>
          <group ref={coolingFanRef}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <mesh key={deg} rotation={[THREE.MathUtils.degToRad(deg), 0, 0]}>
                <boxGeometry args={[0.02, 0.26, 0.06]} />
                <meshStandardMaterial color="#38bdf8" />
              </mesh>
            ))}
          </group>
        </group>

        {/* Floating Live 3D Badge */}
        {isSelected("main_motor") && (
          <Html position={[0, 0.65, 0]} center distanceFactor={8}>
            <div className="bg-industrial-900/90 text-cyan-200 border border-cyan-400/80 px-2 py-1 rounded shadow-glow-cyan text-xs font-hud whitespace-nowrap pointer-events-none">
              MOTOR: {telemetry?.sensors.temperature.toFixed(1)}°C | LOAD: {telemetry?.sensors.motor_load.toFixed(0)}A
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================= */}
      {/* 3. BELT & PULLEY TRANSMISSION SYSTEM                       */}
      {/* ========================================================= */}
      <group
        position={[-0.65, 0.95, 0.55]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("belt_system") ? null : "belt_system");
        }}
      >
        {/* Upper Driven Pulley */}
        <group ref={beltPulley2Ref} position={[0, 0.45, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 24]} />
            <meshStandardMaterial
              color="#64748b"
              emissive={getGlowColor("belt_system")}
              emissiveIntensity={isSelected("belt_system") ? 0.6 : 0.2}
              metalness={0.8}
              roughness={0.3}
              wireframe={wireframeMode}
            />
          </mesh>
        </group>

        {/* Dual Heavy-Duty Timing Belts */}
        <mesh position={[-0.08, 0.05, 0]} rotation={[0, 0, 0.45]}>
          <boxGeometry args={[0.04, 0.95, 0.07]} />
          <meshStandardMaterial
            color="#0f172a"
            roughness={0.8}
            emissive={getGlowColor("belt_system")}
            emissiveIntensity={isSelected("belt_system") ? 0.5 : 0.1}
          />
        </mesh>
        <mesh position={[0.08, 0.05, 0]} rotation={[0, 0, -0.45]}>
          <boxGeometry args={[0.04, 0.95, 0.07]} />
          <meshStandardMaterial color="#0f172a" roughness={0.8} />
        </mesh>

        {/* Belt Tension Guard Shell */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[0.32, 1.15, 0.16]} />
          <meshStandardMaterial
            color="#38bdf8"
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
        <group ref={driveShaftRef} position={[0, 0, 0]}>
          <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
            <cylinderGeometry args={[0.055, 0.055, 3.5, 24]} />
            <meshStandardMaterial
              color={isSelected("drive_shaft") ? "#38bdf8" : "#cbd5e1"}
              emissive={getGlowColor("drive_shaft")}
              emissiveIntensity={isSelected("drive_shaft") ? 0.7 : 0.2}
              metalness={0.95}
              roughness={0.15}
              wireframe={wireframeMode}
            />
          </mesh>

          {/* Shaft Cam Wheels & Eccentrics */}
          {[-1.0, -0.3, 0.3, 1.0].map((pos, idx) => (
            <mesh key={idx} position={[pos, 0.03, 0]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.11, 0.11, 0.06, 16]} />
              <meshStandardMaterial color="#475569" metalness={0.8} roughness={0.3} />
            </mesh>
          ))}
        </group>

        {/* Bearing Pillow Blocks (Non-rotating precision housings) */}
        {[-1.6, -0.55, 0.55, 1.6].map((xPos, idx) => (
          <group
            key={idx}
            position={[xPos, 0, 0]}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedComponent(isSelected("bearings") ? null : "bearings");
            }}
          >
            {/* Pillow Block Cast Housing */}
            <mesh castShadow>
              <boxGeometry args={[0.18, 0.26, 0.22]} />
              <meshStandardMaterial
                color={isSelected("bearings") ? "#38bdf8" : "#1e293b"}
                emissive={getGlowColor("bearings")}
                emissiveIntensity={isSelected("bearings") ? 0.8 : 0.35}
                roughness={0.5}
                metalness={0.7}
                wireframe={wireframeMode}
              />
            </mesh>
            {/* Grease Nipple / Lubrication Port */}
            <mesh position={[0, 0.15, 0]}>
              <cylinderGeometry args={[0.015, 0.015, 0.05, 8]} />
              <meshStandardMaterial color="#f59e0b" metalness={0.9} />
            </mesh>
          </group>
        ))}

        {/* Floating Bearing HUD Badge */}
        {isSelected("bearings") && (
          <Html position={[0.55, 0.45, 0]} center distanceFactor={8}>
            <div className="bg-industrial-900/90 text-amber-300 border border-amber-400 px-2 py-1 rounded shadow-glow-amber text-xs font-hud whitespace-nowrap pointer-events-none">
              BEARINGS: {telemetry?.sensors.vibration.toFixed(1)} mm/s RMS (ISO 10816)
            </div>
          </Html>
        )}
      </group>

      {/* ========================================================= */}
      {/* 5. LOOM SECTION (Heald Frames, Sley Sword, Reed & Shed)    */}
      {/* ========================================================= */}
      <group
        position={[0, 0, 0]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("loom_section") ? null : "loom_section");
        }}
      >
        {/* Reciprocating Heald Harness Frames */}
        <group ref={loomHealdFrameRef} position={[0, 1.05, -0.3]}>
          {[-0.08, 0.08].map((zOffset, idx) => (
            <mesh key={idx} position={[0, 0, zOffset]} castShadow>
              <boxGeometry args={[2.8, 0.75, 0.03]} />
              <meshStandardMaterial
                color={isSelected("loom_section") ? "#38bdf8" : "#475569"}
                emissive={getGlowColor("loom_section")}
                emissiveIntensity={isSelected("loom_section") ? 0.6 : 0.2}
                wireframe={wireframeMode}
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
            />
          </mesh>
        </group>

        {/* Oscillating Reed & Sley Sword */}
        <group ref={loomReedRef} position={[0, 0.85, -0.15]}>
          {/* Sley Beam */}
          <mesh position={[0, 0, 0]} castShadow>
            <boxGeometry args={[2.9, 0.12, 0.16]} />
            <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
          </mesh>
          {/* Steel Reed Comb */}
          <mesh position={[0, 0.22, 0]} castShadow>
            <boxGeometry args={[2.8, 0.32, 0.02]} />
            <meshStandardMaterial
              color="#cbd5e1"
              metalness={0.9}
              roughness={0.2}
              wireframe={wireframeMode}
            />
          </mesh>
        </group>

        {/* Warp Yarn Beam (Back of machine) */}
        <mesh position={[0, 0.75, -0.75]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.32, 0.32, 2.9, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.9} />
        </mesh>

        {/* Woven Fabric Cloth Roll (Front of machine) */}
        <mesh position={[0, 0.55, 0.75]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.24, 0.24, 2.8, 24]} />
          <meshStandardMaterial color="#e2e8f0" roughness={0.8} />
        </mesh>
      </group>

      {/* ========================================================= */}
      {/* 6. INDUSTRIAL POWER UNIT & INVERTER ENCLOSURE              */}
      {/* ========================================================= */}
      <group
        position={[1.55, 0.95, -0.55]}
        onClick={(e) => {
          e.stopPropagation();
          setSelectedComponent(isSelected("power_unit") ? null : "power_unit");
        }}
      >
        <mesh castShadow>
          <boxGeometry args={[0.55, 1.1, 0.65]} />
          <meshStandardMaterial
            color={isSelected("power_unit") ? "#38bdf8" : "#1e293b"}
            emissive={getGlowColor("power_unit")}
            emissiveIntensity={isSelected("power_unit") ? 0.7 : 0.2}
            roughness={0.3}
            metalness={0.75}
            wireframe={wireframeMode}
          />
        </mesh>

        {/* Cabinet Door Seam & Vent Grills */}
        <mesh position={[0.28, 0, 0]}>
          <planeGeometry args={[0.6, 0.95]} />
          <meshStandardMaterial color="#0f172a" roughness={0.6} />
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
