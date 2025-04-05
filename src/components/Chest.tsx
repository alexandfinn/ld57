import { useGLTF } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";
import { useRef } from "react";
import { Group } from "three";
import dungeonLayout from "./World/dungeon-layout.json";

export const Chest = () => {
  const { scene } = useGLTF("/models/chest.glb");
  
  return (
    <>
      {dungeonLayout.objects
        .filter(obj => obj.type === "chest")
        .map((chest, index) => {
          // Clone the scene for each chest
          const chestModel = scene.clone();
          const chestRef = useRef<Group>(null);
          
          return (
            <RigidBody 
              key={index} 
              type="fixed" 
              position={[
                chest.position[0], 
                chest.position[1] + 0.7, // Add slight elevation to prevent floor clipping
                chest.position[2]
              ]}
              rotation={[0, chest.rotation, 0]}
            >
              <primitive 
                ref={chestRef} 
                object={chestModel} 
                scale={[1, 1, 1]}
              />
            </RigidBody>
          );
        })}
    </>
  );
};

// Pre-load the model
useGLTF.preload("/models/chest.glb");
