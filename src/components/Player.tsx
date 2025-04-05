import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePlayerState } from '../store/usePlayerState'
import { useGameState } from '../store/useGameState'
import { Vector3, Euler } from 'three'
import { PointerLockControls } from '@react-three/drei'
import { Torch } from './Torch'
import { RigidBody, CapsuleCollider, useRapier, RapierRigidBody } from '@react-three/rapier'
import { PointerLockControls as PointerLockControlsImpl } from 'three-stdlib'

const SPEED = 5
const direction = new Vector3()
const frontVector = new Vector3()
const sideVector = new Vector3()

export const Player = () => {
  const { camera } = useThree()
  const controlsRef = useRef<PointerLockControlsImpl>(null)
  const playerRef = useRef<RapierRigidBody>(null)
  const rapier = useRapier()
  
  const { 
    position,
    rotation,
    updateRotation,
    updatePosition
  } = usePlayerState()
  const { isPaused } = useGameState()
  
  // Track which keys are currently pressed
  const keysPressed = useRef<Set<string>>(new Set())
  
  // Refs for torch movement with threshold and lerping
  const lastRotation = useRef(rotation)
  const torchRotation = useRef(rotation)
  const targetTorchRotation = useRef(rotation)
  const isLerping = useRef(false)
  const lastSignificantTurnTime = useRef(0)
  
  // Thresholds and timing constants
  const LEFT_THRESHOLD = 3.0
  const RIGHT_THRESHOLD = 0.0
  const LERP_SPEED = 0.03
  const FOLLOW_DELAY = 0.7
  
  // Breathing animation parameters
  const breathingAmplitude = 0.04
  const breathingSpeed = 1.5
  const breathingOffset = useRef(0)

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return
      keysPressed.current.add(e.key.toLowerCase())
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      keysPressed.current.delete(e.key.toLowerCase())
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
    }
  }, [isPaused])

  // Handle mouse movement for camera rotation
  useEffect(() => {
    if (!controlsRef.current) return

    const handleMouseMove = () => {
      if (isPaused) return
      
      const euler = new Euler(0, 0, 0, 'YXZ')
      euler.setFromQuaternion(camera.quaternion)
      updateRotation(euler.y)
    }

    const controls = controlsRef.current
    controls.addEventListener('change', handleMouseMove)
    return () => {
      controls.removeEventListener('change', handleMouseMove)
    }
  }, [camera, isPaused, updateRotation])

  // Update player position and handle movement
  useFrame((state, delta) => {
    if (!controlsRef.current || !playerRef.current || isPaused) return

    const forward = Number(keysPressed.current.has('w'))
    const backward = Number(keysPressed.current.has('s'))
    const left = Number(keysPressed.current.has('a'))
    const right = Number(keysPressed.current.has('d'))
    const jump = keysPressed.current.has(' ')

    // Get current velocity
    const velocity = playerRef.current.linvel()
    
    // Update camera position to match player position
    const playerPosition = playerRef.current.translation()
    camera.position.set(playerPosition.x, playerPosition.y + 1.5, playerPosition.z)
    updatePosition(new Vector3(playerPosition.x, playerPosition.y, playerPosition.z))
    
    // Movement
    frontVector.set(0, 0, backward - forward)
    sideVector.set(left - right, 0, 0)
    direction.subVectors(frontVector, sideVector)
      .normalize()
      .multiplyScalar(SPEED)
      .applyEuler(state.camera.rotation)
    
    // Apply movement
    playerRef.current.setLinvel({ x: direction.x, y: velocity.y, z: direction.z })

    // Handle jumping
    const grounded = playerRef.current.translation().y <= 0.1
    if (jump && grounded) {
      playerRef.current.setLinvel({ x: velocity.x, y: 7.5, z: velocity.z })
    }
    
    // Calculate rotation difference for torch
    const rotationDiff = rotation - lastRotation.current
    
    // Normalize rotation difference to be between -PI and PI
    let normalizedDiff = rotationDiff
    if (normalizedDiff > Math.PI) normalizedDiff -= 2 * Math.PI
    if (normalizedDiff < -Math.PI) normalizedDiff += 2 * Math.PI
    
    // Check if rotation change exceeds threshold based on direction
    const timeSinceLastTurn = state.clock.elapsedTime - lastSignificantTurnTime.current
    const shouldFollowRegardless = timeSinceLastTurn > FOLLOW_DELAY
    
    if (shouldFollowRegardless || 
        (normalizedDiff > 0 && Math.abs(normalizedDiff) > RIGHT_THRESHOLD) || 
        (normalizedDiff < 0 && Math.abs(normalizedDiff) > LEFT_THRESHOLD)) {
      targetTorchRotation.current = rotation
      isLerping.current = true
      lastRotation.current = rotation
      lastSignificantTurnTime.current = state.clock.elapsedTime
    }
    
    // Lerp torch rotation
    if (isLerping.current) {
      let angleDiff = targetTorchRotation.current - torchRotation.current
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
      torchRotation.current += angleDiff * LERP_SPEED
      if (Math.abs(angleDiff) < 0.01) {
        isLerping.current = false
        torchRotation.current = targetTorchRotation.current
      }
    }
    
    // Update breathing animation
    breathingOffset.current = Math.sin(state.clock.elapsedTime * breathingSpeed) * breathingAmplitude
  })

  // Calculate torch position based on current torch rotation and breathing animation
  const baseOffset = new Vector3(-0.25, -0.25, -0.5)
  const rotatedOffset = baseOffset.clone().applyAxisAngle(new Vector3(0, 1, 0), torchRotation.current)
  const torchPosition = position.clone().add(rotatedOffset)
  torchPosition.y += breathingOffset.current

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
        <mesh castShadow>
          <capsuleGeometry args={[0.25, 1.5, 4, 8]} />
          <meshStandardMaterial color="red" />
        </mesh>
      </RigidBody>
      
      <Torch 
        position={[torchPosition.x, torchPosition.y, torchPosition.z]} 
        rotation={[0, torchRotation.current, 0]}
        scale={[0.5, 0.5, 0.5]}
      />
    </>
  )
} 