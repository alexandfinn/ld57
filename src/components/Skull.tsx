import { useGLTF } from "@react-three/drei";
import { useRef, useEffect } from "react";
import { Group, Mesh, MeshStandardMaterial } from "three";
import dungeonLayout from "./World/dungeon-layout.json";

export const Skull = () => {
  const { scene } = useGLTF("/models/skull.glb");
  
  // Apply less shiny material to all skull meshes
  useEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.material = new MeshStandardMaterial({
          map: child.material.map,
          roughness: 1, // Higher roughness = less shiny
          metalness: 0.00, // Lower metalness = less shiny
          color: child.material.color,
        });
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
  }, [scene]);
  
  return (
    <>
      {dungeonLayout.objects
        .filter(obj => obj.type === "skull")
        .map((skull, index) => {
          // Clone the scene for each skull
          const skullModel = scene.clone();
          const skullRef = useRef<Group>(null);
          
          return (
            <group 
              key={index} 
              position={[
                skull.position[0], 
                skull.position[1] + 0.5, // Add slight elevation to prevent floor clipping
                skull.position[2]
              ]}
              rotation={[0, skull.rotation, 0]}
            >
              <primitive 
                ref={skullRef} 
                object={skullModel} 
                scale={[0.6, 0.6, 0.6]}
              />
            </group>
          );
        })}
    </>
  );
};

// Pre-load the model
useGLTF.preload("/models/skull.glb"); 