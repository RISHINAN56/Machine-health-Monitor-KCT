import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { TextileMachine } from "./TextileMachine";
import { CameraPreset, ViewportMode } from "../../types";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Layers,
  Activity,
  Flame,
  Box,
  AlertTriangle,
} from "lucide-react";

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

// Camera Rig for smooth animated camera transitions between presets without fighting OrbitControls
const CameraController: React.FC<{
  preset: CameraPreset;
  controlsRef: React.RefObject<any>;
}> = ({ preset, controlsRef }) => {
  const isTransitioning = useRef(true);

  useEffect(() => {
    isTransitioning.current = true;
  }, [preset]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleStart = () => {
      // User began interacting manually, abort automated lerp
      isTransitioning.current = false;
    };
    controls.addEventListener("start", handleStart);
    return () => {
      controls.removeEventListener("start", handleStart);
    };
  }, [controlsRef]);

  useFrame(({ camera }) => {
    if (!isTransitioning.current || !controlsRef.current) return;

    const desiredPos = new THREE.Vector3(...targetPositions[preset]);
    const desiredLook = new THREE.Vector3(...lookAtTargets[preset]);

    // Smooth lerp camera position and OrbitControls target
    camera.position.lerp(desiredPos, 0.08);
    controlsRef.current.target.lerp(desiredLook, 0.08);
    controlsRef.current.update();

    // Check if transition has arrived near target
    if (
      camera.position.distanceTo(desiredPos) < 0.03 &&
      controlsRef.current.target.distanceTo(desiredLook) < 0.03
    ) {
      isTransitioning.current = false;
    }
  });

  return null;
};

export const CanvasContainer: React.FC = () => {
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

  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFsChange);
    return () => document.removeEventListener("fullscreenchange", handleFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => { });
    } else {
      document.exitFullscreen().catch(() => { });
    }
  };

  const statusColor =
    telemetry?.overall_status === "Healthy"
      ? "text-cyber-emerald border-cyber-emerald/50"
      : telemetry?.overall_status === "Warning"
        ? "text-cyber-amber border-cyber-amber/50"
        : "text-cyber-crimson border-cyber-crimson/50";

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
      className={`relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden glass-panel border border-industrial-700/60 shadow-panel flex flex-col`}
    >
      {/* Active Component Failure Banner (Phase 1) */}
      {failingCompEntry && failingCompEntry[1] && (
        <div className="absolute top-14 left-4 right-4 z-20 flex items-center justify-between px-3.5 py-2 rounded-xl bg-red-950/90 border border-red-500/80 shadow-glow-red backdrop-blur-md animate-pulse">
          <div className="flex items-center gap-2 text-xs font-hud text-red-200 uppercase tracking-wider">
            <AlertTriangle className="w-4 h-4 text-red-400 animate-bounce" />
            <span>CRITICAL FAULT DETECTED: {failingCompEntry[1].name || "Sub-Assembly"} ({failingCompEntry[1].status || "Critical"})</span>
            <span className="text-red-400 font-mono">| RUL: {failingCompEntry[1].remaining_useful_life_days ?? 45}d ({failingCompEntry[1].remaining_useful_life_hours ?? 1080}h)</span>
          </div>
          <button
            onClick={() => setSelectedComponent(failingCompEntry[0])}
            className="text-xs font-hud uppercase px-2.5 py-0.5 rounded bg-red-800 text-white hover:bg-red-700 transition font-medium"
          >
            Isolate Component
          </button>
        </div>
      )}

      {/* 3D Viewport Top HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-industrial-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-industrial-700/60 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-hud text-xs tracking-wider text-cyan-300 uppercase">
              3D Machine Visualization
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
                onClick={() => setSelectedComponent(null)}
                className="text-xs text-cyan-400 hover:text-white uppercase font-hud flex items-center gap-1"
              >
                Selected: {selectedComponent.replace("_", " ")} [×]
              </button>
            </>
          )}
        </div>

        {/* Viewport Control Actions */}
        <div className="flex items-center gap-2 pointer-events-auto">
          {/* Viewport Mode Switcher (Standard 3D / Thermal Heat Map / Wireframe Analysis) */}
          <div className="flex items-center bg-industrial-900/90 border border-industrial-700/80 rounded-xl p-0.5 backdrop-blur-md">
            <button
              onClick={() => setViewportMode("standard")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "standard"
                  ? "bg-cyan-500/20 text-cyan-300 border border-cyan-400/40 shadow-glow-cyan"
                  : "text-slate-400 hover:text-slate-200"
                }`}
              title="Standard 3D View"
            >
              <Box className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Standard 3D</span>
            </button>

            <button
              onClick={() => setViewportMode("thermal")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "thermal"
                  ? "bg-amber-500/25 text-amber-300 border border-amber-400/40 shadow-glow-amber"
                  : "text-slate-400 hover:text-slate-200"
                }`}
              title="Thermal Heat Map Mode"
            >
              <Flame className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Thermal Heat Map</span>
            </button>

            <button
              onClick={() => setViewportMode("wireframe")}
              className={`px-2.5 py-1 rounded-lg text-xs font-mono font-medium flex items-center gap-1 transition ${viewportMode === "wireframe"
                  ? "bg-purple-500/25 text-purple-300 border border-purple-400/40"
                  : "text-slate-400 hover:text-slate-200"
                }`}
              title="Wireframe Analysis Mode"
            >
              <Layers className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Wireframe Analysis</span>
            </button>
          </div>

          <button
            onClick={() => {
              setCameraPreset("isometric");
              setSelectedComponent(null);
            }}
            className="p-2 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-300 backdrop-blur-md transition"
            title="Isometric Overview"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-300 backdrop-blur-md transition"
            title="Toggle Fullscreen"
          >
            {isFullscreen ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
        </div>
      </div>

      {/* Thermal Heat Map Gradient Legend */}
      {viewportMode === "thermal" && (
        <div className="absolute top-16 right-4 z-10 bg-industrial-950/90 border border-amber-500/40 rounded-xl p-3 backdrop-blur-md shadow-xl text-xs pointer-events-auto">
          <div className="text-[11px] font-hud text-amber-300 uppercase tracking-wider mb-1.5 flex items-center gap-1.5">
            <Flame className="w-3.5 h-3.5 text-amber-400" />
            <span>Thermal Gradient (°C)</span>
          </div>
          <div className="h-3 w-44 rounded-md bg-gradient-to-r from-blue-600 via-emerald-500 via-amber-500 to-red-600 border border-industrial-700 shadow-inner" />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
            <span>&lt;35° Cool</span>
            <span>45° Norm</span>
            <span>55° Warm</span>
            <span>&gt;65° Hot</span>
          </div>
        </div>
      )}

      {/* 3D WebGL Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [4.2, 3.2, 4.6], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <CameraController preset={cameraPreset} controlsRef={controlsRef} />
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

          {/* Industrial Cyber Lighting */}
          <ambientLight intensity={viewportMode === "thermal" ? 0.85 : 0.65} color="#cbd5e1" />
          <directionalLight
            position={[6, 8, 5]}
            intensity={1.6}
            castShadow
            shadow-mapSize={[1024, 1024]}
            color="#ffffff"
          />
          <directionalLight position={[-6, 4, -4]} intensity={0.8} color="#38bdf8" />
          <pointLight position={[0, 3, 0]} intensity={1.2} color="#00f0ff" distance={8} />

          {/* Ground Contact Shadows & Grid */}
          <ContactShadows
            position={[0, 0, 0]}
            opacity={0.7}
            scale={10}
            blur={2.0}
            far={4}
            color="#020617"
          />
          <Grid
            position={[0, -0.01, 0]}
            args={[14, 14]}
            cellSize={0.5}
            cellThickness={0.7}
            cellColor="#1e293b"
            sectionSize={2.0}
            sectionThickness={1.2}
            sectionColor="#00f0ff"
            fadeDistance={10}
            fadeStrength={1.5}
          />

          {/* Textile Machine Model */}
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
                setCameraPreset(item.id);
                if (item.id === "motor") setSelectedComponent("main_motor");
                else if (item.id === "bearings") setSelectedComponent("bearings");
                else if (item.id === "loom") setSelectedComponent("loom_section");
                else if (item.id === "belt") setSelectedComponent("belt_system");
                else setSelectedComponent(null);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-hud font-medium transition tracking-wider ${cameraPreset === item.id
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
          <span className="text-xs font-hud tracking-wide font-bold">
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

