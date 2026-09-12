import React, { useEffect, useMemo } from "react";
import { useThree, useFrame } from "@react-three/fiber";
import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/examples/jsm/postprocessing/OutputPass.js";

interface BloomComposerProps {
  enabled?: boolean;
}

export const BloomComposer: React.FC<BloomComposerProps> = ({ enabled = true }) => {
  const { gl, scene, camera, size } = useThree();

  const composer = useMemo(() => {
    const comp = new EffectComposer(gl);
    comp.renderToScreen = true;

    // 1. Base Scene Render Pass
    const renderPass = new RenderPass(scene, camera);
    comp.addPass(renderPass);

    // 2. High-Fidelity Unreal Bloom Pass (Tuned for enterprise industrial glow)
    // threshold: only high-intensity emissive lights/rings/lasers trigger bloom
    // strength: 0.65 for subtle, premium glow without blinding whitewash
    // radius: 0.4 for smooth Gaussian falloff
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(size.width, size.height),
      0.65, // strength
      0.4,  // radius
      0.82  // threshold
    );
    comp.addPass(bloomPass);

    // 3. Color Management & Output Pass
    const outputPass = new OutputPass();
    comp.addPass(outputPass);

    return comp;
  }, [gl, scene, camera]);

  // Handle canvas resize
  useEffect(() => {
    composer.setSize(size.width, size.height);
  }, [composer, size]);

  // Take over render loop with high priority (1)
  useFrame((_, delta) => {
    if (enabled) {
      composer.render(delta);
    }
  }, 1);

  return null;
};
