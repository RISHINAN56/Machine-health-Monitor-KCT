import React, { useEffect, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { CameraPreset } from "../../types";
import { TARGET_POSITIONS, LOOK_AT_TARGETS } from "../../config/camera";
import { soundEffects } from "../../utils/soundEffects";

export interface CameraSequencerProps {
  preset: CameraPreset;
  controlsRef: React.RefObject<any>;
  autoOrbit: boolean;
  activeMachineId: string;
  selectedComponent: string | null;
}

/**
 * 4-Phase Cinematic Camera Sequencer
 * 1. Pull Back -> 2. Fly In -> 3. Orbit Arc -> 4. Natural Settle
 */
export const CameraSequencer: React.FC<CameraSequencerProps> = ({
  preset,
  controlsRef,
  autoOrbit,
  activeMachineId,
  selectedComponent,
}) => {
  const sequencePhase = useRef<number>(4);
  const phaseTimer = useRef<number>(0);
  const prevMachineRef = useRef(activeMachineId);
  const prevPresetRef = useRef(preset);
  const prevCompRef = useRef(selectedComponent);

  useEffect(() => {
    if (prevMachineRef.current !== activeMachineId) {
      prevMachineRef.current = activeMachineId;
      sequencePhase.current = 1; // Phase 1: Pull Back
      phaseTimer.current = 0;
      soundEffects.playModeSwitch();
    } else if (prevPresetRef.current !== preset || prevCompRef.current !== selectedComponent) {
      prevPresetRef.current = preset;
      prevCompRef.current = selectedComponent;
      sequencePhase.current = 4; // Fast settle for manual preset clicks
    }
  }, [preset, activeMachineId, selectedComponent]);

  useEffect(() => {
    const controls = controlsRef.current;
    if (!controls) return;
    const handleStart = () => {
      sequencePhase.current = 0; // Cancel sequence on user manual drag
    };
    controls.addEventListener("start", handleStart);
    return () => {
      controls.removeEventListener("start", handleStart);
    };
  }, [controlsRef]);

  useFrame(({ camera }, delta) => {
    if (controlsRef.current) {
      controlsRef.current.autoRotate = autoOrbit && sequencePhase.current === 0;
      controlsRef.current.autoRotateSpeed = 0.85;
    }

    if (sequencePhase.current === 0 || !controlsRef.current) return;

    phaseTimer.current += delta;

    let targetPos: [number, number, number] = TARGET_POSITIONS[preset];
    let targetLook: [number, number, number] = LOOK_AT_TARGETS[preset];

    if (selectedComponent === "bearings") {
      targetPos = [0.0, 1.8, 2.1];
      targetLook = [0.0, 1.0, 0.2];
    } else if (selectedComponent === "main_motor") {
      targetPos = [-2.4, 1.6, 1.6];
      targetLook = [-1.5, 0.9, 0.1];
    }

    let desiredPos = new THREE.Vector3(...targetPos);
    let desiredLook = new THREE.Vector3(...targetLook);
    let lerpSpeed = 0.065;

    if (sequencePhase.current === 1) {
      // Phase 1: Pull Back to Wide Establishing View
      desiredPos = new THREE.Vector3(6.8, 4.5, 7.5);
      desiredLook = new THREE.Vector3(0, 1.1, 0);
      lerpSpeed = 0.055;
      if (camera.position.distanceTo(desiredPos) < 0.6 || phaseTimer.current > 0.9) {
        sequencePhase.current = 2;
        phaseTimer.current = 0;
      }
    } else if (sequencePhase.current === 2) {
      // Phase 2: Fly Inward toward Machine
      desiredPos = new THREE.Vector3(5.0, 3.2, 5.4);
      desiredLook = new THREE.Vector3(0, 0.95, 0);
      lerpSpeed = 0.065;
      if (camera.position.distanceTo(desiredPos) < 0.4 || phaseTimer.current > 0.8) {
        sequencePhase.current = 3;
        phaseTimer.current = 0;
      }
    } else if (sequencePhase.current === 3) {
      // Phase 3: Orbit Arc highlighting Machine Profile
      desiredPos = new THREE.Vector3(3.2, 3.4, 5.0);
      desiredLook = new THREE.Vector3(0, 0.9, 0);
      lerpSpeed = 0.07;
      if (camera.position.distanceTo(desiredPos) < 0.3 || phaseTimer.current > 0.7) {
        sequencePhase.current = 4;
        phaseTimer.current = 0;
      }
    } else if (sequencePhase.current === 4) {
      // Phase 4: Settle into Final Inspection Position
      lerpSpeed = 0.08;
      if (
        camera.position.distanceTo(desiredPos) < 0.03 &&
        controlsRef.current.target.distanceTo(desiredLook) < 0.03
      ) {
        sequencePhase.current = 0;
      }
    }

    camera.position.lerp(desiredPos, lerpSpeed);
    controlsRef.current.target.lerp(desiredLook, lerpSpeed);
    controlsRef.current.update();
  });

  return null;
};
