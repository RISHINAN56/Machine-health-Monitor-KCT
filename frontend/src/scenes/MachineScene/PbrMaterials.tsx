import React from "react";
import { ViewportMode } from "../../types";

export type IndustrialMaterialType =
  | "frame"
  | "roller"
  | "belt"
  | "sensor"
  | "glass"
  | "default";

/**
 * Enterprise PBR Material Resolver for Industrial Digital Twin
 * Supports Standard PBR, Holographic, Thermal gradient, Wireframe, and XR Inspection modes.
 */
export function getComponentMaterial(
  mode: ViewportMode,
  baseColor: string,
  temp: number,
  isFailing: boolean,
  isSelected: boolean,
  materialType: IndustrialMaterialType = "default"
): React.ReactElement {
  if (mode === "holographic") {
    return (
      <meshStandardMaterial
        color={isFailing ? "#ff0055" : isSelected ? "#38bdf8" : "#00e5ff"}
        emissive={isFailing ? "#ff0055" : "#00e5ff"}
        emissiveIntensity={0.85}
        transparent={true}
        opacity={0.38}
        wireframe={false}
      />
    );
  }

  if (mode === "thermal") {
    // Blue: Cool (<35), Green: Normal (35-45), Orange: Warning (45-60), Red: Critical (>60)
    const thermalColor =
      temp < 35 ? "#0077b6" : temp < 45 ? "#10b981" : temp < 60 ? "#f59e0b" : "#ef4444";
    return (
      <meshStandardMaterial
        color={thermalColor}
        emissive={thermalColor}
        emissiveIntensity={0.8}
        roughness={0.4}
        metalness={0.2}
      />
    );
  }

  if (mode === "wireframe") {
    return (
      <meshBasicMaterial
        color={isFailing ? "#ef4444" : isSelected ? "#38bdf8" : "#00e5ff"}
        wireframe={true}
      />
    );
  }

  // Failing component highlighting
  if (isFailing) {
    return (
      <meshStandardMaterial
        color="#ef4444"
        emissive="#ff0055"
        emissiveIntensity={1.0}
        metalness={0.8}
        roughness={0.2}
        toneMapped={false}
      />
    );
  }

  // User inspection selection
  if (isSelected) {
    return (
      <meshStandardMaterial
        color="#38bdf8"
        emissive="#00e5ff"
        emissiveIntensity={0.8}
        metalness={0.85}
        roughness={0.25}
        toneMapped={false}
      />
    );
  }

  // Specialized Industrial PBR Material Presets
  switch (materialType) {
    case "frame":
      // Powder-Coated Cast Steel Chassis
      return (
        <meshStandardMaterial
          color={baseColor}
          metalness={0.65}
          roughness={0.34}
        />
      );
    case "roller":
      // Brushed High-Finish Aluminium
      return (
        <meshStandardMaterial
          color="#cbd5e1"
          metalness={0.94}
          roughness={0.18}
        />
      );
    case "belt":
      // Industrial Textured Rubber
      return (
        <meshStandardMaterial
          color="#18181b"
          metalness={0.06}
          roughness={0.88}
        />
      );
    case "sensor":
      // Gloss Piano Black Housing
      return (
        <meshStandardMaterial
          color="#05070a"
          metalness={0.2}
          roughness={0.12}
        />
      );
    case "glass":
      // Translucent Inspection Assembly Enclosure
      return (
        <meshStandardMaterial
          color="#e0f2fe"
          metalness={0.1}
          roughness={0.1}
          transparent={true}
          opacity={0.55}
        />
      );
    default:
      return (
        <meshStandardMaterial
          color={baseColor}
          metalness={0.75}
          roughness={0.3}
        />
      );
  }
}
