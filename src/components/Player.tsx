import { useRef, useEffect, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3, Euler, Group } from "three";
import { PointerLockControls } from "@react-three/drei";
import { Torch } from "./Torch";
import { Map } from "./Map";
import { FootstepSounds } from "./FootstepSounds";
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

const initialPlayerPosition = new Vector3(2, 0.8, 2);

interface PlayerProps {
  hasStarted: boolean;
}

export const Player = ({ hasStarted }: PlayerProps) => {
  const { camera } = useThree();
  const controlsRef = useRef<PointerLockControlsImpl>(null);
  const playerRef = useRef<RapierRigidBody>(null);
  const torchRef = useRef<Group>(null);
  const mapRef = useRef<Group>(null);
  const rapier = useRapier();
  const [hasInteracted, setHasInteracted] = useState(false);
  const [isMoving, setIsMoving] = useState(false);
  const [isGrounded, setIsGrounded] = useState(false);

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

  // Map state
  const [isMapInHand, setIsMapInHand] = useState(true);

  // Lerping for map and torch transitions
  const mapPositionRef = useRef(new Vector3());
  const mapRotationRef = useRef(new Euler());
  const torchPositionRef = useRef(new Vector3());
  const torchRotationRef = useRef(new Euler());
  const lerpFactor = useRef(0);
  const isTransitioning = useRef(false);
  const transitionDuration = 0.5; // seconds

  // Handle mouse movement for camera rotation
  useEffect(() => {
    if (!controlsRef.current) return;

    const handleMouseMove = () => {
      // Only update player rotation if map is not up
      if (isMapInHand) {
        const euler = new Euler(0, 0, 0, "YXZ");
        euler.setFromQuaternion(camera.quaternion);
        playerRotation.current = euler.y;
      }
    };

    const controls = controlsRef.current;
    controls.addEventListener("change", handleMouseMove);
    return () => {
      controls.removeEventListener("change", handleMouseMove);
    };
  }, [camera, isMapInHand]);

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

    // Check if player is grounded
    const playerIsGrounded = playerPosition.y <= 0.1;
    setIsGrounded(playerIsGrounded);

    // Block movement and camera rotation when map is up
    if (!isMapInHand) {
      // Show cursor when map is up
      document.body.style.cursor = "crosshair";

      // Disable pointer lock controls when map is up
      if (controlsRef.current.isLocked) {
        controlsRef.current.unlock();
      }

      // Only allow vertical movement (falling), no horizontal movement
      playerRef.current.setLinvel(
        {
          x: 0,
          y: velocity.y,
          z: 0,
        },
        true
      );
      
      // Not moving when map is up
      setIsMoving(false);
    } else {
      // Hide cursor when map is down
      document.body.style.cursor = "none";

      // Enable pointer lock controls when map is down and game has started
      if (!controlsRef.current.isLocked && hasStarted && hasInteracted) {
        controlsRef.current.lock();
      }

      // Normal movement
      frontVector.set(0, 0, backward - forward);
      sideVector.set(left - right, 0, 0);
      direction
        .subVectors(frontVector, sideVector)
        .normalize()
        .multiplyScalar(SPEED)
        .applyEuler(state.camera.rotation);

      // Check if player is moving
      const isCurrentlyMoving = forward > 0 || backward > 0 || left > 0 || right > 0;
      setIsMoving(isCurrentlyMoving);

      // Apply movement
      playerRef.current.setLinvel(
        {
          x: direction.x,
          y: velocity.y,
          z: direction.z,
        },
        true
      );
    }

    // Handle jumping
    if (jump && playerIsGrounded && isMapInHand) {
      // Only allow jumping when map is not up
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
    const torchPos = new Vector3().copy(playerPosition).add(rotatedOffset);
    torchPos.y += breathingOffset.current + 1.5;

    // Update torch position in the scene
    if (torchRef.current) {
      if (isMapInHand) {
        // Normal position in left hand
        torchRef.current.position.copy(torchPos);
        torchRef.current.rotation.y = torchRotation.current;
      } else {
        // Move torch away to the left when map is being viewed
        const awayOffset = new Vector3(-0.5, -0.25, -0.5);
        const rotatedAwayOffset = awayOffset
          .clone()
          .applyAxisAngle(new Vector3(0, 1, 0), torchRotation.current);
        const awayPosition = new Vector3()
          .copy(playerPosition)
          .add(rotatedAwayOffset);
        awayPosition.y += breathingOffset.current + 1.5;

        // Lerp to the away position
        torchRef.current.position.lerp(awayPosition, 0.1);
        torchRef.current.rotation.y = torchRotation.current;
      }
    }

    // Update map position with lerping
    if (mapRef.current) {
      if (isMapInHand) {
        // Position in right hand (opposite side from torch)
        const mapOffset = new Vector3(0.25, -0.25, -0.5);
        const rotatedMapOffset = mapOffset
          .clone()
          .applyAxisAngle(new Vector3(0, 1, 0), torchRotation.current);
        const handPosition = new Vector3()
          .copy(playerPosition)
          .add(rotatedMapOffset);
        handPosition.y += breathingOffset.current + 1.5; // Add player height offset

        // Directly set position instead of lerping
        mapRef.current.position.copy(handPosition);
        mapRef.current.rotation.y = torchRotation.current - 0.5;
        mapRef.current.rotation.x = 0.2; // Tilt towards the player for better visibility
        mapRef.current.rotation.z = -0.2; // Slight tilt to make it more visible
      } else {
        // Position closer to face for better viewing
        const mapPos = new Vector3().copy(playerPosition);
        mapPos.y += 1.5; // Add player height offset

        // Position closer to the player's view
        const forward = new Vector3(0, 0, -0.3); // Closer to face
        forward.applyQuaternion(camera.quaternion);
        mapPos.add(forward);

        // Directly set position instead of lerping
        mapRef.current.position.copy(mapPos);
        mapRef.current.rotation.y = playerRotation.current;
        mapRef.current.rotation.x = 0; // Flat when viewing
        mapRef.current.rotation.z = 0; // No tilt when viewing
      }
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      keysPressed.current.add(e.key.toLowerCase());

      // Toggle map position when 'm' is pressed
      if (e.key.toLowerCase() === "m") {
        setIsMapInHand(!isMapInHand);

        // Toggle pointer lock and cursor visibility when map state changes
        if (isMapInHand) {
          // Map is going up, unlock controls and show cursor
          if (controlsRef.current) {
            controlsRef.current.unlock();
          }
          document.body.style.cursor = "crosshair";
        } else {
          // Map is going down, lock controls and hide cursor
          if (controlsRef.current && hasStarted && hasInteracted) {
            controlsRef.current.lock();
          }
          document.body.style.cursor = "none";
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase());
    };

    // Add click handler to detect user interaction
    const handleClick = () => {
      setHasInteracted(true);
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    window.addEventListener("click", handleClick);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("click", handleClick);
    };
  }, [isMapInHand, hasInteracted, hasStarted]);

  // Add a click handler to prevent default browser behavior when clicking on the map
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (!isMapInHand) {
        e.preventDefault();
      }
    };

    window.addEventListener("click", handleClick, { capture: true });
    return () => {
      window.removeEventListener("click", handleClick, { capture: true });
    };
  }, [isMapInHand]);

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      <RigidBody
        ref={playerRef}
        colliders={false}
        mass={1}
        type="dynamic"
        position={initialPlayerPosition}
        enabledRotations={[false, false, false]}
      >
        <CapsuleCollider args={[0.75, 0.5]} />
      </RigidBody>

      <Torch
        ref={torchRef}
        position={[0, 0, 0]} // Initial position will be updated in useFrame
        rotation={[0, 0, 0]} // Initial rotation will be updated in useFrame
      />

      <group ref={mapRef}>
        <Map isMapUp={!isMapInHand} />
      </group>

      {/* Add footstep sounds component */}
      <FootstepSounds isMoving={isMoving} />
    </>
  );
};
