import React, { useEffect } from "react";
import { useTwin } from "../../context/TwinContext";
import { PicanolTwin } from "./PicanolModel";
import { ToyotaTwin } from "./ToyotaModel";
import { TsudakomaTwin } from "./TsudakomaModel";

export interface MachineModelSwitchProps {
  machineId: string;
}

function loadModel(modelFile: string) {
  if (typeof window !== "undefined") {
    (window as any).__ACTIVE_DIGITAL_TWIN_MODEL__ = modelFile;
  }
  return modelFile;
}

/**
 * Clean Digital Twin Model Router & Switch Orchestrator
 * Delegated to dedicated Picanol, Toyota, and Tsudakoma 3D twin models.
 */
export const MachineModelSwitch: React.FC<MachineModelSwitchProps> = ({ machineId }) => {
  const {
    displayTelemetry,
    viewportMode,
    isExploded,
    faultBeamEnabled,
    activeScenario,
    selectedComponent,
    setSelectedComponent,
    setCameraPreset,
  } = useTwin();

  const telemetry = displayTelemetry;
  const rpm = telemetry?.sensors?.rpm ?? 650;
  const vibration = telemetry?.sensors?.vibration ?? 100;
  const temperature = telemetry?.sensors?.temperature ?? 32;
  const health = telemetry?.overall_health_score ?? 98;
  const status = telemetry?.overall_status ?? "Healthy";

  useEffect(() => {
    if (machineId === "toyota") {
      loadModel("toyota_jat910.glb");
    } else if (machineId === "tsudakoma") {
      loadModel("tsudakoma_zax001.glb");
    } else {
      loadModel("picanol.glb");
    }
  }, [machineId]);

  const handleInspect = (compKey: string) => {
    setSelectedComponent(compKey);
    if (compKey === "main_motor") setCameraPreset("motor");
    else if (compKey === "bearings") setCameraPreset("bearings");
    else if (compKey === "loom_section") setCameraPreset("loom");
    else if (compKey === "belt_system") setCameraPreset("belt");
  };

  const commonProps = {
    rpm,
    vibration,
    temperature,
    health,
    status,
    mode: viewportMode,
    isExploded,
    faultBeamEnabled,
    activeScenario,
    selectedComponent,
    onInspect: handleInspect,
  };

  if (machineId === "toyota") {
    return <ToyotaTwin {...commonProps} />;
  }

  if (machineId === "tsudakoma") {
    return <TsudakomaTwin {...commonProps} />;
  }

  return <PicanolTwin {...commonProps} />;
};
