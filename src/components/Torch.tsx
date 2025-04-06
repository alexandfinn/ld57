import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef } from "react";
import * as THREE from "three";
import { TorchFlame } from "./TorchFlame";

interface TorchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

const scale: [number, number, number] = [0.2, 0.2, 0.2];

export const Torch = forwardRef<THREE.Group, TorchProps>(
  ({ position, rotation = [0, 0, 0] }, ref) => {
    const { scene } = useGLTF("/models/handtorch.glb");
    const pointLightRef = useRef<THREE.PointLight>(null);
    const timeRef = useRef(0);

    // Update flicker effect every frame with more natural fire-like pattern
    useFrame((state, delta) => {
      timeRef.current += delta;

      if (pointLightRef.current) {
        // Create fire-like flicker pattern with multiple frequencies
        const noise =
          Math.sin(timeRef.current) * 0.15 + // Base flicker
          Math.sin(timeRef.current * 0.34) * 0.08 + // Medium frequency
          Math.sin(timeRef.current * 0.64) * 0.04 + // Higher frequency
          Math.sin(timeRef.current * 0.1) * 0.12; // Slow, gentle movement

        // Add slight randomness for more natural fire behavior
        const randomFactor = 0.02 * (Math.random() - 0.5);
        const finalIntensity = 2 * (1 + noise + randomFactor);

        pointLightRef.current.intensity = finalIntensity;

        // Also move light slightly for more dynamic lighting
        pointLightRef.current.position.x =
          Math.sin(timeRef.current * Math.PI) * 0.04;
        pointLightRef.current.position.z =
          Math.cos(timeRef.current * Math.PI * 0.75) * 0.04;
      }
    });

    return (
      <group ref={ref} position={position} rotation={rotation} scale={scale}>
        {/* Render the torch model */}
        <primitive object={scene} />

        {/* Add TorchFlame component */}
        <TorchFlame position={[0, 1.4, 0]} scale={[0.3, 0.8, 0.3]} />

        <TorchFlame position={[0, 1.4, 0]} scale={[0.3, 1, 0.3]} />

        {/* Add flickering point light for ambient illumination */}
        <pointLight
          ref={pointLightRef}
          position={[0, 1.7, 0]}
          intensity={300}
          color="#ffa64d"
          distance={20}
          decay={0.4}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-radius={8}
          shadow-bias={-0.0001}
        />
      </group>
    );
  }
);
