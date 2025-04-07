import { useRef } from "react";
import { Plane, useTexture } from "@react-three/drei";
import { Mesh, RepeatWrapping, DoubleSide } from "three";
import { RigidBody } from "@react-three/rapier";

export const Floor = () => {
  const floorRef = useRef<Mesh>(null);

  // Load floor texture

  // Scale factor to match the scaled models
  const SCALE_FACTOR = 4;

  // Base dimensions
  const baseWidth = 25;
  const baseLength = 25;

  // Scaled dimensions
  const width = baseWidth * SCALE_FACTOR;
  const length = baseLength * SCALE_FACTOR;

  // Configure texture repeating

  return (
    <RigidBody type="fixed" colliders="cuboid">
      {/* Visible floor with texture */}
      <Plane
        ref={floorRef}
        args={[width, length]}
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0, 0]}
        receiveShadow
        visible={false}
      />

      {/* Invisible collider for the entire level */}
      <mesh
        position={[0, -0.1, 0]} // Slightly below the visible floor
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <planeGeometry args={[width * 2, length * 2]} />
        <meshStandardMaterial visible={false} />
      </mesh>
    </RigidBody>
  );
};
