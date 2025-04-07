import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef } from "react";
import * as THREE from "three";
import { TorchFlame } from "./TorchFlame";

interface TorchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

const scale: [number, number, number] = [0.5, 0.5, 0.5];

const baseIntensity = 70;
const baseDistance = 600;
const baseDecay = 1.7;

export const Torch = forwardRef<THREE.Group, TorchProps>(
  ({ position, rotation = [0, 0, 0] }, ref) => {
    const { scene } = useGLTF("/models/Small/Torch.glb");
    const pointLightRef = useRef<THREE.PointLight>(null);
    const timeRef = useRef(0);

    // Update flicker effect every frame with more natural fire-like pattern
    useFrame((state, delta) => {
      timeRef.current += delta * 0.01; // Significantly slowed down time progression

      if (pointLightRef.current) {
        // Create fire-like flicker pattern for decay with much slower frequencies
        const noise =
          Math.sin(timeRef.current * 0.05) * 0.08 + // Much slower medium frequency
          Math.sin(timeRef.current * 0.1) * 0.04; // Much slower higher frequency

        // Add slight randomness for more natural fire behavior
        const randomFactor = 0.07 * (Math.random() - 0.5); // Reduced random factor

        // Apply flicker to both decay and intensity for more dynamic effect
        const flickerFactor = 1 + noise + randomFactor;
        pointLightRef.current.decay = baseDecay * flickerFactor;
        pointLightRef.current.intensity = baseIntensity * flickerFactor;
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
          intensity={baseIntensity}
          color="#ffa64d"
          distance={baseDistance}
          decay={baseDecay}
          castShadow
          shadow-mapSize-width={512}
          shadow-radius={8}
          shadow-bias={-0.0004}
        />
      </group>
    );
  }
);
