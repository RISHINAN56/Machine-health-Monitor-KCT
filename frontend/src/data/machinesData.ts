// Re-export from single source of truth (src/data/machines.ts) for backward compatibility
export {
  REAL_WORLD_MACHINES,
  REAL_MACHINES_LIST,
  getMachineById,
  generateMachineTelemetryPacket,
} from "./machines";
export type { RealWorldMachine } from "../types";
