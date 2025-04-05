import { useRef } from "react";
import { Plane, useTexture } from "@react-three/drei";
import { Mesh, RepeatWrapping, DoubleSide } from "three";

export const Floor = () => {
  const floorRef = useRef<Mesh>(null);

  // Load floor texture
  const floorTexture = useTexture("/textures/floor.png");

  const width = 100;
  const length = 100;

  // Configure texture repeating
  floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
  floorTexture.repeat.set(width / 2, length / 2);

  return (
    <Plane
      ref={floorRef}
      args={[width, length]}
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0, 0]}
      receiveShadow
    >
      <meshStandardMaterial
        map={floorTexture}
        roughness={1}
        metalness={0}
        side={DoubleSide}
      />
    </Plane>
  );
};
