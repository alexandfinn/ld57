import { useRef } from "react";
import { Plane, useTexture } from "@react-three/drei";
import { Mesh, RepeatWrapping, DoubleSide } from "three";
import { RigidBody } from "@react-three/rapier";

export const Floor = () => {
  const floorRef = useRef<Mesh>(null);

  // Load floor texture
  const floorTexture = useTexture("/textures/floor.png");

  const width = 1000;
  const length = 1000;

  // Configure texture repeating
  floorTexture.wrapS = floorTexture.wrapT = RepeatWrapping;
  floorTexture.repeat.set(width / 2, length / 2);

  return (
    <RigidBody type="fixed" colliders="cuboid">
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
    </RigidBody>
  );
};
