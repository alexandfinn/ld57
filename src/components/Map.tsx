import { useRef } from "react";
import { Mesh } from "three";
import { useTexture } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

interface MapProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
}

export const Map = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = [1, 1, 1]
}: MapProps) => {
  const mapRef = useRef<Mesh>(null);
  
  // Load map texture
  const mapTexture = useTexture("/textures/map.png");

  return (
    <RigidBody type="fixed">
      <mesh ref={mapRef} position={position} rotation={rotation} scale={scale}>
        <planeGeometry args={[0.4, 0.3]} />
        <meshStandardMaterial
          map={mapTexture}
          roughness={0.8}
          metalness={0.2}
          side={2} // DoubleSide
          transparent={true}
          opacity={0.9}
          emissive="#333333"
          emissiveIntensity={0.2}
        />
      </mesh>
    </RigidBody>
  );
};