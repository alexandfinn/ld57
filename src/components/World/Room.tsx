import { Plane, useTexture } from "@react-three/drei";
import { DoubleSide, RepeatWrapping } from "three";
import { RigidBody } from "@react-three/rapier";
import dungeonLayout from "./dungeon-layout.json";
import { Floor } from "./Floor";

export const Room = () => {
  const wallTexture = useTexture("/textures/wall.png");

  // Configure texture repeating
  wallTexture.wrapS = wallTexture.wrapT = RepeatWrapping;
  wallTexture.repeat.set(2, 2);

  return (
    <group>
      <Floor />
      {dungeonLayout.walls.map((wall, index: number) => {
        // Calculate the wall thickness (use 0.1 instead of 0.01 for better physics)
        const wallThickness = 0.1;
        
        return (
          <RigidBody key={index} type="fixed">
            <Plane
              args={[wall.size[0], wall.size[1]]}
              position={wall.position as [number, number, number]}
              rotation={wall.rotation as [number, number, number]}
              receiveShadow
            >
              <meshStandardMaterial
                map={wallTexture}
                roughness={1}
                metalness={0}
                side={DoubleSide}
              />
            </Plane>
            {/* Add an invisible collider with thickness */}
            <mesh
              position={wall.position as [number, number, number]}
              rotation={wall.rotation as [number, number, number]}
            >
              <boxGeometry args={[wall.size[0], wall.size[1], wallThickness]} />
              <meshStandardMaterial visible={false} />
            </mesh>
          </RigidBody>
        );
      })}
    </group>
  );
};
