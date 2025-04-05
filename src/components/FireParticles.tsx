import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useTorchState } from '../store/useTorchState'

interface FireParticlesProps {
  position?: [number, number, number]
  scale?: number
}

export const FireParticles = ({ position = [0, 0, 0], scale = 1 }: FireParticlesProps) => {
  const particlesRef = useRef<THREE.Points>(null)
  const { flickerIntensity } = useTorchState()
  
  // Create particle geometry
  const particleCount = 50
  const particles = useMemo(() => {
    const positions = new Float32Array(particleCount * 3)
    const velocities = new Float32Array(particleCount * 3)
    const colors = new Float32Array(particleCount * 3)
    
    for (let i = 0; i < particleCount; i++) {
      // Random positions in a small sphere
      const i3 = i * 3
      positions[i3] = (Math.random() - 0.5) * 0.1
      positions[i3 + 1] = Math.random() * 0.2
      positions[i3 + 2] = (Math.random() - 0.5) * 0.1
      
      // Random velocities (mostly upward)
      velocities[i3] = (Math.random() - 0.5) * 0.02
      velocities[i3 + 1] = Math.random() * 0.05 + 0.02
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02
      
      // Colors (orange to yellow)
      const color = new THREE.Color()
      color.setHSL(Math.random() * 0.1 + 0.05, 1, 0.5 + Math.random() * 0.5)
      colors[i3] = color.r
      colors[i3 + 1] = color.g
      colors[i3 + 2] = color.b
    }
    
    return { positions, velocities, colors }
  }, [])
  
  // Create geometry and material
  const geometry = useMemo(() => {
    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(particles.positions, 3))
    geo.setAttribute('color', new THREE.BufferAttribute(particles.colors, 3))
    return geo
  }, [particles])
  
  const material = useMemo(() => {
    return new THREE.PointsMaterial({
      size: 0.05 * scale,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    })
  }, [scale])
  
  // Store velocities in a ref for animation
  const velocitiesRef = useRef(particles.velocities)
  
  // Animate particles
  useFrame((state, delta) => {
    if (!particlesRef.current) return
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3
      
      // Update position based on velocity
      positions[i3] += velocitiesRef.current[i3] * delta * 10
      positions[i3 + 1] += velocitiesRef.current[i3 + 1] * delta * 10
      positions[i3 + 2] += velocitiesRef.current[i3 + 2] * delta * 10
      
      // Reset particles that go too high
      if (positions[i3 + 1] > 0.3) {
        positions[i3] = (Math.random() - 0.5) * 0.1
        positions[i3 + 1] = 0
        positions[i3 + 2] = (Math.random() - 0.5) * 0.1
        
        // Update velocity
        velocitiesRef.current[i3] = (Math.random() - 0.5) * 0.02
        velocitiesRef.current[i3 + 1] = Math.random() * 0.05 + 0.02
        velocitiesRef.current[i3 + 2] = (Math.random() - 0.5) * 0.02
      }
    }
    
    // Apply flicker effect
    material.opacity = 0.6 + flickerIntensity * 0.4
    material.size = 0.05 * scale * (0.8 + flickerIntensity * 0.4)
    
    particlesRef.current.geometry.attributes.position.needsUpdate = true
  })
  
  return (
    <points ref={particlesRef} geometry={geometry} material={material} position={position} />
  )
} 