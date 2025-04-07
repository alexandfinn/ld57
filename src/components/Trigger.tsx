import { useRef, useState } from "react";
import { Box } from "@react-three/drei";
import { Vector3, Mesh } from "three";
import { RigidBody } from "@react-three/rapier";

interface TriggerProps {
  id: string;
  position: [number, number, number];
  scale: [number, number, number];
  name: string;
  onTrigger: (name: string) => void;
}

export const Trigger = ({
  id,
  position,
  scale,
  name,
  onTrigger,
}: TriggerProps) => {
  const [hasTriggered, setHasTriggered] = useState(false);
  const triggerRef = useRef<Mesh>(null);

  return (
    <group>
      <RigidBody
        type="fixed"
        colliders="cuboid"
        sensor
        onIntersectionEnter={() => {
          console.log("Trigger entered");
          if (!hasTriggered) {
            setHasTriggered(true);
            onTrigger(name);
          }
        }}
      >
        <Box ref={triggerRef} position={position} scale={scale}>
          <meshStandardMaterial transparent opacity={0} />
        </Box>
      </RigidBody>
    </group>
  );
};
