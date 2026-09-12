import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls, MeshReflectorMaterial, Environment } from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { MachineModelSwitch } from "./MachineModelSwitch";
import { FactoryEnvironment } from "./FactoryEnvironment";
import { FactoryBlueprintMegastructure } from "./FactoryBlueprintMegastructure";
import { REAL_WORLD_MACHINES } from "../../data/machinesData";
import { HolographicRings } from "./HolographicRings";
import { FloatingHudLabels } from "./FloatingHudLabels";
import { BloomComposer } from "./BloomComposer";
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

// =========================================================================
// CINEMATIC 5-POINT INDUSTRIAL LIGHTING RIG (65% Intensity, Soft Balances)
// =========================================================================
const CinematicLighting: React.FC<{
  status?: string;
  viewportMode: ViewportMode;
}> = ({ status = "Healthy", viewportMode }) => {
  const statusLightRef = useRef<THREE.PointLight>(null);
  const isWarning = status === "Warning";
  const isCritical = status === "Critical";

  const statusColor = isCritical ? "#ef4444" : isWarning ? "#f59e0b" : "#00e5ff";

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (statusLightRef.current) {
      if (isCritical) {
        statusLightRef.current.intensity = Math.sin(t * 10) > 0 ? 2.4 : 0.3;
      } else if (isWarning) {
        statusLightRef.current.intensity = 1.1 + Math.sin(t * 3.5) * 0.45;
      } else {
        statusLightRef.current.intensity = 0.9 + Math.sin(t * 1.5) * 0.15;
      }
    }
  });

  return (
    <>
      {/* 1. Main Top Spotlight: 65% Intensity, Soft Non-Overexposed Falloff */}
      <spotLight
        position={[0, 8.5, 1.2]}
        intensity={1.8}
        angle={0.65}
        penumbra={0.9}
        castShadow
        shadow-mapSize={[2048, 2048]}
        shadow-bias={-0.0001}
        color="#f8fafc"
      />

      {/* 2. Cyan Rim Light: Edge Highlights */}
      <directionalLight
        position={[-7, 5, -4]}
        intensity={1.25}
        color="#00e5ff"
      />

      {/* 3. Blue Back Light: Depth and Spatial Separation */}
      <directionalLight
        position={[6, 5, -6]}
        intensity={0.95}
        color="#2563eb"
      />

      {/* 4. Ambient Floor Bounce Light: Ground Realism */}
      <pointLight
        position={[0, 0.25, 0]}
        intensity={0.35}
        color="#0f2744"
        distance={9}
      />

      {/* 5. Dynamic Status Lighting: Subtle Non-Blinding Aura */}
      <pointLight
        ref={statusLightRef}
        position={[0, 3.0, 0.6]}
        intensity={0.9}
        color={statusColor}
        distance={8}
      />

      {/* Soft Industrial Ambient Fill */}
      <ambientLight
        intensity={viewportMode === "thermal" ? 0.75 : 0.35}
        color="#64748b"
      />
    </>
  );
};

// =========================================================================
// 4-PHASE CINEMATIC CAMERA SEQUENCER
// 1. PULL BACK -> 2. FLY IN -> 3. ORBIT ARC -> 4. SETTLE
// =========================================================================
const CameraController: React.FC<{
  preset: CameraPreset;
  controlsRef: React.RefObject<any>;
  autoOrbit: boolean;
  activeMachineId: string;
  selectedComponent: string | null;
}> = ({ preset, controlsRef, autoOrbit, activeMachineId, selectedComponent }) => {
  const sequencePhase = useRef<number>(4);
  const phaseTimer = useRef<number>(0);
  const prevMachineRef = useRef(activeMachineId);
  const prevPresetRef = useRef(preset);
  const prevCompRef = useRef(selectedComponent);

  // Trigger 4-phase cinematic flight on machine switch
  useEffect(() => {
    if (prevMachineRef.current !== activeMachineId) {
      prevMachineRef.current = activeMachineId;
      sequencePhase.current = 1; // Phase 1: Pull Back
      phaseTimer.current = 0;
      soundEffects.playModeSwitch();
    } else if (prevPresetRef.current !== preset || prevCompRef.current !== selectedComponent) {
      prevPresetRef.current = preset;
      prevCompRef.current = selectedComponent;
      sequencePhase.current = 4; // Fast settle for manual preset clicks
    }
  }, [preset, activeMachineId, selectedComponent]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleStart = () => {
      // User manual interaction cancels sequence immediately
      sequencePhase.current = 0;
    };
    controls.addEventListener("start", handleStart);
    return () => {
      controls.removeEventListener("start", handleStart);
    };
  }, [controlsRef]);

  useFrame(({ camera }, delta) => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoOrbit && sequencePhase.current === 0;
      controlsRef.current.autoRotateSpeed = 0.85;
    }

    if (sequencePhase.current === 0 || !controlsRef.current) return;

    phaseTimer.current += delta;

    let targetPos: [number, number, number] = targetPositions[preset];
    let targetLook: [number, number, number] = lookAtTargets[preset];

    if (selectedComponent === "bearings") {
      targetPos = [0.0, 1.8, 2.1];
      targetLook = [0.0, 1.0, 0.2];
    } else if (selectedComponent === "main_motor") {
      targetPos = [-2.4, 1.6, 1.6];
      targetLook = [-1.5, 0.9, 0.1];
    }

    let desiredPos = new THREE.Vector3(...targetPos);
    let desiredLook = new THREE.Vector3(...targetLook);
    let lerpSpeed = 0.065;

    if (sequencePhase.current === 1) {
      // Phase 1: Pull Back to Wide Establishing View
      desiredPos = new THREE.Vector3(6.8, 4.5, 7.5);
      desiredLook = new THREE.Vector3(0, 1.1, 0);
      lerpSpeed = 0.055;
      if (camera.position.distanceTo(desiredPos) < 0.6 || phaseTimer.current > 0.9) {
        sequencePhase.current = 2;
        phaseTimer.current = 0;
      }
    } else if (sequencePhase.current === 2) {
      // Phase 2: Fly Inward toward Machine
      desiredPos = new THREE.Vector3(5.0, 3.2, 5.4);
      desiredLook = new THREE.Vector3(0, 0.95, 0);
      lerpSpeed = 0.065;
      if (camera.position.distanceTo(desiredPos) < 0.4 || phaseTimer.current > 0.8) {
        sequencePhase.current = 3;
        phaseTimer.current = 0;
      }
    } else if (sequencePhase.current === 3) {
      // Phase 3: Orbit Arc highlighting Machine Profile
      desiredPos = new THREE.Vector3(3.2, 3.4, 5.0);
      desiredLook = new THREE.Vector3(0, 0.9, 0);
      lerpSpeed = 0.07;
      if (camera.position.distanceTo(desiredPos) < 0.3 || phaseTimer.current > 0.7) {
        sequencePhase.current = 4;
        phaseTimer.current = 0;
      }
    } else if (sequencePhase.current === 4) {
      // Phase 4: Settle into Final Inspection Position
      lerpSpeed = 0.08;
      if (
        camera.position.distanceTo(desiredPos) < 0.03 &&
        controlsRef.current.target.distanceTo(desiredLook) < 0.03
      ) {
        sequencePhase.current = 0; // Completed
      }
    }

    camera.position.lerp(desiredPos, lerpSpeed);
    controlsRef.current.target.lerp(desiredLook, lerpSpeed);
    controlsRef.current.update();
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
    activeMachineId,
    isExploded,
    setIsExploded,
    faultBeamEnabled,
    setFaultBeamEnabled,
  } = useTwin();

  const activeMachine = REAL_WORLD_MACHINES[activeMachineId] || REAL_WORLD_MACHINES.picanol;
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
              {activeMachine.name} 3D Twin
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
          {/* 5 Viewport Modes Switcher */}
          <div className="flex items-center bg-industrial-900/90 border border-industrial-700/80 rounded-xl p-0.5 backdrop-blur-md">
            <button
              onClick={() => handleModeChange("standard")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${
                viewportMode === "standard"
                  ? "bg-cyan-500/25 text-cyan-300 border border-cyan-400/50 shadow-glow-cyan"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Standard Realistic PBR View"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Normal</span>
            </button>

            <button
              onClick={() => handleModeChange("holographic")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${
                viewportMode === "holographic"
                  ? "bg-cyan-500/30 text-cyan-200 border border-cyan-300 shadow-[0_0_12px_rgba(0,229,255,0.5)]"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Holographic Cyber Mode"
            >
              <Disc className="w-3.5 h-3.5 text-[#00e5ff]" />
              <span className="hidden sm:inline">Holo</span>
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
              title="Wireframe CAD Structural Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wireframe</span>
            </button>

            <button
              onClick={() => handleModeChange("xr")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${
                viewportMode === "xr"
                  ? "bg-emerald-500/25 text-emerald-300 border border-emerald-400/50 shadow-glow-emerald"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="XR Engineering Breakdown Mode"
            >
              <Eye className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">XR Inspect</span>
            </button>
          </div>

          {/* Exploded View & Fault Pointer Action Group */}
          <div className="hidden lg:flex items-center bg-industrial-900/90 border border-industrial-700/80 rounded-xl p-0.5 backdrop-blur-md">
            {/* Exploded View Animation Toggle */}
            <button
              onClick={() => {
                soundEffects.playModeSwitch();
                setIsExploded(!isExploded);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition ${
                isExploded
                  ? "bg-amber-500/30 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold animate-pulse"
                  : "text-slate-400 hover:text-amber-300"
              }`}
              title="Toggle Smooth Exploded View Animation"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isExploded ? "Assembled [💥]" : "Explode [💥]"}</span>
            </button>

            {/* Fault Localization Pointer Beam Toggle */}
            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setFaultBeamEnabled(!faultBeamEnabled);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${
                faultBeamEnabled
                  ? "text-red-300 bg-red-950/40 border border-red-500/40"
                  : "text-slate-500 hover:text-slate-300"
              }`}
              title="Toggle 3D Fault Pointer Laser Beam"
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
              <span>Laser</span>
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
          {/* Volumetric Depth Fog blending into deep factory cyber space */}
          <fog attach="fog" args={["#020617", 9, 28]} />

          <CameraController
            preset={cameraPreset}
            controlsRef={controlsRef}
            autoOrbit={autoOrbit}
            activeMachineId={activeMachineId}
            selectedComponent={selectedComponent}
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

          {/* Cinematic 5-Point Industrial Lighting Rig */}
          <CinematicLighting status={telemetry?.overall_status} viewportMode={viewportMode} />

          {/* Studio HDR Environment for Brushed Aluminium & Powder-Coated Metal */}
          <Environment preset="city" environmentIntensity={0.45} />

          {/* Complete Industrial Factory Environment (Floor, Pillars, Gantries, Lights) */}
          <FactoryEnvironment viewportMode={viewportMode} machineStatus={telemetry?.overall_status} />

          {/* Architectural Industrial Blueprint Silhouettes (5-10% opacity, non-distracting) */}
          <FactoryBlueprintMegastructure opacity={0.08} />

          {/* Holographic Machine Interface Rings */}
          <HolographicRings visible={showHoloRings || viewportMode === "holographic"} />

          {/* Floating Iron Man HUD Labels (Active in XR mode or when toggled) */}
          <FloatingHudLabels visible={showHudLabels || viewportMode === "xr"} />

          {/* 3D Textile Machine Digital Twin */}
          <MachineModelSwitch machineId={activeMachineId} />

          {/* Post-Processing Bloom Pass (NVIDIA Omniverse Aesthetic) */}
          <BloomComposer />
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
