import React, { useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment } from "@react-three/drei";
import { useTwin } from "../../context/TwinContext";
import { CameraPreset, ViewportMode } from "../../types";
import { CAMERA_CONFIG, CAMERA_PRESETS } from "../../config/camera";
import { REAL_WORLD_MACHINES } from "../../data/machines";
import { soundEffects } from "../../utils/soundEffects";
import { CameraSequencer } from "./CameraSequencer";
import { MachineModelSwitch } from "./MachineModelSwitch";
import { CinematicLighting } from "../FactoryScene/CinematicLighting";
import { FactoryEnvironment } from "../FactoryScene/FactoryEnvironment";
import { FactoryBlueprintMegastructure } from "../FactoryScene/FactoryBlueprintMegastructure";
import { BloomComposer } from "../../components/3d/BloomComposer";
import { HolographicRings } from "../../components/3d/HolographicRings";
import { FloatingHudLabels } from "../../components/3d/FloatingHudLabels";
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

export interface MachineSceneProps {
  onReplayIntro?: () => void;
}

/**
 * Enterprise 3D Machine Scene Canvas
 * Central interactive viewport for the Digital Twin.
 */
export const MachineScene: React.FC<MachineSceneProps> = ({ onReplayIntro }) => {
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

  // ESC key listener to return to isometric overview and reset component focus
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
      containerRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
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
    ([, c]) => c && (c.is_failing || (c.health_score !== undefined && c.health_score < 50))
  );

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full min-h-[460px] rounded-2xl overflow-hidden glass-panel border border-industrial-700/60 shadow-panel flex flex-col font-sans"
    >
      {/* Active Component Failure Alert Banner */}
      {failingCompEntry && failingCompEntry[1] && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between px-3.5 py-2 rounded-xl bg-red-950/90 border border-red-500/80 shadow-glow-red backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-2 text-xs font-hud text-red-200 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <span>CRITICAL FAULT DETECTED: {failingCompEntry[1].name || "Sub-Assembly"} ({failingCompEntry[1].status || "Critical"})</span>
            <span className="text-red-400 font-mono">| RUL: {failingCompEntry[1].remaining_useful_life_days ?? 45}d</span>
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
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "standard"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "holographic"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "thermal"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "wireframe"
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
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "xr"
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
            <button
              onClick={() => {
                soundEffects.playModeSwitch();
                setIsExploded(!isExploded);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1.5 transition ${isExploded
                  ? "bg-amber-500/30 text-amber-300 border border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.5)] font-bold animate-pulse"
                  : "text-slate-400 hover:text-amber-300"
                }`}
              title="Toggle Smooth Exploded View Animation"
            >
              <Layers className="w-3.5 h-3.5" />
              <span>{isExploded ? "Assembled [💥]" : "Explode [💥]"}</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playHoverTick();
                setFaultBeamEnabled(!faultBeamEnabled);
              }}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${faultBeamEnabled
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
            <button
              onClick={() => setShowHoloRings(!showHoloRings)}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${showHoloRings ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              title="Toggle Holographic Rings"
            >
              <Disc className="w-3.5 h-3.5" />
              <span>Holo</span>
            </button>

            <button
              onClick={() => setShowHudLabels(!showHudLabels)}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${showHudLabels ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
                }`}
              title="Toggle Floating HUD Labels"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>HUD</span>
            </button>

            <button
              onClick={() => setAutoOrbit(!autoOrbit)}
              className={`px-2 py-1 rounded-lg text-xs font-mono flex items-center gap-1 transition ${autoOrbit ? "text-cyan-300 bg-cyan-950/40 border border-cyan-500/30" : "text-slate-500 hover:text-slate-300"
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
            className="p-1.5 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-400 backdrop-blur-md transition"
            title="Reset to Isometric Overview [ESC]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* Fullscreen Toggle Button */}
          <button
            onClick={toggleFullscreen}
            className="p-1.5 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-400 backdrop-blur-md transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Primary 3D WebGL Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          camera={{
            position: [4.2, 3.2, 4.6],
            fov: CAMERA_CONFIG.defaultFov,
            near: 0.1,
            far: 100,
          }}
          gl={{
            antialias: true,
            alpha: false,
            powerPreference: "high-performance",
          }}
          shadows
        >
          {/* Camera Sequencer */}
          <CameraSequencer
            preset={cameraPreset}
            controlsRef={controlsRef}
            autoOrbit={autoOrbit}
            activeMachineId={activeMachineId}
            selectedComponent={selectedComponent}
          />

          {/* Damped OrbitControls */}
          <OrbitControls
            ref={controlsRef}
            enableDamping
            autoRotateSpeed={CAMERA_CONFIG.autoRotateSpeed}
            dampingFactor={CAMERA_CONFIG.dampingFactor}
            minDistance={CAMERA_CONFIG.minDistance}
            maxDistance={CAMERA_CONFIG.maxDistance}
            maxPolarAngle={CAMERA_CONFIG.maxPolarAngle}
            target={[0, 0.9, 0]}
          />

          {/* Cinematic 5-Point Lighting Rig */}
          <CinematicLighting status={telemetry?.overall_status} viewportMode={viewportMode} />

          {/* Studio HDR Environment for PBR reflections */}
          <Environment preset="city" environmentIntensity={0.45} />

          {/* Factory Environment (Floor, Pillars, Gantries) */}
          <FactoryEnvironment viewportMode={viewportMode} machineStatus={telemetry?.overall_status} />

          {/* Architectural Blueprint Megastructure (8% opacity) */}
          <FactoryBlueprintMegastructure opacity={0.08} />

          {/* Holographic Energy Rings */}
          <HolographicRings visible={showHoloRings || viewportMode === "holographic"} />

          {/* Floating AR HUD Labels */}
          <FloatingHudLabels visible={showHudLabels || viewportMode === "xr"} />

          {/* 3D Textile Machine Digital Twin */}
          <MachineModelSwitch machineId={activeMachineId} />

          {/* Post-Processing Bloom Pass */}
          <BloomComposer />
        </Canvas>
      </div>

      {/* 3D Viewport Bottom Preset Navigation Bar */}
      <div className="absolute bottom-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-1.5 bg-industrial-900/85 backdrop-blur-md p-1 rounded-xl border border-industrial-700/60 pointer-events-auto overflow-x-auto max-w-full">
          {CAMERA_PRESETS.map((item) => (
            <button
              key={item.id}
              onClick={() => {
                soundEffects.playHoverTick();
                setCameraPreset(item.id);
                setSelectedComponent(item.componentId || null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-sans font-bold transition tracking-wider ${cameraPreset === item.id
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
