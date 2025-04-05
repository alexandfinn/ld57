import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

interface EmberParticlesProps {
  position?: [number, number, number];
  count?: number;
  size?: number;
  color?: string;
  minSpeed?: number;
  maxSpeed?: number;
  lifespan?: number;
  emissionRate?: number;
  radius?: number;
}

export const EmberParticles = ({
  position = [0, 0, 0],
  count = 3,
  size = 0.001,
  color = '#ff6600',
  minSpeed = 5000,
  maxSpeed = 15000,
  lifespan = 100,
  emissionRate = 1,
  radius = 0.5
}: EmberParticlesProps) => {
  const particlesRef = useRef<THREE.Points>(null);
  const timeRef = useRef(0);
  
  // Create particle geometry and material
  const { geometry, material } = useMemo(() => {
    // Create geometry
    const geometry = new THREE.BufferGeometry();
    
    // Create arrays for particle positions, velocities, and lifespans
    const positions = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const lifespans = new Float32Array(count);
    const ages = new Float32Array(count);
    const active = new Float32Array(count);
    const speeds = new Float32Array(count);
    
    // Initialize particles
    for (let i = 0; i < count; i++) {
      // Set initial position (all particles start at origin)
      positions[i * 3] = 0;
      positions[i * 3 + 1] = 0;
      positions[i * 3 + 2] = 0;
      
      // Set initial velocity (random direction with upward bias)
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 0.15;
      velocities[i * 3] = Math.cos(angle) * radius;
      velocities[i * 3 + 1] = Math.random() * 0.6 + 0.4;
      velocities[i * 3 + 2] = Math.sin(angle) * radius;
      
      // Set random speed between min and max
      speeds[i] = Math.random() * (maxSpeed - minSpeed) + minSpeed;
      
      // Set random lifespan
      lifespans[i] = Math.random() * 10.0 + lifespan * 0.5;
      
      // Set initial age (all particles start inactive)
      ages[i] = 0;
      active[i] = 0;
    }
    
    // Add attributes to geometry
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('lifespan', new THREE.BufferAttribute(lifespans, 1));
    geometry.setAttribute('age', new THREE.BufferAttribute(ages, 1));
    geometry.setAttribute('active', new THREE.BufferAttribute(active, 1));
    geometry.setAttribute('speed', new THREE.BufferAttribute(speeds, 1));
    
    // Create material
    const material = new THREE.PointsMaterial({
      color: new THREE.Color(color),
      size: size,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    return { geometry, material };
  }, [count, size, color, minSpeed, maxSpeed]);
  
  // Update particles
  useFrame((state, delta) => {
    if (!particlesRef.current) return;
    
    timeRef.current += delta;
    
    const positions = particlesRef.current.geometry.getAttribute('position').array as Float32Array;
    const velocities = particlesRef.current.geometry.getAttribute('velocity').array as Float32Array;
    const lifespans = particlesRef.current.geometry.getAttribute('lifespan').array as Float32Array;
    const ages = particlesRef.current.geometry.getAttribute('age').array as Float32Array;
    const active = particlesRef.current.geometry.getAttribute('active').array as Float32Array;
    const speeds = particlesRef.current.geometry.getAttribute('speed').array as Float32Array;
    
    // Update each particle
    for (let i = 0; i < count; i++) {
      // Check if particle is active
      if (active[i] > 0) {
        // Update age
        ages[i] += delta;
        
        // Check if particle has expired
        if (ages[i] >= lifespans[i]) {
          // Deactivate particle
          active[i] = 0;
          ages[i] = 0;
          
          // Reset position
          positions[i * 3] = 0;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = 0;
          
          // Set new random speed
          speeds[i] = Math.random() * (maxSpeed - minSpeed) + minSpeed;
        } else {
          // Update position based on velocity and individual speed
          positions[i * 3] += velocities[i * 3] * delta * speeds[i];
          positions[i * 3 + 1] += velocities[i * 3 + 1] * delta * speeds[i];
          positions[i * 3 + 2] += velocities[i * 3 + 2] * delta * speeds[i];
          
          // Add some random movement (reduced)
          positions[i * 3] += (Math.random() - 0.5) * 0.003;
          positions[i * 3 + 2] += (Math.random() - 0.5) * 0.003;
          
          // Gradually slow down upward velocity (much slower)
          velocities[i * 3 + 1] *= 0.999;
          
          // Add slight horizontal drift
          velocities[i * 3] *= 0.999;
          velocities[i * 3 + 2] *= 0.999;
          
          // Add upward acceleration for higher travel
          if (ages[i] > lifespans[i] * 0.1) {
            velocities[i * 3 + 1] += 0.001 * delta;
          }
          
          // Add slight outward drift for wider spread
          const distFromCenter = Math.sqrt(
            positions[i * 3] * positions[i * 3] + 
            positions[i * 3 + 2] * positions[i * 3 + 2]
          );
          
          if (distFromCenter > 0.01) {
            const angle = Math.atan2(positions[i * 3 + 2], positions[i * 3]);
            velocities[i * 3] += Math.cos(angle) * 0.0001 * delta;
            velocities[i * 3 + 2] += Math.sin(angle) * 0.0001 * delta;
          }
        }
      } else {
        // Randomly activate particles based on emission rate
        if (Math.random() < emissionRate * delta) {
          // Activate particle
          active[i] = 1;
          
          // Set random position within the circular emission area
          const angle = Math.random() * Math.PI * 2;
          const distance = Math.random() * radius;
          positions[i * 3] = Math.cos(angle) * distance;
          positions[i * 3 + 1] = 0;
          positions[i * 3 + 2] = Math.sin(angle) * distance;
          
          // Set random velocity (increased upward bias)
          const velocityAngle = Math.random() * Math.PI * 2;
          const velocityRadius = Math.random() * 0.15;
          velocities[i * 3] = Math.cos(velocityAngle) * velocityRadius;
          velocities[i * 3 + 1] = Math.random() * 0.6 + 0.4;
          velocities[i * 3 + 2] = Math.sin(velocityAngle) * velocityRadius;
          
          // Set random speed
          speeds[i] = Math.random() * (maxSpeed - minSpeed) + minSpeed;
          
          // Set random lifespan
          lifespans[i] = Math.random() * 10.0 + lifespan * 0.5;
        }
      }
    }
    
    // Update attributes
    particlesRef.current.geometry.getAttribute('position').needsUpdate = true;
    particlesRef.current.geometry.getAttribute('age').needsUpdate = true;
    particlesRef.current.geometry.getAttribute('active').needsUpdate = true;
    
    // Update material opacity based on particle age
    const opacityArray = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      if (active[i] > 0) {
        // Fade in at start, fade out at end
        const ageRatio = ages[i] / lifespans[i];
        opacityArray[i] = Math.min(1.0, ageRatio * 2.0) * (1.0 - ageRatio);
      } else {
        opacityArray[i] = 0;
      }
    }
    
    // Add opacity attribute if it doesn't exist
    if (!particlesRef.current.geometry.getAttribute('opacity')) {
      particlesRef.current.geometry.setAttribute('opacity', new THREE.BufferAttribute(opacityArray, 1));
    } else {
      particlesRef.current.geometry.getAttribute('opacity').array.set(opacityArray);
      particlesRef.current.geometry.getAttribute('opacity').needsUpdate = true;
    }
  });
  
  return (
    <points ref={particlesRef}>
      <primitive object={geometry} />
      <primitive object={material} />
    </points>
  );
}; 