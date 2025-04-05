import { useGLTF, useTexture } from "@react-three/drei";
import { useEffect, useRef } from "react";
import { DoubleSide, Mesh, MeshStandardMaterial, RepeatWrapping } from "three";
import { RigidBody } from "@react-three/rapier";

type ArchwayProps = {
  position: [number, number, number];
  rotation?: [number, number, number];
};

export const Archway = ({ position, rotation = [0, 0, 0] }: ArchwayProps) => {
  const { scene } = useGLTF("/models/archway.glb");
  const archwayRef = useRef<Mesh>(null);
  
  // Use the same wall texture as walls
  const wallTexture = useTexture("/textures/wall.png");

  // Configure texture repeating
  wallTexture.wrapS = wallTexture.wrapT = RepeatWrapping;
  wallTexture.repeat.set(2, 2);

  // Apply the wall material to all archway meshes
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshStandardMaterial({
          map: wallTexture,
          roughness: 1,
          metalness: 0,
          side: DoubleSide,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene, wallTexture]);

  return (
    <RigidBody type="fixed" colliders="trimesh">
      <primitive 
        ref={archwayRef}
        object={scene.clone()} 
        position={position}
        rotation={rotation}
      />
    </RigidBody>
  );
};

// Preload the model
useGLTF.preload("/models/archway.glb"); 