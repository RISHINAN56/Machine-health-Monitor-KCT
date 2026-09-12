import React, { useRef, useState, useMemo } from "react";
import * as THREE from "three";
import { Html } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useTwin } from "../../context/TwinContext";
import { soundEffects } from "../../utils/soundEffects";

interface FloatingHudLabelsProps {
  visible?: boolean;
}

interface ComponentLabelConfig {
  id: string;
  name: string;
  shortName: string;
  anchor: [number, number, number]; // 3D point on physical component surface
  labelPos: [number, number, number]; // Perimeter clearance point in empty space
  getHealth: (telemetry: any) => number;
  getMetric: (telemetry: any) => string;
  isFailing?: (telemetry: any) => boolean;
}

// Perimeter Clearance Placement: Each label extends outwards into empty negative space
const LABELS: ComponentLabelConfig[] = [
  {
    id: "main_motor",
    name: "Sumo Motor Drive",
    shortName: "MOTOR",
    anchor: [-1.3, 1.05, 0.55],
    labelPos: [-2.1, 1.55, 0.55],
    getHealth: (t) => t?.components?.main_motor?.health_score ?? 94,
    getMetric: (t) =>
      `${(t?.sensors?.temperature ?? 42.0).toFixed(0)}°C • ${(t?.sensors?.motor_current ?? 12.4).toFixed(1)}A • RUL:${t?.components?.main_motor?.remaining_useful_life_days ?? 45}d`,
    isFailing: (t) => t?.components?.main_motor?.is_failing ?? false,
  },
  {
    id: "belt_system",
    name: "Belt Transmission",
    shortName: "BELT",
    anchor: [-0.65, 1.25, 0.55],
    labelPos: [-1.2, 2.05, -0.2],
    getHealth: (t) => t?.components?.belt_system?.health_score ?? 91,
    getMetric: (t) => `SYNC • STRESS: ${t?.components?.belt_system?.stress_level ?? 25}%`,
    isFailing: (t) => t?.components?.belt_system?.is_failing ?? false,
  },
  {
    id: "bearings",
    name: "Spindle Roller Bearing",
    shortName: "BEARING",
    anchor: [0.0, 1.5, 0.55],
    labelPos: [0.0, 2.3, 0.55],
    getHealth: (t) => t?.components?.bearings?.health_score ?? 89,
    getMetric: (t) =>
      `${(t?.sensors?.vibration ?? 2.1).toFixed(1)} mm/s • RUL:${t?.components?.bearings?.remaining_useful_life_days ?? 60}d`,
    isFailing: (t) => t?.components?.bearings?.is_failing ?? false,
  },
  {
    id: "drive_shaft",
    name: "Main Drive Shaft",
    shortName: "SHAFT",
    anchor: [-0.25, 1.4, 0.6],
    labelPos: [-0.4, 0.75, 1.25],
    getHealth: (t) => t?.components?.drive_shaft?.health_score ?? 96,
    getMetric: (t) => `${(t?.sensors?.rpm ?? 650).toFixed(0)} RPM`,
    isFailing: (t) => t?.components?.drive_shaft?.is_failing ?? false,
  },
  {
    id: "loom_section",
    name: "Sley & E-Shed Loom",
    shortName: "SLEY",
    anchor: [0.85, 1.1, 0.35],
    labelPos: [2.0, 1.65, 0.55],
    getHealth: (t) => t?.components?.loom_section?.health_score ?? 97,
    getMetric: (t) => `${(t?.sensors?.loom_speed ?? 650).toFixed(0)} PPM • SHED 12mm`,
    isFailing: (t) => t?.components?.loom_section?.is_failing ?? false,
  },
];

const HudCalloutItem: React.FC<{
  item: ComponentLabelConfig;
  health: number;
  metric: string;
  isFailing: boolean;
  isSelected: boolean;
  isOtherSelected: boolean;
  onSelect: (id: string) => void;
}> = ({ item, health, metric, isFailing, isSelected, isOtherSelected, onSelect }) => {
  const [isHovered, setIsHovered] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const labelPosVec = useMemo(() => new THREE.Vector3(...item.labelPos), [item.labelPos]);

  if (isOtherSelected && !isSelected) {
    return null;
  }

  useFrame(({ camera }) => {
    if (cardRef.current) {
      const dist = camera.position.distanceTo(labelPosVec);
      const clampedScale = Math.min(1.15, Math.max(0.72, 4.8 / dist));
      cardRef.current.style.transform = `scale(${clampedScale})`;
    }
  });

  const theme = isFailing || health < 50
    ? {
        accent: "#ef4444",
        text: "text-red-400",
        border: "border-red-500/80",
        badgeBg: "bg-red-500/20",
        glow: "shadow-[0_0_15px_rgba(239,68,68,0.4)]",
        scanline: "from-red-500/0 via-red-500/25 to-red-500/0",
      }
    : health < 75
    ? {
        accent: "#f59e0b",
        text: "text-amber-400",
        border: "border-amber-500/80",
        badgeBg: "bg-amber-500/20",
        glow: "shadow-[0_0_15px_rgba(245,158,11,0.35)]",
        scanline: "from-amber-500/0 via-amber-500/25 to-amber-500/0",
      }
    : {
        accent: "#00e5ff",
        text: "text-cyan-300",
        border: "border-cyan-400/70",
        badgeBg: "bg-cyan-500/20",
        glow: "shadow-[0_0_15px_rgba(0,229,255,0.3)]",
        scanline: "from-cyan-400/0 via-cyan-400/25 to-cyan-400/0",
      };

  const linePoints = useMemo(() => {
    const p1 = new THREE.Vector3(...item.anchor);
    const midY = (item.anchor[1] + item.labelPos[1]) / 2;
    const pMid = new THREE.Vector3(
      item.anchor[0] * 0.4 + item.labelPos[0] * 0.6,
      midY,
      item.anchor[2] * 0.4 + item.labelPos[2] * 0.6
    );
    const p2 = new THREE.Vector3(...item.labelPos);
    return [p1, pMid, p2];
  }, [item.anchor, item.labelPos]);

  return (
    <group>
      {/* 1. Component Surface Anchor Pin */}
      <group position={item.anchor}>
        <mesh>
          <sphereGeometry args={[0.02, 16, 16]} />
          <meshBasicMaterial color={theme.accent} toneMapped={false} />
        </mesh>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.028, 0.038, 20]} />
          <meshBasicMaterial color={theme.accent} transparent opacity={isSelected ? 0.95 : 0.5} toneMapped={false} />
        </mesh>
      </group>

      {/* 2. Angled Perimeter Leader Line */}
      <line>
        <bufferGeometry
          attach="geometry"
          onUpdate={(geo) => {
            geo.setFromPoints(linePoints);
          }}
        />
        <lineBasicMaterial
          attach="material"
          color={theme.accent}
          transparent
          opacity={isSelected ? 0.9 : isHovered ? 0.75 : 0.45}
        />
      </line>

      {/* 3. Iron Man / Omniverse Holographic AR Label */}
      <group position={item.labelPos}>
        <Html center zIndexRange={[100, 0]}>
          <div
            ref={cardRef}
            style={{ transformOrigin: "center center" }}
            onMouseEnter={() => {
              setIsHovered(true);
              soundEffects.playHoverTick();
            }}
            onMouseLeave={() => setIsHovered(false)}
            onClick={(e) => {
              e.stopPropagation();
              onSelect(item.id);
            }}
            className="cursor-pointer select-none transition-transform duration-200"
          >
            {isSelected ? (
              /* Selected Inspection State */
              <div
                className={`relative flex flex-col gap-1 px-3 py-1.5 rounded-lg backdrop-blur-xl bg-slate-950/85 border ${theme.border} ${theme.glow} overflow-hidden font-mono`}
              >
                {/* Animated Scanline Sweep */}
                <div
                  className={`absolute inset-0 bg-gradient-to-b ${theme.scanline} pointer-events-none animate-pulse`}
                />

                <div className="flex items-center justify-between gap-3 relative z-10">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full animate-ping" style={{ backgroundColor: theme.accent }} />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-white">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`px-1.5 py-0.2 rounded font-extrabold text-[9px] ${theme.badgeBg} ${theme.text}`}
                  >
                    {health.toFixed(0)}%
                  </span>
                </div>
                <div className="text-[8.5px] text-slate-300 whitespace-nowrap relative z-10 font-medium">
                  {metric}
                </div>
              </div>
            ) : isHovered ? (
              /* Hover Expanded State */
              <div
                className={`relative flex flex-col gap-0.5 px-2.5 py-1 rounded-md backdrop-blur-md bg-slate-950/80 border ${theme.border} ${theme.glow} overflow-hidden font-mono`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-200">
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-[8.5px] font-extrabold ${theme.text}`}>
                    {health.toFixed(0)}%
                  </span>
                </div>
                <div className="text-[8px] text-slate-400 whitespace-nowrap">
                  {metric}
                </div>
              </div>
            ) : (
              /* Default Compact State with Sci-Fi Angled Corners & Glow */
              <div
                className={`relative flex items-center gap-1.5 px-2 py-0.5 rounded backdrop-blur-sm bg-slate-950/65 border ${theme.border} ${theme.glow} hover:bg-slate-900/90 transition-colors font-mono`}
              >
                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: theme.accent }} />
                <span className="text-[8.5px] font-bold uppercase tracking-wider text-slate-200">
                  {item.shortName}
                </span>
                <span className={`text-[8.5px] font-extrabold ${theme.text}`}>
                  {health.toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </Html>
      </group>
    </group>
  );
};

export const FloatingHudLabels: React.FC<FloatingHudLabelsProps> = ({ visible = true }) => {
  const { displayTelemetry, selectedComponent, setSelectedComponent, setCameraPreset } = useTwin();

  if (!visible) return null;

  const isOtherSelected = Boolean(selectedComponent);

  const handleSelect = (id: string) => {
    soundEffects.playInspectionSound();
    if (selectedComponent === id) {
      setSelectedComponent(null);
      setCameraPreset("isometric");
    } else {
      setSelectedComponent(id);
      if (id === "main_motor") setCameraPreset("motor");
      else if (id === "bearings") setCameraPreset("bearings");
      else if (id === "belt_system") setCameraPreset("belt");
      else if (id === "loom_section") setCameraPreset("loom");
      else if (id === "drive_shaft") setCameraPreset("isometric");
    }
  };

  return (
    <group name="iron-man-holographic-hud-labels">
      {LABELS.map((item) => {
        const health = item.getHealth(displayTelemetry);
        const metric = item.getMetric(displayTelemetry);
        const isFailing = item.isFailing ? item.isFailing(displayTelemetry) : false;
        const isSelected = selectedComponent === item.id;

        return (
          <HudCalloutItem
            key={item.id}
            item={item}
            health={health}
            metric={metric}
            isFailing={isFailing}
            isSelected={isSelected}
            isOtherSelected={isOtherSelected}
            onSelect={handleSelect}
          />
        );
      })}
    </group>
  );
};
