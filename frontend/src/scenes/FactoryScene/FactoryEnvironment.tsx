import React, { useMemo } from "react";
import { MeshReflectorMaterial, ContactShadows, Grid } from "@react-three/drei";
import * as THREE from "three";

export interface FactoryEnvironmentProps {
  machineStatus?: string;
  viewportMode?: string;
}

/**
 * Enterprise Industrial Factory Hall Environment
 * Includes:
 * - Glossy epoxy floor with blurred screen-space reflections
 * - AGV transportation tracks & safety perimeter hazard markings
 * - Structural steel I-beam columns & overhead gantry crane
 * - Overhead utility distribution & distant factory hall silhouettes
 */
export const FactoryEnvironment: React.FC<FactoryEnvironmentProps> = ({
  machineStatus = "Healthy",
  viewportMode = "standard",
}) => {
  const isHolo = viewportMode === "holographic";
  const isWarning = machineStatus === "Warning";

  // AGV factory floor track coordinates
  const agvTrackPositions = useMemo(() => {
    return [
      { start: [-14, 0.004, 3.2], end: [14, 0.004, 3.2] },
      { start: [-14, 0.004, -3.2], end: [14, 0.004, -3.2] },
      { start: [-4.2, 0.004, -8], end: [-4.2, 0.004, 8] },
      { start: [4.2, 0.004, -8], end: [4.2, 0.004, 8] },
    ];
  }, []);

  return (
    <group name="industrial-factory-environment">
      {/* 1. GLOSSY INDUSTRIAL EPOXY FLOOR WITH SCREEN-SPACE REFLECTIONS */}
      <mesh position={[0, -0.015, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[44, 44]} />
        <MeshReflectorMaterial
          blur={[250, 100]}
          resolution={1024}
          mirror={0.55}
          roughness={0.32}
          metalness={0.8}
          mixBlur={1.0}
          mixStrength={55}
          depthScale={1.4}
          minDepthThreshold={0.4}
          maxDepthThreshold={1.8}
          color={isHolo ? "#020917" : "#080e1a"}
        />
      </mesh>

      {/* Ground Contact Soft Shadows */}
      <ContactShadows
        position={[0, 0, 0]}
        opacity={0.85}
        scale={13}
        blur={2.2}
        far={5.5}
        color="#010307"
      />

      {/* Technical Floor Navigation Grid */}
      <Grid
        position={[0, 0.001, 0]}
        args={[36, 36]}
        cellSize={0.6}
        cellThickness={0.6}
        cellColor={isHolo ? "#0284c7" : "#1e293b"}
        sectionSize={3.0}
        sectionThickness={1.2}
        sectionColor={isHolo ? "#00e5ff" : "#0ea5e9"}
        fadeDistance={18}
        fadeStrength={1.4}
      />

      {/* 2. AGV FACTORY NAVIGATION TRACKS */}
      {agvTrackPositions.map((track, i) => {
        const dx = track.end[0] - track.start[0];
        const dz = track.end[2] - track.start[2];
        const len = Math.sqrt(dx * dx + dz * dz);
        const midX = (track.start[0] + track.end[0]) / 2;
        const midZ = (track.start[2] + track.end[2]) / 2;
        const angle = Math.atan2(dx, dz);

        return (
          <group key={`agv-${i}`} position={[midX, 0.003, midZ]} rotation={[-Math.PI / 2, 0, angle]}>
            <mesh>
              <planeGeometry args={[0.06, len]} />
              <meshBasicMaterial
                color="#00ffc8"
                transparent
                opacity={isHolo ? 0.7 : 0.45}
                depthWrite={false}
              />
            </mesh>
            <mesh position={[0.12, 0, 0]}>
              <planeGeometry args={[0.02, len]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.3} depthWrite={false} />
            </mesh>
            <mesh position={[-0.12, 0, 0]}>
              <planeGeometry args={[0.02, len]} />
              <meshBasicMaterial color="#0284c7" transparent opacity={0.3} depthWrite={false} />
            </mesh>
          </group>
        );
      })}

      {/* 3. SAFETY HAZARD MARKINGS (YELLOW / BLACK WORK BAY BOUNDARY) */}
      <mesh position={[0, 0.005, 2.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.6, 0.14]} />
        <meshBasicMaterial color="#eab308" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.005, -2.0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[5.6, 0.14]} />
        <meshBasicMaterial color="#eab308" toneMapped={false} />
      </mesh>
      <mesh position={[-2.8, 0.005, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[4.14, 0.14]} />
        <meshBasicMaterial color="#eab308" toneMapped={false} />
      </mesh>
      <mesh position={[2.8, 0.005, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 2]}>
        <planeGeometry args={[4.14, 0.14]} />
        <meshBasicMaterial color="#eab308" toneMapped={false} />
      </mesh>

      {/* Corner Precision Alignment Brackets */}
      {[
        [-2.75, 1.95],
        [2.75, 1.95],
        [-2.75, -1.95],
        [2.75, -1.95],
      ].map(([cx, cz], i) => (
        <group key={`corner-${i}`} position={[cx, 0.006, cz]}>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <ringGeometry args={[0.16, 0.24, 24]} />
            <meshBasicMaterial color="#00e5ff" toneMapped={false} />
          </mesh>
          <mesh rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.06, 16]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
        </group>
      ))}

      {/* Digital Projection Floor Compass & Coordinate Markings */}
      <group position={[0, 0.003, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <mesh>
          <ringGeometry args={[3.4, 3.44, 64]} />
          <meshBasicMaterial
            color={isWarning ? "#f59e0b" : "#00e5ff"}
            transparent
            opacity={0.35}
            depthWrite={false}
          />
        </mesh>
        <mesh>
          <ringGeometry args={[4.2, 4.22, 64]} />
          <meshBasicMaterial color="#0284c7" transparent opacity={0.2} depthWrite={false} />
        </mesh>
      </group>

      {/* 4. STRUCTURAL STEEL FACTORY COLUMNS & CRANE GANTRY SYSTEM */}
      {[
        [-6.5, 0, -5.5],
        [0.0, 0, -6.5],
        [6.5, 0, -5.5],
        [-6.5, 0, 5.5],
        [0.0, 0, 6.5],
        [6.5, 0, 5.5],
      ].map(([px, , pz], i) => (
        <group key={`col-${i}`} position={[px, 0, pz]}>
          <mesh position={[0, 4.0, 0]} castShadow receiveShadow>
            <boxGeometry args={[0.5, 8.0, 0.5]} />
            <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.25} />
          </mesh>
          <mesh position={[0, 0.25, 0]} receiveShadow>
            <boxGeometry args={[0.9, 0.5, 0.9]} />
            <meshStandardMaterial color="#0f172a" metalness={0.7} roughness={0.4} />
          </mesh>
          <mesh position={[0, 1.2, 0]}>
            <boxGeometry args={[0.52, 0.6, 0.52]} />
            <meshStandardMaterial
              color="#eab308"
              emissive="#ca8a04"
              emissiveIntensity={0.25}
              roughness={0.35}
            />
          </mesh>
          <mesh position={[pz < 0 ? 0.35 : -0.35, 6.2, 0]} castShadow>
            <boxGeometry args={[0.45, 0.25, 0.5]} />
            <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
          </mesh>
          <mesh position={[0, 5.5, 0]}>
            <sphereGeometry args={[0.08, 16, 16]} />
            <meshBasicMaterial color="#0284c7" />
          </mesh>
        </group>
      ))}

      {/* Overhead Crane Rails */}
      <mesh position={[-6.5, 6.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>
      <mesh position={[6.5, 6.35, 0]} castShadow>
        <boxGeometry args={[0.3, 0.4, 16]} />
        <meshStandardMaterial color="#334155" metalness={0.9} roughness={0.2} />
      </mesh>

      {/* Overhead Transverse Bridge Crane Structure */}
      <group position={[0, 6.8, -1.5]}>
        <mesh castShadow>
          <boxGeometry args={[13.5, 0.45, 0.45]} />
          <meshStandardMaterial color="#1e293b" metalness={0.9} roughness={0.2} />
        </mesh>
        <mesh position={[1.8, -0.35, 0]} castShadow>
          <boxGeometry args={[0.8, 0.5, 0.7]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.8} roughness={0.3} />
        </mesh>
      </group>

      {/* 5. SUSPENDED LIGHTING RIGS & REALISTIC VOLUMETRIC LIGHT CONES */}
      {[-2.8, 0, 2.8].map((lx, idx) => (
        <group key={`light-rig-${idx}`} position={[lx, 7.2, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.3, 0.55, 0.35, 24]} />
            <meshStandardMaterial color="#0f172a" metalness={0.92} roughness={0.15} />
          </mesh>
          <mesh position={[0, -0.18, 0]}>
            <circleGeometry args={[0.48, 24]} />
            <meshBasicMaterial color="#ffffff" toneMapped={false} />
          </mesh>
          <mesh position={[0, -3.6, 0]}>
            <coneGeometry args={[2.2, 7.2, 32, 1, true]} />
            <meshBasicMaterial
              color="#38bdf8"
              transparent
              opacity={isHolo ? 0.07 : 0.032}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>
      ))}

      {/* 6. OVERHEAD UTILITY DISTRIBUTION */}
      <group position={[0, 6.0, -4.8]}>
        <mesh castShadow>
          <boxGeometry args={[15, 0.12, 0.6]} />
          <meshStandardMaterial color="#1e293b" metalness={0.85} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.22, 0.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.07, 0.07, 15, 16]} />
          <meshStandardMaterial color="#ca8a04" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 0.22, -0.15]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.06, 0.06, 15, 16]} />
          <meshStandardMaterial color="#0284c7" metalness={0.7} roughness={0.3} />
        </mesh>
      </group>

      {/* 7. DISTANT FACTORY HALL SILHOUETTES & HIGH-BAY OUTLINE */}
      <group position={[-8.5, 0.8, -6.5]}>
        <mesh receiveShadow>
          <boxGeometry args={[3.6, 1.6, 2.0]} />
          <meshStandardMaterial color="#0b1329" metalness={0.8} roughness={0.5} />
        </mesh>
        <mesh position={[1.4, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.15, 12]} />
          <meshBasicMaterial color="#10b981" toneMapped={false} />
        </mesh>
      </group>

      <group position={[8.5, 0.8, -6.5]}>
        <mesh receiveShadow>
          <boxGeometry args={[3.6, 1.6, 2.0]} />
          <meshStandardMaterial color="#0b1329" metalness={0.8} roughness={0.5} />
        </mesh>
        <mesh position={[-1.4, 1.2, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.15, 12]} />
          <meshBasicMaterial color="#f59e0b" toneMapped={false} />
        </mesh>
      </group>

      <group position={[0, 3.5, -12.5]}>
        <mesh>
          <boxGeometry args={[26, 7.0, 0.4]} />
          <meshStandardMaterial color="#070c18" metalness={0.9} roughness={0.7} />
        </mesh>
      </group>
    </group>
  );
};
