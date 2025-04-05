import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePlayerState } from '../store/usePlayerState'
import { useGameState } from '../store/useGameState'
import { Vector3, Euler } from 'three'
import { PointerLockControls, Box } from '@react-three/drei'
import { Torch } from './Torch'

export const Player = () => {
  const { camera } = useThree()
  const controlsRef = useRef<any>(null)
  const { 
    position, 
    rotation, 
    moveForward, 
    moveBackward, 
    moveLeft, 
    moveRight, 
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
  const LEFT_THRESHOLD = 3.0 // Lower threshold for left turns
  const RIGHT_THRESHOLD = 0.0 // Higher threshold for right turns
  const LERP_SPEED = 0.03 // Adjust this value to control lerp speed
  const FOLLOW_DELAY = 0.5 // Time in seconds before torch follows regardless of threshold
  
  // Breathing animation parameters
  const breathingAmplitude = 0.04 // How much the torch moves up and down
  const breathingSpeed = 1.5 // Speed of the breathing animation
  const breathingOffset = useRef(0) // Current offset for breathing animation

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isPaused) return
      
      // Add key to pressed keys set
      keysPressed.current.add(e.key.toLowerCase())
    }
    
    const handleKeyUp = (e: KeyboardEvent) => {
      // Remove key from pressed keys set
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

    controlsRef.current.addEventListener('change', handleMouseMove)
    return () => controlsRef.current?.removeEventListener('change', handleMouseMove)
  }, [camera, isPaused, updateRotation])

  // Update player position and handle movement
  useFrame((state, delta) => {
    if (!controlsRef.current || isPaused) return
    
    // Apply movement based on currently pressed keys
    if (keysPressed.current.has('w')) moveForward()
    if (keysPressed.current.has('s')) moveBackward()
    if (keysPressed.current.has('a')) moveLeft()
    if (keysPressed.current.has('d')) moveRight()
    
    // Update position based on velocity
    updatePosition()
    
    // Update camera position to match player position
    camera.position.copy(position)
    
    // Calculate rotation difference
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
      // Set target rotation and start lerping
      targetTorchRotation.current = rotation
      isLerping.current = true
      lastRotation.current = rotation
      lastSignificantTurnTime.current = state.clock.elapsedTime
    }
    
    // Lerp torch rotation when threshold is reached
    if (isLerping.current) {
      // Calculate the angle difference
      let angleDiff = targetTorchRotation.current - torchRotation.current
      
      // Normalize angle difference to be between -PI and PI
      if (angleDiff > Math.PI) angleDiff -= 2 * Math.PI
      if (angleDiff < -Math.PI) angleDiff += 2 * Math.PI
      
      // Apply lerp
      torchRotation.current += angleDiff * LERP_SPEED
      
      // Check if we're close enough to stop lerping
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
  
  // Apply breathing animation to torch position
  torchPosition.y += breathingOffset.current

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      {/* Player mesh - invisible in first person */}
      <group position={position}>
        <Box visible={false} args={[1, 2, 1]}>
          <meshStandardMaterial color="blue" />
        </Box>
      </group>
      
      {/* Player's torch with threshold-based movement, lerping, and breathing animation */}
      <Torch 
        position={[torchPosition.x, torchPosition.y, torchPosition.z]} 
        rotation={[0, torchRotation.current, 0]}
        scale={[0.5, 0.5, 0.5]}
      />
    </>
  )
} 