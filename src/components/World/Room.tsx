import { Plane, useTexture } from "@react-three/drei";
import { DoubleSide, RepeatWrapping } from "three";
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
        return (
          <Plane
            key={index}
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
        );
      })}
    </group>
  );
};
