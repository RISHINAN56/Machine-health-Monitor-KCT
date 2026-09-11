import React, { useEffect, useRef, useState } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Grid, OrbitControls } from "@react-three/drei";
import * as THREE from "three";
import { useTwin } from "../../context/TwinContext";
import { TextileMachine } from "./TextileMachine";
import { CameraPreset } from "../../types";
import {
  Maximize2,
  Minimize2,
  RotateCcw,
  Sliders,
  Layers,
  Camera,
  Activity,
} from "lucide-react";

// Camera Rig for smooth animated camera transitions between presets
const CameraController: React.FC<{ preset: CameraPreset }> = ({ preset }) => {
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

  const currentLookAt = useRef(new THREE.Vector3(0, 0.9, 0));

  useFrame(({ camera }) => {
    const desiredPos = new THREE.Vector3(...targetPositions[preset]);
    const desiredLook = new THREE.Vector3(...lookAtTargets[preset]);

    // Smooth lerp camera
    camera.position.lerp(desiredPos, 0.05);
    currentLookAt.current.lerp(desiredLook, 0.05);
    camera.lookAt(currentLookAt.current);
  });

  return null;
};

export const CanvasContainer: React.FC = () => {
  const {
    telemetry,
    cameraPreset,
    setCameraPreset,
    wireframeMode,
    setWireframeMode,
    selectedComponent,
    setSelectedComponent,
  } = useTwin();

  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const statusColor =
    telemetry?.overall_status === "Healthy"
      ? "text-cyber-emerald border-cyber-emerald/50"
      : telemetry?.overall_status === "Warning"
      ? "text-cyber-amber border-cyber-amber/50"
      : "text-cyber-crimson border-cyber-crimson/50";

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full min-h-[440px] rounded-2xl overflow-hidden glass-panel border border-industrial-700/60 shadow-panel flex flex-col`}
    >
      {/* 3D Viewport Top HUD Bar */}
      <div className="absolute top-3 left-4 right-4 z-10 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-3 bg-industrial-900/85 backdrop-blur-md px-3.5 py-1.5 rounded-xl border border-industrial-700/60 pointer-events-auto">
          <div className="flex items-center gap-2">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="font-hud text-xs tracking-wider text-cyan-300 uppercase">
              3D Spatial Twin
            </span>
          </div>
          <div className="h-3.5 w-px bg-industrial-700" />
          <span className="text-xs text-slate-400 font-mono">
            {telemetry?.sensors.rpm.toFixed(0) || 0} RPM |{" "}
            {telemetry?.sensors.vibration.toFixed(0) || 0} mm/s
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
          <button
            onClick={() => setWireframeMode((prev) => !prev)}
            className={`p-2 rounded-xl border backdrop-blur-md text-xs transition flex items-center gap-1.5 ${
              wireframeMode
                ? "bg-cyan-500/20 text-cyan-300 border-cyan-400 shadow-glow-cyan"
                : "bg-industrial-900/80 text-slate-400 border-industrial-700 hover:text-slate-200"
            }`}
            title="Toggle Structural Wireframe / CAD Mode"
          >
            <Layers className="w-3.5 h-3.5" />
            <span className="hidden sm:inline font-mono">CAD Wireframe</span>
          </button>

          <button
            onClick={() => setCameraPreset("isometric")}
            className="p-2 rounded-xl bg-industrial-900/80 border border-industrial-700 text-slate-400 hover:text-cyan-300 backdrop-blur-md transition"
            title="Reset Isometric View"
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

      {/* 3D WebGL Canvas */}
      <div className="flex-1 w-full h-full relative cursor-grab active:cursor-grabbing">
        <Canvas
          shadows
          camera={{ position: [4.2, 3.2, 4.6], fov: 42 }}
          gl={{ antialias: true, alpha: true }}
          className="w-full h-full"
        >
          <CameraController preset={cameraPreset} />
          <OrbitControls
            enableDamping
            dampingFactor={0.05}
            minDistance={2.0}
            maxDistance={12.0}
            maxPolarAngle={Math.PI / 2 + 0.05}
            target={[0, 0.9, 0]}
          />

          {/* Industrial Cyber Lighting */}
          <ambientLight intensity={0.65} color="#cbd5e1" />
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
              { id: "isometric", label: "Isometric" },
              { id: "motor", label: "Main Motor" },
              { id: "bearings", label: "Bearings" },
              { id: "loom", label: "Loom Section" },
              { id: "belt", label: "Belt Drive" },
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
              className={`px-3 py-1.5 rounded-lg text-xs font-hud transition tracking-wider ${
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
          <span className="text-xs font-hud tracking-wide font-bold">
            STATUS: {telemetry?.overall_status.toUpperCase() || "CONNECTING"}
          </span>
          <span className="text-xs font-mono font-semibold">
            ({telemetry?.overall_health_score.toFixed(0) || 100}%)
          </span>
        </div>
      </div>
    </div>
  );
};
