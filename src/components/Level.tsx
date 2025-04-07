import { useGLTF } from "@react-three/drei";
import { useRef } from "react";
import { Group, Mesh } from "three";
import { RigidBody } from "@react-three/rapier";
import levelData from "../level.json";
import { Floor } from "./Floor";

export const Level = () => {
  // Create a map to store loaded models
  const modelCache = new Map<string, any>();

  // Function to load and cache a model
  const getModel = (modelPath: string) => {
    if (!modelCache.has(modelPath)) {
      const { scene } = useGLTF(modelPath);
      modelCache.set(modelPath, scene);
    }
    return modelCache.get(modelPath);
  };

  // Scale factor for all models
  const SCALE_FACTOR = 4;


  return (
    <group>
      <Floor />

 

      {levelData.objects.map((object) => {
        const modelRef = useRef<Group>(null);
        const model = getModel(object.modelPath);

        // Apply the scale factor to the object's scale
        const scaledScale = [
          (object.scale[0] as number) * SCALE_FACTOR,
          (object.scale[1] as number) * SCALE_FACTOR,
          (object.scale[2] as number) * SCALE_FACTOR,
        ] as [number, number, number];

        // Scale the position as well to maintain relative positioning
        const scaledPosition = [
          (object.position[0] as number) * SCALE_FACTOR,
          (object.position[1] as number) * SCALE_FACTOR,
          (object.position[2] as number) * SCALE_FACTOR,
        ] as [number, number, number];

        // Apply shadows to all meshes in the model
        model.traverse((child: any) => {
          if (child instanceof Mesh) {
            child.castShadow = true;
            child.receiveShadow = true;
          }
        });

        return (
          <RigidBody key={object.id} type="fixed" colliders="trimesh">
            <primitive
              ref={modelRef}
              object={model.clone()}
              position={scaledPosition}
              rotation={object.rotation}
              scale={scaledScale}
            />
          </RigidBody>
        );
      })}
    </group>
  );
};

// Preload all models
levelData.objects.forEach((object) => {
  useGLTF.preload(object.modelPath);
});
