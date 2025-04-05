import { useEffect, useRef, forwardRef } from "react";
import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { useTorchState } from "../store/useTorchState";
import * as THREE from "three";

interface TorchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const Torch = forwardRef<THREE.Group, TorchProps>(({
  position,
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
}, ref) => {
  const { scene } = useGLTF("/models/wall_torch.glb");
  const pointLightRef = useRef<THREE.PointLight>(null);
  const { flickerIntensity, updateFlicker } = useTorchState();
  const timeRef = useRef(0);

  // Update flicker effect every frame with more natural fire-like pattern
  useFrame((state, delta) => {
    if (pointLightRef.current) {
      timeRef.current += delta * 0.01; // 5x slower time progression for more natural fire movement
      updateFlicker();

      // Create fire-like flicker pattern with multiple frequencies
      const noise =
        Math.sin(timeRef.current) * 0.15 + // Base flicker
        Math.sin(timeRef.current * 0.34) * 0.08 + // Medium frequency (1.7/5)
        Math.sin(timeRef.current * 0.64) * 0.04 + // Higher frequency (3.2/5)
        Math.sin(timeRef.current * 0.1) * 0.12; // Slow, gentle movement (0.5/5)

      // Add slight randomness for more natural fire behavior
      const randomFactor = 0.02 * (Math.random() - 0.5);
      const finalIntensity = flickerIntensity * (1 + noise + randomFactor);
      
      pointLightRef.current.intensity = finalIntensity;
    }
  });

  return (
    <group ref={ref} position={position} rotation={rotation} scale={scale}>
      {/* Render the torch model */}
      <primitive object={scene} />
      {/* Add flickering point light for ambient illumination */}
      <pointLight
        ref={pointLightRef}
        position={[0, 2.7, 0]}
        intensity={10}
        color="#ffa64d"
        distance={20}
        decay={0.3}
        castShadow
        shadow-mapSize-width={512}
        shadow-mapSize-height={512}
        shadow-radius={8}
        shadow-bias={-0.0001}
      />
    </group>
  );
});
