import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls, MeshReflectorMaterial } from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { TextileMachine } from "./TextileMachine";
import { HolographicRings } from "./HolographicRings";
import { FloatingHudLabels } from "./FloatingHudLabels";
import { DataFlowStreams } from "./DataFlowStreams";
import { DigitalParticles } from "./DigitalParticles";
import { CameraPreset, ViewportMode } from "../../types";
import { soundEffects } from "../../utils/soundEffects";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  Activity,
  Flame,
  Box,
  AlertTriangle,
  Radio,
  Eye,
  Disc,
  PlayCircle,
} from "lucide-react";

interface CanvasContainerProps {
  onReplayIntro?: () => void;
}

const targetPositions: Record<CameraPreset, [number, number, number]> = {
  isometric: [4.2, 3.2, 4.6],
  motor: [-2.2, 1.6, 1.8],
  bearings: [0.0, 2.2, 2.1],
  loom: [0.0, 2.2, 2.6],
  belt: [-1.4, 1.8, 1.8],
  top: [0.0, 6.2, 0.1],
};

const lookAtTargets: Record<CameraPreset, [number, number, number]> = {
  isometric: [0, 0.9, 0],
  motor: [-1.3, 0.8, 0.55],
  bearings: [0, 1.4, 0.55],
  loom: [0, 0.9, 0],
  belt: [-0.65, 0.95, 0.55],
  top: [0, 0.5, 0],
};

// Camera Rig for smooth cinematic camera transitions between presets
const CameraController: React.FC<{
  preset: CameraPreset;
  controlsRef: React.RefObject<any>;
  autoOrbit: boolean;
}> = ({ preset, controlsRef, autoOrbit }) => {
  const isTransitioning = useRef(true);

  useEffect(() => {
    isTransitioning.current = true;
  }, [preset]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleStart = () => {
      isTransitioning.current = false;
    };
    controls.addEventListener("start", handleStart);
    return () => {
      controls.removeEventListener("start", handleStart);
    };
  }, [controlsRef]);

  useFrame(({ camera }) => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoOrbit && !isTransitioning.current;
      controlsRef.current.autoRotateSpeed = 0.8;
    }

    if (!isTransitioning.current || !controlsRef.current) return;

    const desiredPos = new THREE.Vector3(...targetPositions[preset]);
    const desiredLook = new THREE.Vector3(...lookAtTargets[preset]);

    camera.position.lerp(desiredPos, 0.08);
    controlsRef.current.target.lerp(desiredLook, 0.08);
    controlsRef.current.update();

    if (
      camera.position.distanceTo(desiredPos) < 0.03 &&
      controlsRef.current.target.distanceTo(desiredLook) < 0.03
    ) {
      isTransitioning.current = false;
    }
  });

  return null;
};

export const CanvasContainer: React.FC<CanvasContainerProps> = ({ onReplayIntro }) => {
  const {
    displayTelemetry,
    cameraPreset,
    setCameraPreset,
    viewportMode,
    setViewportMode,
    selectedComponent,
    setSelectedComponent,
  } = useTwin();

  const telemetry = displayTelemetry;
  const containerRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<any>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Viewport Feature Toggles
  const [showHoloRings, setShowHoloRings] = useState(true);
  const [showHudLabels, setShowHudLabels] = useState(true);
  const [autoOrbit, setAutoOrbit] = useState(false);

  // Fullscreen state listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  // Phase 8: ESC key listener to return to isometric overview and reset component focus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setCameraPreset("isometric");
        setSelectedComponent(null);
        soundEffects.playHoverTick();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [setCameraPreset, setSelectedComponent]);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleModeChange = (mode: ViewportMode) => {
    soundEffects.playModeSwitch();
    setViewportMode(mode);
  };

  const handleResetView = () => {
    soundEffects.playHoverTick();
    setCameraPreset("isometric");
    setSelectedComponent(null);
  };

  const statusColor =
    telemetry?.overall_status === "Healthy"
      ? "text-[#00ff88] border-[#00ff88]/50"
      : telemetry?.overall_status === "Warning"
      ? "text-[#fbbf24] border-[#fbbf24]/50"
      : "text-[#ef4444] border-[#ef4444]/50";

  const rpmText = (telemetry?.sensors?.rpm ?? 0).toFixed(0);
  const vibText = (telemetry?.sensors?.vibration ?? 0).toFixed(0);
  const tempText = (telemetry?.sensors?.temperature ?? 0).toFixed(1);

  // Check if any component is actively failing
  const failingCompEntry = Object.entries(telemetry?.components ?? {}).find(
    ([_, c]) => c && (c.is_failing || (c.health_score !== undefined && c.health_score < 50))
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden glass-panel border border-industrial-700/60 shadow-panel flex flex-col font-sans"
    >
      {/* Active Component Failure Banner */}
      {failingCompEntry && failingCompEntry[1] && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between px-3.5 py-2 rounded-xl bg-red-950/90 border border-red-500/80 shadow-glow-red backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-2 text-xs font-hud text-red-200 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <span>CRITICAL FAULT DETECTED: {failingCompEntry[1].name || "Sub-Assembly"} ({failingCompEntry[1].status || "Critical"})</span>
            <span className="text-red-400 font-mono">| RUL: {failingCompEntry[1].remaining_useful_life_days ?? 45}d ({failingCompEntry[1].remaining_useful_life_hours ?? 1080}h)</span>
          </div>
          <button
            onClick={() => {
              soundEffects.playInspectionSound();
              setSelectedComponent(failingCompEntry[0]);
            }}
            className="text-xs font-hud uppercase px-2.5 py-0.5 rounded bg-red-800 text-white hover:bg-red-700 transition font-medium"
          >
            Isolate Component
          </button>
        </div>
      )}

      {/* 3D Viewport Top HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        {/* Left: 3D Twin Status Pill */}
        <div className="flex items-center gap-3 bg-industrial-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-industrial-700/60 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-sans font-bold text-xs tracking-wider text-cyan-300 uppercase">
              Omniverse 3D Twin
            </span>
          </div>
          <div className="h-3.5 w-px bg-industrial-700" />
          <span className="text-xs text-slate-400 font-mono">
            {rpmText} RPM | {vibText} mm/s | {tempText}°C
          </span>
          {selectedComponent && (
            <>
              <div className="h-3.5 w-px bg-industrial-700" />
              <button
                onClick={handleResetView}
                className="text-xs text-cyan-400 hover:text-white uppercase font-mono flex items-center gap-1 font-semibold"
              >
                Selected: {selectedComponent.replace("_", " ")} [ESC]
              </button>
            </>
          )}
        </div>

        {/* Right: Viewport Controls & Feature Toggles */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Viewport Mode Switcher */}
          <div className="flex items-center bg-industrial-900/90 border border-industrial-700/80 rounded-xl p-0.5 backdrop-blur-md">
            <button
              onClick={() => handleModeChange("standard")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${
                viewportMode === "standard"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-glow-cyan"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Standard 3D View"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Standard</span>
            </button>

            <button
              onClick={() => handleModeChange("thermal")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${
                viewportMode === "thermal"
                  ? "bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-glow-amber"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Thermal Heat Map Mode"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thermal</span>
            </button>

            <button
              onClick={() => handleModeChange("wireframe")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${
                viewportMode === "wireframe"
                  ? "bg-purple-500/25 text-purple-300 border border-purple-400/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Wireframe Analysis Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wireframe</span>
            </button>
          </div>

          {/* Cinematic Toggles Group */}
          <div className="hidden md:flex items-center bg-industrial-900/90 border border-industrial-700/80 rounded-xl p-0.5 backdrop-blur-md">
            {/* Holographic Rings Toggle */}
            <button
              onClick={() => setShowHoloRings(!showHoloRings)}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                showHoloRings ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
              title="Toggle Holographic Rings"
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Holo</span>
            </button>

            {/* HUD Labels Toggle */}
            <button
              onClick={() => setShowHudLabels(!showHudLabels)}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                showHudLabels ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
              title="Toggle Floating HUD Labels"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>HUD</span>
            </button>

            {/* Auto-Orbit Turntable Toggle */}
            <button
              onClick={() => setAutoOrbit(!autoOrbit)}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                autoOrbit ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
              }`}
              title="Toggle Cinematic Auto-Orbit"
            >
              <Radio className="w-3.5 h-3.5" />
              <span>Orbit</span>
            </button>
          </div>

          {/* Replay Intro Button */}
          {onReplayIntro && (
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                onReplayIntro();
              }}
              className="px-2.5 py-1.5 rounded-xl bg-industrial-900/80 border border-cyan-500/40 text-cyan-300 hover:text-white hover:border-cyan-300 backdrop-blur-md transition flex items-center gap-1 text-xs font-mono font-medium shadow-glow-cyan"
              title="Replay Cinematic Startup Sequence"
            >
              <PlayCircle className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Intro</span>
            </button>
          )}

          {/* Reset View Button */}
          <button
            onClick={handleResetView}
            className="p-2 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-300 backdrop-blur-md transition"
            title="Reset to Isometric Overview [Esc]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Toggle Fullscreen */}
          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-300 backdrop-blur-md transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Phase 9: Thermal Heat Map Gradient Legend */}
      {viewportMode === "thermal" && (
        <div className="absolute top-16 right-4 z-10 bg-industrial-950/90 border border-amber-500/40 rounded-xl p-3 backdrop-blur-md shadow-xl text-xs pointer-events-auto">
          <div className="text-[11px] font-sans font-bold text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Thermal Vision Gradient (°C)</span>
          </div>
          <div className="h-3 w-48 rounded-md bg-gradient-to-r from-[#0077b6] via-[#10b981] via-[#eab308] via-[#f97316] to-[#ff0055] border border-industrial-700 shadow-inner" />
          <div className="flex justify-between text-[10px] text-slate-300 font-mono mt-1 font-semibold">
            <span>&lt;35° Cool</span>
            <span>45° Norm</span>
            <span>55° Warm</span>
            <span>65° Hot</span>
            <span>&gt;65° Crit</span>
          </div>
        </div>
      )}

      {/* Double Click Inspection Hint */}
      <div className="absolute top-16 left-4 z-10 hidden sm:flex items-center gap-2 bg-industrial-950/70 border border-industrial-800/80 rounded-lg px-2.5 py-1 text-[10px] font-mono text-slate-400 backdrop-blur-md pointer-events-none">
        <span>Tip: Double-click component to inspect • Press [ESC] to reset overview</span>
      </div>

      {/* 3D WebGL Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [4.2, 3.2, 4.6], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          onCreated={({ gl }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping;
            gl.toneMappingExposure = 1.25;
          }}
          className="w-full h-full"
        >
          {/* Volumetric Depth Fog blending into deep cyber space */}
          <fog attach="fog" args={["#020617", 8, 26]} />

          <CameraController
            preset={cameraPreset}
            controlsRef={controlsRef}
            autoOrbit={autoOrbit}
          />

          <OrbitControls
            ref={controlsRef}
            makeDefault
            enableDamping
            dampingFactor={0.05}
            minDistance={1.8}
            maxDistance={14.0}
            maxPolarAngle={Math.PI / 2 + 0.05}
            target={[0, 0.9, 0]}
          />

          {/* Phase 3: Premium Industrial Lighting (HDR Style Contrast & Rim Lights) */}
          <ambientLight intensity={viewportMode === "thermal" ? 0.75 : 0.55} color="#94a3b8" />
          <directionalLight
            position={[6, 9, 5]}
            intensity={1.8}
            castShadow
            shadow-mapSize={[2048, 2048]}
            shadow-bias={-0.0001}
            color="#ffffff"
          />
          {/* Grazing Rim Lights (Cyan contour & Blue fill) */}
          <directionalLight position={[-7, 5, -5]} intensity={1.2} color="#00f0ff" />
          <directionalLight position={[7, 4, -6]} intensity={0.9} color="#3b82f6" />
          <pointLight position={[0, 2.8, 0.55]} intensity={1.5} color="#00f0ff" distance={8} />

          {/* Phase 2: Next-Gen Reflective Digital Twin Stage Ground */}
          <mesh position={[0, -0.012, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
            <planeGeometry args={[22, 22]} />
            <MeshReflectorMaterial
              blur={[300, 100]}
              resolution={512}
              mixBlur={1}
              mixStrength={40}
              roughness={0.7}
              depthScale={1.2}
              minDepthThreshold={0.4}
              maxDepthThreshold={1.4}
              color="#050b14"
              metalness={0.65}
              mirror={0.35}
            />
          </mesh>

          {/* Ground Contact Shadows & Cyber Grid */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.75}
            scale={10}
            blur={2.2}
            far={4}
            color="#020617"
          />

          {/* Dual-layer cyber grid */}
          <Grid
            position={[0, 0.001, 0]}
            args={[16, 16]}
            cellSize={0.5}
            cellThickness={0.8}
            cellColor="#1e293b"
            sectionSize={2.5}
            sectionThickness={1.4}
            sectionColor="#00f0ff"
            fadeDistance={11}
            fadeStrength={1.6}
          />

          {/* Phase 7: Live Digital Particles (Atmospheric cyber dust) */}
          <DigitalParticles />

          {/* Phase 7: Live Energy Flow Streams (Transmission pulses) */}
          <DataFlowStreams />

          {/* Phase 4: Holographic Machine Interface Rings */}
          <HolographicRings visible={showHoloRings} />

          {/* Phase 6: Floating Iron Man HUD Labels */}
          <FloatingHudLabels visible={showHudLabels} />

          {/* 3D Textile Machine Sub-Assemblies */}
          <TextileMachine />
        </Canvas>
      </div>

      {/* 3D Viewport Bottom Preset Navigation Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-industrial-900/85 backdrop-blur-md p-1 rounded-xl border border-industrial-700/60 pointer-events-auto overflow-x-auto max-w-full">
          {(
            [
              { id: "isometric", label: "Isometric Overview" },
              { id: "motor", label: "Main Motor" },
              { id: "bearings", label: "Spindle Bearings" },
              { id: "loom", label: "Weaving Loom" },
              { id: "belt", label: "Drive Belt" },
              { id: "top", label: "Top View" },
            ] as { id: CameraPreset; label: string }[]
          ).map((item) => (
            <button
              key={item.id}
              onClick={() => {
                soundEffects.playHoverTick();
                setCameraPreset(item.id);
                if (item.id === "motor") setSelectedComponent("main_motor");
                else if (item.id === "bearings") setSelectedComponent("bearings");
                else if (item.id === "loom") setSelectedComponent("loom_section");
                else if (item.id === "belt") setSelectedComponent("belt_system");
                else setSelectedComponent(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition tracking-wider ${
                cameraPreset === item.id
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-glow-cyan"
                  : "text-slate-400 hover:text-slate-200 hover:bg-industrial-800/60"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Real-time Health Badge Overlay */}
        <div
          className={`hidden md:flex items-center gap-2 bg-industrial-900/90 backdrop-blur-md px-3 py-1.5 rounded-xl border ${statusColor} pointer-events-auto`}
        >
          <Activity className="w-3.5 h-3.5 animate-pulse" />
          <span className="text-xs font-sans tracking-wide font-extrabold">
            STATUS: {telemetry?.overall_status?.toUpperCase() || "CONNECTING"}
          </span>
          <span className="text-xs font-mono font-extrabold">
            ({(telemetry?.overall_health_score ?? 100).toFixed(0)}%)
          </span>
        </div>
      </div>
    </div>
  );
};
