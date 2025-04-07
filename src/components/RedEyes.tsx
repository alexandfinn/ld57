import { useRef, useEffect, useState } from "react";
import { useFrame } from "@react-three/fiber";
import { Vector3, PointLight, Group } from "three";
import { useRapier } from "@react-three/rapier";

interface RedEyesProps {
  playerPositionRef: React.RefObject<Vector3>;
  playerRotationRef: React.RefObject<number>;
}

export const RedEyes = ({ playerPositionRef, playerRotationRef }: RedEyesProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const groupRef = useRef<Group>(null);
  const lightRef1 = useRef<PointLight>(null);
  const lightRef2 = useRef<PointLight>(null);

  useEffect(() => {
    // Function to update position
    const updatePosition = () => {
      if (!isVisible && groupRef.current && playerPositionRef.current && playerRotationRef.current) {
        const playerPosition = playerPositionRef.current;
        const playerRotation = playerRotationRef.current;
        
        const distance = 18;
        const x = playerPosition.x - Math.sin(playerRotation) * distance;
        const z = playerPosition.z - Math.cos(playerRotation) * distance;
        groupRef.current.position.set(x, 3, z);
        groupRef.current.rotation.y = playerRotation;
      }
    };

    // Update position every frame
    const intervalId = setInterval(updatePosition, 16); // ~60fps

    // Blinking effect
    const blinkInterval = setInterval(() => {
      setIsVisible(true);
      setTimeout(() => {
        setIsVisible(false);
      }, 500);
    }, 60000);

    return () => {
      clearInterval(intervalId);
      clearInterval(blinkInterval);
    };
  }, [playerPositionRef, playerRotationRef, isVisible]);

  // Handle flickering effect
  useFrame(() => {
    if (!lightRef1.current || !lightRef2.current) return;

    const flicker = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;
    lightRef1.current.intensity = isVisible ? 2 * flicker : 0;
    lightRef2.current.intensity = isVisible ? 2 * flicker : 0;
  });

  return (
    <group ref={groupRef} visible={isVisible}>
      {/* First eye */}
      <mesh position={[-0.15, 0, 0]} scale={[0.2, 0.2, 0.2]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <pointLight
        ref={lightRef1}
        position={[-0.15, 0, 0]}
        color="#ff0000"
        intensity={1}
        distance={3}
        decay={2}
      />

      {/* Second eye */}
      <mesh position={[0.15, 0, 0]} scale={[0.2, 0.2, 0.2]}>
        <sphereGeometry args={[0.1, 4, 4]} />
        <meshBasicMaterial color="#ff0000" />
      </mesh>
      <pointLight
        ref={lightRef2}
        position={[0.15, 0, 0]}
        color="#ff0000"
        intensity={1}
        distance={3}
        decay={2}
      />
    </group>
  );
};
