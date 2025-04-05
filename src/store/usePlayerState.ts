import { create } from 'zustand'
import { Vector3 } from 'three'

interface PlayerState {
  position: Vector3
  velocity: Vector3
  rotation: number
  moveSpeed: number
  acceleration: number
  friction: number
  // Actions
  moveForward: () => void
  moveBackward: () => void
  moveLeft: () => void
  moveRight: () => void
  updateRotation: (newRotation: number) => void
  updatePosition: () => void
}

export const usePlayerState = create<PlayerState>((set, get) => ({
  // Initial state
  position: new Vector3(0, 1.7, 0), // Start at eye level
  velocity: new Vector3(0, 0, 0),
  rotation: 0,
  moveSpeed: 0.15,
  acceleration: 0.01,
  friction: 0.85,

  // Actions
  moveForward: () => set((state) => {
    const newVelocity = state.velocity.clone()
    const angle = state.rotation
    newVelocity.x -= Math.sin(angle) * state.acceleration
    newVelocity.z -= Math.cos(angle) * state.acceleration
    return { velocity: newVelocity }
  }),

  moveBackward: () => set((state) => {
    const newVelocity = state.velocity.clone()
    const angle = state.rotation
    newVelocity.x += Math.sin(angle) * state.acceleration
    newVelocity.z += Math.cos(angle) * state.acceleration
    return { velocity: newVelocity }
  }),

  moveLeft: () => set((state) => {
    const newVelocity = state.velocity.clone()
    const angle = state.rotation
    newVelocity.x -= Math.cos(angle) * state.acceleration
    newVelocity.z += Math.sin(angle) * state.acceleration
    return { velocity: newVelocity }
  }),

  moveRight: () => set((state) => {
    const newVelocity = state.velocity.clone()
    const angle = state.rotation
    newVelocity.x += Math.cos(angle) * state.acceleration
    newVelocity.z -= Math.sin(angle) * state.acceleration
    return { velocity: newVelocity }
  }),

  updateRotation: (newRotation: number) => set({ rotation: newRotation }),

  updatePosition: () => set((state) => {
    // Apply friction
    const newVelocity = state.velocity.clone().multiplyScalar(state.friction)
    
    // Clamp velocity to max speed
    const speed = newVelocity.length()
    if (speed > state.moveSpeed) {
      newVelocity.multiplyScalar(state.moveSpeed / speed)
    }
    
    // Update position
    const newPosition = state.position.clone().add(newVelocity)
    
    return {
      position: newPosition,
      velocity: newVelocity
    }
  }),
})) 