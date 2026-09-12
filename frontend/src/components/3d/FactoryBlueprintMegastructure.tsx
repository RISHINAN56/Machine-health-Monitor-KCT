import React, { useRef, useMemo } from "react";
import { useFrame } from "@react-three/fiber";
import * as THREE from "three";

interface FactoryBlueprintMegastructureProps {
  opacity?: number;
}

export const FactoryBlueprintMegastructure: React.FC<FactoryBlueprintMegastructureProps> = ({
  opacity = 0.1,
}) => {
  const pulsesGroupRef = useRef<THREE.Group>(null);
  const networkGroupRef = useRef<THREE.Group>(null);

  // Digital nodes across the 4 factory sectors
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

  return (
    <group position={[0, 4.2, -10.5]} name="factory-blueprint-megastructure">
      {/* 1. ARCHITECTURAL CAD GRID & SECTOR BOUNDS */}
      {/* Outer Factory Perimeter Boundary Frame */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(26, 12, 0.05)]} />
        <lineBasicMaterial
          color="#00e5ff"
          transparent
          opacity={opacity * 0.9}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </lineSegments>

      {/* Sub-Sector Grid Lines */}
      {[-13, -6.5, 0, 6.5, 13].map((gx, idx) => (
        <line key={`v-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([gx, -6, 0, gx, 6, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#0284c7"
            transparent
            opacity={opacity * 0.55}
            depthWrite={false}
          />
        </line>
      ))}

      {[-6, -2, 2, 6].map((gy, idx) => (
        <line key={`h-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={new Float32Array([-13, gy, 0, 13, gy, 0])}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#0284c7"
            transparent
            opacity={opacity * 0.55}
            depthWrite={false}
          />
        </line>
      ))}

      {/* 2. CONDUIT PIPELINES & DATA BUSSES */}
      {conduitLines.map((lineArr, idx) => (
        <line key={`conduit-${idx}`}>
          <bufferGeometry>
            <bufferAttribute
              attach="attributes-position"
              count={2}
              array={lineArr}
              itemSize={3}
            />
          </bufferGeometry>
          <lineBasicMaterial
            color="#38bdf8"
            transparent
            opacity={opacity * 0.8}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
          />
        </line>
      ))}

      {/* 3. DIGITAL MACHINE NODES & FLOW HUBS */}
      <group ref={pulsesGroupRef}>
        {nodes.map((node) => {
          const isWarning = node.status === "warning";
          const isHub = node.status === "hub";
          const nodeColor = isWarning ? "#f59e0b" : isHub ? "#00e5ff" : "#38bdf8";

          return (
            <group key={node.id} position={[node.x, node.y, 0]}>
              {/* Node Outer Ring */}
              <mesh>
                <ringGeometry args={[0.32, 0.38, 24]} />
                <meshBasicMaterial
                  color={nodeColor}
                  transparent
                  opacity={opacity * 1.2}
                  depthWrite={false}
                  blending={THREE.AdditiveBlending}
                />
              </mesh>

              {/* Node Core Dot */}
              <mesh>
                <circleGeometry args={[0.15, 16]} />
                <meshBasicMaterial
                  color={nodeColor}
                  transparent
                  opacity={opacity * 1.5}
                  depthWrite={false}
                />
              </mesh>

              {/* Faint Octagonal Boundary */}
              <lineLoop>
                <circleGeometry args={[0.65, 8]} />
                <lineBasicMaterial
                  color={nodeColor}
                  transparent
                  opacity={opacity * 0.6}
                  depthWrite={false}
                />
              </lineLoop>
            </group>
          );
        })}
      </group>

      {/* 4. METADATA SPEC LABELS (Faint Architectural Markings) */}
      {/* Top Header */}
      <mesh position={[-9.5, 5.2, 0.02]}>
        <planeGeometry args={[5.2, 0.6]} />
        <meshBasicMaterial
          color="#00e5ff"
          transparent
          opacity={opacity * 0.4}
          depthWrite={false}
        />
      </mesh>
      {/* Plant Blueprint Watermark Plane */}
      <mesh position={[9.5, -5.0, 0.02]}>
        <planeGeometry args={[4.8, 0.5]} />
        <meshBasicMaterial
          color="#0284c7"
          transparent
          opacity={opacity * 0.35}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
};
