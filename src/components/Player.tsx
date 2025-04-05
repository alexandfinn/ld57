import { useRef, useEffect } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Euler, Group } from "three";
import { PointerLockControls } from "@react-three/drei";
import { Torch } from "./Torch";
import {
  RigidBody,
  CapsuleCollider,
  useRapier,
  RapierRigidBody,
} from "@react-three/rapier";
import { PointerLockControls as PointerLockControlsImpl } from "three-stdlib";

const SPEED = 5;
const direction = new Vector3();
const frontVector = new Vector3();
const sideVector = new Vector3();
const tempVec = new Vector3();

export const Player = () => {
  const { camera } = useThree();
  const controlsRef = useRef<PointerLockControlsImpl>(null);
  const playerRef = useRef<RapierRigidBody>(null);
  const torchRef = useRef<Group>(null);
  const rapier = useRapier();

  // Track which keys are currently pressed
  const keysPressed = useRef<Set<string>>(new Set());

  // Player rotation state
  const playerRotation = useRef(0);

  // Refs for torch movement with threshold and lerping
  const lastRotation = useRef(0);
  const torchRotation = useRef(0);
  const targetTorchRotation = useRef(0);
  const isLerping = useRef(false);
  const lastSignificantTurnTime = useRef(0);

  // Thresholds and timing constants
  const LEFT_THRESHOLD = 3.0;
  const RIGHT_THRESHOLD = 0.0;
  const LERP_SPEED = 0.03;
  const FOLLOW_DELAY = 0.7;

  // Breathing animation parameters
  const breathingAmplitude = 0.04;
  const breathingSpeed = 1.5;
  const breathingOffset = useRef(0);

  // Handle mouse movement for camera rotation
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleMouseMove = () => {
      const euler = new Euler(0, 0, 0, "YXZ");
      euler.setFromQuaternion(camera.quaternion);
      playerRotation.current = euler.y;
    };

    const controls = controlsRef.current;
    controls.addEventListener("change", handleMouseMove);
    return () => {
      controls.removeEventListener("change", handleMouseMove);
    };
  }, [camera]);

  // Update player position and handle movement
  useFrame((state, delta) => {
    if (!controlsRef.current || !playerRef.current) return;

    const forward = Number(keysPressed.current.has("w"));
    const backward = Number(keysPressed.current.has("s"));
    const left = Number(keysPressed.current.has("a"));
    const right = Number(keysPressed.current.has("d"));
    const jump = keysPressed.current.has(" ");

    // Get current velocity
    const velocity = playerRef.current.linvel();

    // Update camera position to match player position
    const playerPosition = playerRef.current.translation();
    camera.position.set(
      playerPosition.x,
      playerPosition.y + 1.5,
      playerPosition.z
    );

    // Movement
    frontVector.set(0, 0, backward - forward);
    sideVector.set(left - right, 0, 0);
    direction
      .subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(state.camera.rotation);

    // Apply movement
    playerRef.current.setLinvel(
      {
        x: direction.x,
        y: velocity.y,
        z: direction.z,
      },
      true
    );

    // Handle jumping
    const grounded = playerRef.current.translation().y <= 0.1;
    if (jump && grounded) {
      playerRef.current.setLinvel(
        { x: velocity.x, y: 7.5, z: velocity.z },
        true
      );
    }

    // Calculate rotation difference for torch
    const rotationDiff = playerRotation.current - lastRotation.current;

    // Normalize rotation difference to be between -PI and PI
    let normalizedDiff = rotationDiff;
    if (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI;
    if (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI;

    // Check if rotation change exceeds threshold based on direction
    const timeSinceLastTurn =
      state.clock.elapsedTime - lastSignificantTurnTime.current;
    const shouldFollowRegardless = timeSinceLastTurn > FOLLOW_DELAY;

    if (
      shouldFollowRegardless ||
      (normalizedDiff > 0 && Math.abs(normalizedDiff) > RIGHT_THRESHOLD) ||
      (normalizedDiff < 0 && Math.abs(normalizedDiff) > LEFT_THRESHOLD)
    ) {
      targetTorchRotation.current = playerRotation.current;
      isLerping.current = true;
      lastRotation.current = playerRotation.current;
      lastSignificantTurnTime.current = state.clock.elapsedTime;
    }

    // Lerp torch rotation
    if (isLerping.current) {
      let angleDiff = targetTorchRotation.current - torchRotation.current;
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI;
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI;
      torchRotation.current += angleDiff * LERP_SPEED;
      if (Math.abs(angleDiff) < 0.01) {
        isLerping.current = false;
        torchRotation.current = targetTorchRotation.current;
      }
    }

    // Update breathing animation
    breathingOffset.current =
      Math.sin(state.clock.elapsedTime * breathingSpeed) * breathingAmplitude;

    // Calculate torch position based on current player position and rotation
    const baseOffset = new Vector3(-0.25, -0.25, -0.5);
    const rotatedOffset = baseOffset
      .clone()
      .applyAxisAngle(new Vector3(0, 1, 0), torchRotation.current);
    const torchPosition = new Vector3().copy(playerPosition).add(rotatedOffset);
    torchPosition.y += breathingOffset.current + 1.5; // Add player height offset

    // Update torch position in the scene
    if (torchRef.current) {
      torchRef.current.position.copy(torchPosition);
      torchRef.current.rotation.y = torchRotation.current;
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, []);

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      <RigidBody
        ref={playerRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={[0, 2, 0]}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.75, 0.5]} />
      </RigidBody>

      <Torch
        ref={torchRef}
        position={[0, 0, 0]} // Initial position will be updated in useFrame
        rotation={[0, 0, 0]} // Initial rotation will be updated in useFrame
        scale={[0.5, 0.5, 0.5]}
      />
    </>
  );
};
