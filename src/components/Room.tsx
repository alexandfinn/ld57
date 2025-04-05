import { useRef } from "react";
import { Box, useTexture } from "@react-three/drei";
import { Mesh, RepeatWrapping } from "three";

interface RoomProps {
  width?: number;
  length?: number;
  height?: number;
}

export const Room = ({ width = 10, length = 10, height = 4 }: RoomProps) => {
  // Create refs for each wall to potentially handle interactions later
  const floorRef = useRef<Mesh>(null);
  const ceilingRef = useRef<Mesh>(null);
  const wallFrontRef = useRef<Mesh>(null);
  const wallBackRef = useRef<Mesh>(null);
  const wallLeftRef = useRef<Mesh>(null);
  const wallRightRef = useRef<Mesh>(null);

  // Load textures
  const textures = useTexture({
    wallTexture: "/textures/wall.png",
    floorTexture: "/textures/floor.png",
  });

  // Configure texture repeating
  textures.wallTexture.wrapS = textures.wallTexture.wrapT = RepeatWrapping;
  textures.wallTexture.repeat.set(width / 4, 1);
  
  textures.floorTexture.wrapS = textures.floorTexture.wrapT = RepeatWrapping;
  textures.floorTexture.repeat.set(width / 4, length / 4);

  // Wall thickness
  const wallThickness = 0.2;

  return (
    <group>
      {/* Floor */}
      <Box
        ref={floorRef}
        args={[width, wallThickness, length]}
        position={[0, -wallThickness / 2, 0]}
      >
        <meshStandardMaterial
          map={textures.floorTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </Box>

      {/* Ceiling */}
      <Box
        ref={ceilingRef}
        args={[width, wallThickness, length]}
        position={[0, height + wallThickness / 2, 0]}
      >
        <meshStandardMaterial
          map={textures.floorTexture}
          roughness={0.7}
          metalness={0.1}
        />
      </Box>

      {/* Front Wall */}
      <Box
        ref={wallFrontRef}
        args={[width, height, wallThickness]}
        position={[0, height / 2, -length / 2]}
      >
        <meshStandardMaterial
          map={textures.wallTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>

      {/* Back Wall */}
      <Box
        ref={wallBackRef}
        args={[width, height, wallThickness]}
        position={[0, height / 2, length / 2]}
      >
        <meshStandardMaterial
          map={textures.wallTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>

      {/* Left Wall */}
      <Box
        ref={wallLeftRef}
        args={[wallThickness, height, length]}
        position={[-width / 2, height / 2, 0]}
      >
        <meshStandardMaterial
          map={textures.wallTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>

      {/* Right Wall */}
      <Box
        ref={wallRightRef}
        args={[wallThickness, height, length]}
        position={[width / 2, height / 2, 0]}
      >
        <meshStandardMaterial
          map={textures.wallTexture}
          roughness={0.8}
          metalness={0.1}
        />
      </Box>
    </group>
  );
};
