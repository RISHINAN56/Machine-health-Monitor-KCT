import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

export interface FactoryBlueprintMegastructureProps {
  opacity?: number;
}

/**
 * Architectural CAD Blueprint Megastructure (NVIDIA Omniverse / Siemens Xcelerator Standard)
 * Rendered at 5% to 12% opacity in deep background negative space to create depth and scale.
 */
export const FactoryBlueprintMegastructure: React.FC<FactoryBlueprintMegastructureProps> = ({
  opacity = 0.08,
}) => {
  const pulsesGroupRef = useRef<THREE.Group>(null);

  // Digital nodes across the factory sectors
  const nodes = useMemo(
    () => [
      { id: "BAY-01", label: "BAY 1: PICANOL SUMMUM", x: -7.5, y: 1.5, status: "nominal" },
      { id: "BAY-02", label: "BAY 2: TOYOTA JAT910", x: 0.0, y: 1.5, status: "nominal" },
      { id: "BAY-03", label: "BAY 3: TSUDAKOMA ZAX", x: 7.5, y: 1.5, status: "warning" },
      { id: "WARP-01", label: "HIGH-SPEED WARPING", x: -5.0, y: 5.5, status: "nominal" },
      { id: "SIZING-01", label: "AUTOMATED SIZING", x: 5.0, y: 5.5, status: "nominal" },
      { id: "FINISH-01", label: "STENTER & FINISHING", x: -6.0, y: -2.5, status: "nominal" },
      { id: "QC-01", label: "AI VISION INSPECTION", x: 6.0, y: -2.5, status: "nominal" },
      { id: "HUB-HQ", label: "CENTRAL COMMAND MHM", x: 0.0, y: 3.8, status: "hub" },
    ],
    []
  );

  // Holographic conduit line paths between nodes
  const conduitLines = useMemo(() => {
    const pairs: [number, number, number, number][] = [
      [-7.5, 1.5, 0.0, 3.8],
      [0.0, 1.5, 0.0, 3.8],
      [7.5, 1.5, 0.0, 3.8],
      [-5.0, 5.5, 0.0, 3.8],
      [5.0, 5.5, 0.0, 3.8],
      [-7.5, 1.5, -6.0, -2.5],
      [7.5, 1.5, 6.0, -2.5],
      [-6.0, -2.5, 6.0, -2.5],
      [-5.0, 5.5, 5.0, 5.5],
    ];

    const lines: Float32Array[] = [];
    pairs.forEach(([x1, y1, x2, y2]) => {
      lines.push(new Float32Array([x1, y1, 0, x2, y2, 0]));
    });
    return lines;
  }, []);

  useFrame((state) => {
    const t = state.clock.getElapsedTime();
    if (pulsesGroupRef.current) {
      pulsesGroupRef.current.children.forEach((child, idx) => {
        const mesh = child as THREE.Mesh;
        if (mesh.material) {
          const mat = mesh.material as THREE.MeshBasicMaterial;
          mat.opacity = opacity * (0.6 + 0.4 * Math.sin(t * 2.5 + idx));
        }
      });
    }
  });

  const frameWidth = 26;
  const frameHeight = 12;

  return (
    <group position={[0, 4.2, -10.5]} name="factory-blueprint-megastructure">
      {/* Outer CAD Border */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(frameWidth, frameHeight, 0.05)]} />
        <lineBasicMaterial color="#00e5ff" transparent opacity={opacity * 0.75} depthWrite={false} />
      </lineSegments>

      {/* Internal Grid Divisions */}
      {[-8, -4, 0, 4, 8].map((gx, idx) => (
        <line key={`grid-v-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([gx, -frameHeight / 2, 0, gx, frameHeight / 2, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00e5ff" transparent opacity={opacity * 0.35} depthWrite={false} />
        </line>
      ))}

      {[-3, 0, 3].map((gy, idx) => (
        <line key={`grid-h-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([-frameWidth / 2, gy, 0, frameWidth / 2, gy, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial color="#00e5ff" transparent opacity={opacity * 0.35} depthWrite={false} />
        </line>
      ))}

      {/* Structural Truss Silhouettes */}
      {[-10, 0, 10].map((tx, idx) => (
        <group key={`truss-${idx}`} position={[tx, 4.5, 0]}>
          <lineSegments>
            <edgesGeometry args={[new THREE.BoxGeometry(3.6, 1.2, 0.05)]} />
            <lineBasicMaterial color="#38bdf8" transparent opacity={opacity * 0.8} depthWrite={false} />
          </lineSegments>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([-1.8, -0.6, 0, 1.8, 0.6, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#38bdf8" transparent opacity={opacity * 0.5} depthWrite={false} />
          </line>
          <line>
            <bufferGeometry>
              <bufferAttribute
                attach="attributes-position"
                count={2}
                array={new Float32Array([-1.8, 0.6, 0, 1.8, -0.6, 0])}
                itemSize={3}
              />
            </bufferGeometry>
            <lineBasicMaterial color="#38bdf8" transparent opacity={opacity * 0.5} depthWrite={false} />
          </line>
        </group>
      ))}

      {/* Network Pipeline Conduits */}
      {conduitLines.map((lineData, idx) => (
        <line key={`conduit-${idx}`}>
          <bufferGeometry>
            <bufferAttribute attach="attributes-position" count={2} array={lineData} itemSize={3} />
          </bufferGeometry>
          <lineBasicMaterial
            color="#00e5ff"
            transparent
            opacity={opacity * 0.9}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}

      {/* Sector Nodes */}
      {nodes.map((node) => {
        const isWarning = node.status === "warning";
        const isHub = node.status === "hub";
        const nodeColor = isWarning ? "#f59e0b" : isHub ? "#38bdf8" : "#00ffc8";

        return (
          <group key={node.id} position={[node.x, node.y, 0.02]}>
            <mesh>
              <ringGeometry args={[0.22, 0.28, 24]} />
              <meshBasicMaterial
                color={nodeColor}
                transparent
                opacity={opacity * 1.5}
                depthWrite={false}
                side={THREE.DoubleSide}
              />
            </mesh>
            <mesh>
              <circleGeometry args={[0.08, 16]} />
              <meshBasicMaterial
                color={nodeColor}
                transparent
                opacity={opacity * 1.8}
                depthWrite={false}
              />
            </mesh>
          </group>
        );
      })}

      {/* Animated Pulse Rings on Nodes */}
      <group ref={pulsesGroupRef}>
        {nodes.map((node, idx) => (
          <mesh key={`pulse-${idx}`} position={[node.x, node.y, 0.03]}>
            <ringGeometry args={[0.34, 0.38, 24]} />
            <meshBasicMaterial
              color="#00e5ff"
              transparent
              opacity={opacity}
              depthWrite={false}
              side={THREE.DoubleSide}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
};
