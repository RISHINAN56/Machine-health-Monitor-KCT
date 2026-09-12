import { SimulationScenario } from "../types";

export interface ScenarioDefinition {
  id: SimulationScenario;
  title: string;
  description: string;
  targetComponent: string;
  severity: "HEALTHY" | "WARNING" | "CRITICAL";
}

export const SIMULATION_SCENARIOS: ScenarioDefinition[] = [
  {
    id: "normal",
    title: "Baseline Nominal",
    description: "Optimal ISO 10816 Zone A operation with standard thermal and harmonic balances.",
    targetComponent: "All Components",
    severity: "HEALTHY",
  },
  {
    id: "bearing_wear",
    title: "Spindle Bearing Wear",
    description: "High harmonic vibration spikes and localized micro-spalling on spindle bearings.",
    targetComponent: "bearings",
    severity: "WARNING",
  },
  {
    id: "belt_looseness",
    title: "Belt Slip & Resonance",
    description: "Mechanical backlash and timing belt slack leading to tension degradation.",
    targetComponent: "belt_system",
    severity: "WARNING",
  },
  {
    id: "overheating",
    title: "Motor Stator Overheating",
    description: "Excessive core winding temperature and winding insulation stress.",
    targetComponent: "main_motor",
    severity: "CRITICAL",
  },
];
