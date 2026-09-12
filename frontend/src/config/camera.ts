import { CameraPreset } from "../types";

export const CAMERA_PRESETS: { id: CameraPreset; label: string; componentId?: string }[] = [
  { id: "isometric", label: "Isometric Overview" },
  { id: "motor", label: "Main Motor", componentId: "main_motor" },
  { id: "bearings", label: "Spindle Bearings", componentId: "bearings" },
  { id: "loom", label: "Weaving Loom", componentId: "loom_section" },
  { id: "belt", label: "Drive Belt", componentId: "belt_system" },
  { id: "top", label: "Top View" },
];

export const TARGET_POSITIONS: Record<CameraPreset, [number, number, number]> = {
  isometric: [4.2, 3.2, 4.6],
  motor: [-2.2, 1.6, 1.8],
  bearings: [0.0, 2.2, 2.1],
  loom: [0.0, 2.2, 2.6],
  belt: [-1.4, 1.8, 1.8],
  top: [0.0, 6.2, 0.1],
};

export const LOOK_AT_TARGETS: Record<CameraPreset, [number, number, number]> = {
  isometric: [0, 0.9, 0],
  motor: [-1.3, 0.8, 0.55],
  bearings: [0, 1.4, 0.55],
  loom: [0, 0.9, 0],
  belt: [-0.65, 0.95, 0.55],
  top: [0, 0.5, 0],
};

export const CAMERA_CONFIG = {
  defaultFov: 42,
  minDistance: 1.8,
  maxDistance: 14.0,
  maxPolarAngle: Math.PI / 2 + 0.05,
  dampingFactor: 0.05,
  orbitSpeed: 0.005,
  autoRotateSpeed: 1.4,
};
