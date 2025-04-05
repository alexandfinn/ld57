import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { usePlayerState } from '../store/usePlayerState'
import { useGameState } from '../store/useGameState'
import { Vector3, Euler } from 'three'
import { PointerLockControls, Box } from '@react-three/drei'

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
  useFrame(() => {
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
  })

  return (
    <>
      <PointerLockControls ref={controlsRef} />
      {/* Player mesh - invisible in first person */}
      <group position={position}>
        <Box visible={false} args={[1, 2, 1]}>
          <meshStandardMaterial color="blue" />
        </Box>
      </group>
    </>
  )
} 