import React from "react";
import { MachineScene, MachineSceneProps } from "../../scenes/MachineScene/MachineScene";

export interface CanvasContainerProps extends MachineSceneProps {}

/**
 * CanvasContainer Compatibility Wrapper
 * Delegates to the modularized MachineScene architecture.
 */
export const CanvasContainer: React.FC<CanvasContainerProps> = (props) => {
  return <MachineScene {...props} />;
};
