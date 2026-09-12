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
// around the machine so annotations NEVER block Main Motor, Drive Shaft, Belt, or Loom.
const LABELS: ComponentLabelConfig[] = [
  {
    id: "main_motor",
    name: "Motor Unit",
    shortName: "MOTOR",
    anchor: [-1.3, 1.05, 0.55], // Physical motor top
    labelPos: [-1.9, 1.45, 0.55], // Outward left clearance
    getHealth: (t) => t?.components?.main_motor?.health_score ?? 94,
    getMetric: (t) =>
      `${(t?.sensors?.temperature ?? 42.0).toFixed(0)}°C • ${(t?.sensors?.motor_current ?? 12.4).toFixed(1)}A • RUL:${t?.components?.main_motor?.remaining_useful_life_days ?? 45}d`,
    isFailing: (t) => t?.components?.main_motor?.is_failing ?? false,
  },
  {
    id: "belt_system",
    name: "Belt Transmission",
    shortName: "BELT",
    anchor: [-0.65, 1.25, 0.55], // Physical pulley housing
    labelPos: [-1.15, 1.9, -0.15], // Elevated rear-left clearance
    getHealth: (t) => t?.components?.belt_system?.health_score ?? 91,
    getMetric: (t) => `SYNC • STRESS: ${t?.components?.belt_system?.stress_level ?? 25}%`,
    isFailing: (t) => t?.components?.belt_system?.is_failing ?? false,
  },
  {
    id: "bearings",
    name: "Spindle Bearing",
    shortName: "BEARINGS",
    anchor: [0.0, 1.5, 0.55], // Center spindle bearing housing
    labelPos: [0.0, 2.15, 0.55], // High-clearance overhead sky
    getHealth: (t) => t?.components?.bearings?.health_score ?? 89,
    getMetric: (t) =>
      `${(t?.sensors?.vibration ?? 2.1).toFixed(1)} mm/s • RUL:${t?.components?.bearings?.remaining_useful_life_days ?? 60}d`,
    isFailing: (t) => t?.components?.bearings?.is_failing ?? false,
  },
  {
    id: "drive_shaft",
    name: "Drive Shaft",
    shortName: "SHAFT",
    anchor: [-0.25, 1.4, 0.6], // Drive shaft axis
    labelPos: [-0.4, 0.85, 1.15], // Lower-forward foreground clearance
    getHealth: (t) => t?.components?.drive_shaft?.health_score ?? 96,
    getMetric: (t) => `${(t?.sensors?.rpm ?? 850).toFixed(0)} RPM`,
    isFailing: (t) => t?.components?.drive_shaft?.is_failing ?? false,
  },
  {
    id: "loom_section",
    name: "Weaving Loom",
    shortName: "LOOM",
    anchor: [0.85, 1.1, 0.35], // Loom frame
    labelPos: [1.8, 1.55, 0.55], // Outward right clearance
    getHealth: (t) => t?.components?.loom_section?.health_score ?? 97,
    getMetric: (t) => `${(t?.sensors?.loom_speed ?? 420).toFixed(0)} PPM • SHED 12mm`,
    isFailing: (t) => t?.components?.loom_section?.is_failing ?? false,
  },
];

// Individual Micro-HUD Item with Bounded Distance Scaling
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

  // Inspection Mode: Hide all non-selected labels to keep the machine 100% visible
  if (isOtherSelected && !isSelected) {
    return null;
  }

  // Camera Distance Scaling:
  // Dynamically clamp scale between 0.72x (far) and 1.15x (close inspection)
  // Strictly prevents giant labels while retaining natural perspective feel
  useFrame(({ camera }) => {
    if (cardRef.current) {
      const dist = camera.position.distanceTo(labelPosVec);
      const clampedScale = Math.min(1.15, Math.max(0.72, 4.8 / dist));
      cardRef.current.style.transform = `scale(${clampedScale})`;
    }
  });

  // Dynamic status color theme based on health / fault status
  const theme = isFailing || health < 50
    ? {
        accent: "#ef4444",
        text: "text-red-400",
        border: "border-red-500/60",
        badgeBg: "bg-red-500/20",
        glow: "shadow-[0_0_8px_rgba(239,68,68,0.35)]",
      }
    : health < 75
    ? {
        accent: "#fbbf24",
        text: "text-amber-400",
        border: "border-amber-500/60",
        badgeBg: "bg-amber-500/20",
        glow: "shadow-[0_0_8px_rgba(251,191,36,0.25)]",
      }
    : health < 90
    ? {
        accent: "#00e5ff",
        text: "text-cyan-400",
        border: "border-cyan-400/50",
        badgeBg: "bg-cyan-500/20",
        glow: "shadow-[0_0_8px_rgba(0,229,255,0.25)]",
      }
    : {
        accent: "#00ff88",
        text: "text-emerald-400",
        border: "border-emerald-400/50",
        badgeBg: "bg-emerald-500/20",
        glow: "shadow-[0_0_8px_rgba(0,255,136,0.2)]",
      };

  // 3D Angled Leader Line from component anchor to perimeter HUD label
  const linePoints = useMemo(() => {
    const p1 = new THREE.Vector3(...item.anchor);
    // Slight mid-break elbow point for authentic CAD schematic look
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
          <sphereGeometry args={[0.016, 16, 16]} />
          <meshBasicMaterial color={theme.accent} />
        </mesh>
        {/* Subtle animated anchor ring */}
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.024, 0.032, 20]} />
          <meshBasicMaterial color={theme.accent} transparent opacity={isSelected ? 0.9 : 0.4} />
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
          opacity={isSelected ? 0.85 : isHovered ? 0.7 : 0.4}
        />
      </line>

      {/* 3. Micro-HUD Label Positioned in Clear Perimeter Space */}
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
              /* Inspection Mode: Detailed HUD Callout (55% smaller than original) */
              <div
                className={`flex flex-col gap-0.5 px-2.5 py-1 rounded-md backdrop-blur-lg bg-slate-950/75 border border-cyan-300/80 shadow-[0_0_14px_rgba(0,240,255,0.35)] transition-all`}
              >
                <div className="flex items-center justify-between gap-2.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    <span className="text-[9px] font-mono font-bold uppercase tracking-wider text-white">
                      {item.name}
                    </span>
                  </div>
                  <span
                    className={`px-1 py-0.2 rounded font-mono font-extrabold text-[8.5px] ${theme.badgeBg} ${theme.text}`}
                  >
                    {health.toFixed(0)}%
                  </span>
                </div>
                <div className="text-[8px] font-mono text-slate-300 whitespace-nowrap">
                  {metric}
                </div>
              </div>
            ) : isHovered ? (
              /* Hover Expanded Micro-Pill */
              <div
                className={`flex flex-col gap-0.5 px-2 py-0.5 rounded-md backdrop-blur-md bg-slate-950/70 border ${theme.border} ${theme.glow} transition-all`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                    <span className="text-[8.5px] font-mono font-semibold uppercase tracking-wider text-slate-200">
                      {item.name}
                    </span>
                  </div>
                  <span className={`text-[8px] font-mono font-bold ${theme.text}`}>
                    {health.toFixed(0)}%
                  </span>
                </div>
                <div className="text-[7.5px] font-mono text-slate-400 whitespace-nowrap">
                  {metric}
                </div>
              </div>
            ) : (
              /* Default Mode: Ultra-Compact Single-Row Micro-HUD Pill (70% smaller than original) */
              <div
                className={`flex items-center gap-1.5 px-1.5 py-0.5 rounded-md backdrop-blur-sm bg-slate-950/55 border ${theme.border} ${theme.glow} hover:bg-slate-900/80 transition-colors`}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: theme.accent }} />
                <span className="text-[8px] font-mono font-semibold uppercase tracking-wider text-slate-300">
                  {item.shortName}
                </span>
                <span className={`text-[8px] font-mono font-bold ${theme.text}`}>
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
    <group>
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

