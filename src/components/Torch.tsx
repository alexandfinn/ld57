import { useGLTF } from "@react-three/drei";
import { useFrame } from "@react-three/fiber";
import { forwardRef, useRef, useMemo } from "react";
import * as THREE from "three";

interface TorchProps {
  position: [number, number, number];
  rotation?: [number, number, number];
}

const scale: [number, number, number] = [0.2, 0.2, 0.2];

export const Torch = forwardRef<THREE.Group, TorchProps>(
  ({ position, rotation = [0, 0, 0] }, ref) => {
    const { scene } = useGLTF("/models/handtorch.glb");
    const pointLightRef = useRef<THREE.PointLight>(null);
    const timeRef = useRef(0);

    // Create flame materials with colors from reference
    const flameMaterial = useMemo(() => {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffaa33), // Orange color from reference
        transparent: true,
        opacity: 0.8,
      });
    }, []);

    const flameCoreMaterial = useMemo(() => {
      return new THREE.MeshBasicMaterial({
        color: new THREE.Color(0xffff44), // Yellow color from reference
        transparent: true,
        opacity: 0.9,
      });
    }, []);

    // Create ember particle material
    const emberMaterial = useMemo(() => {
      return new THREE.PointsMaterial({
        color: new THREE.Color(0xff5500),
        size: 0.01,
        transparent: true,
        opacity: 0.8,
      });
    }, []);

    // Create ember particles geometry
    const emberGeometry = useMemo(() => {
      const geometry = new THREE.BufferGeometry();
      const particleCount = 12;

      // Positions for particles
      const positions = new Float32Array(particleCount * 3);
      const velocities = new Float32Array(particleCount * 3);
      const startTimes = new Float32Array(particleCount);

      // Initialize particle positions and velocities
      for (let i = 0; i < particleCount; i++) {
        // Starting position - clustered at the top of flame
        positions[i * 3] = (Math.random() - 0.5) * 0.04;
        positions[i * 3 + 1] = 0;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 0.04;

        // Random upward and outward velocity
        velocities[i * 3] = (Math.random() - 0.5) * 0.02;
        velocities[i * 3 + 1] = Math.random() * 0.05 + 0.02;
        velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02;

        // Stagger start times
        startTimes[i] = Math.random() * 2;
      }

      geometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );
      geometry.setAttribute(
        "velocity",
        new THREE.BufferAttribute(velocities, 3)
      );
      geometry.setAttribute(
        "startTime",
        new THREE.BufferAttribute(startTimes, 1)
      );

      return geometry;
    }, []);

    const flameCoreRef = useRef<THREE.Mesh>(null);
    const flameOuterRef = useRef<THREE.Mesh>(null);
    const emberRef = useRef<THREE.Points>(null);

    // Update flicker effect every frame with more natural fire-like pattern
    useFrame((state, delta) => {
      timeRef.current += delta;

      if (pointLightRef.current) {
        // Create fire-like flicker pattern with multiple frequencies
        const noise =
          Math.sin(timeRef.current) * 0.15 + // Base flicker
          Math.sin(timeRef.current * 0.34) * 0.08 + // Medium frequency
          Math.sin(timeRef.current * 0.64) * 0.04 + // Higher frequency
          Math.sin(timeRef.current * 0.1) * 0.12; // Slow, gentle movement

        // Add slight randomness for more natural fire behavior
        const randomFactor = 0.02 * (Math.random() - 0.5);
        const finalIntensity = 2 * (1 + noise + randomFactor);

        pointLightRef.current.intensity = finalIntensity;

        // Also move light slightly for more dynamic lighting
        pointLightRef.current.position.x =
          Math.sin(timeRef.current * Math.PI) * 0.04;
        pointLightRef.current.position.z =
          Math.cos(timeRef.current * Math.PI * 0.75) * 0.04;
      }

      // Animate flame
      if (flameCoreRef.current && flameOuterRef.current) {
        // Scale fluctuation
        const scaleFluctuation = Math.sin(timeRef.current * 5) * 0.05 + 0.95;
        flameCoreRef.current.scale.set(
          scaleFluctuation,
          1.0 + scaleFluctuation * 0.2,
          scaleFluctuation
        );
        flameOuterRef.current.scale.set(
          0.8 * scaleFluctuation,
          1.2 + scaleFluctuation * 0.3,
          0.8 * scaleFluctuation
        );

        // Rotation for more dynamic flame movement
        flameCoreRef.current.rotation.y = Math.sin(timeRef.current * 3) * 0.1;
        flameOuterRef.current.rotation.y = Math.cos(timeRef.current * 2) * 0.15;

        // Color fluctuation for more realistic fire
        if (flameMaterial && flameCoreMaterial) {
          // Hue shift between orange and yellow for outer flame
          const hue = 0.05 + Math.sin(timeRef.current * 2) * 0.02;
          const saturation = 0.9 + Math.sin(timeRef.current * 3) * 0.1;
          const lightness = 0.6 + Math.sin(timeRef.current * 4) * 0.1;

          flameMaterial.color.setHSL(hue, saturation, lightness);
          flameMaterial.opacity = 0.7 + Math.sin(timeRef.current * 6) * 0.3;

          // Inner flame color animation
          const innerHue = 0.12 + Math.sin(timeRef.current * 3) * 0.02;
          flameCoreMaterial.color.setHSL(innerHue, 0.85, 0.65);
        }
      }

      // Animate ember particles
      if (emberRef.current && emberRef.current.geometry) {
        const positions = emberRef.current.geometry.attributes.position
          .array as Float32Array;
        const velocities = emberRef.current.geometry.attributes.velocity
          .array as Float32Array;
        const startTimes = emberRef.current.geometry.attributes.startTime
          .array as Float32Array;

        // Only process a subset of particles to make them appear fewer
        const activeParticleCount = Math.floor((positions.length / 3) * 0.5); // Only use 50% of available particles

        for (let i = 0; i < activeParticleCount; i++) {
          // Calculate lifetime based on start time
          const particleTime = (timeRef.current - startTimes[i]) % 3; // Longer lifetime (3 instead of 2)

          if (particleTime < 0) continue;

          // Reset particles that have completed their lifecycle
          if (particleTime <= 0.1) {
            positions[i * 3] = (Math.random() - 0.5) * 0.03; // Smaller spawn area
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 0.03; // Smaller spawn area

            // Much slower velocities (25% of original)
            velocities[i * 3] = (Math.random() - 0.5) * 0.005;
            velocities[i * 3 + 1] = Math.random() * 0.0125 + 0.005;
            velocities[i * 3 + 2] = (Math.random() - 0.5) * 0.005;

            // Add gentle angular velocity (in degrees, converted to radians)
            const angle = Math.random() * 360 * (Math.PI / 180);
            const speed = Math.random() * 0.005; // Slower circular motion
            velocities[i * 3] += Math.cos(angle) * speed;
            velocities[i * 3 + 2] += Math.sin(angle) * speed;
          } else {
            // Update position based on velocity with reduced wind drift
            positions[i * 3] +=
              velocities[i * 3] + Math.sin(timeRef.current * 1.5) * 0.0002;
            positions[i * 3 + 1] += velocities[i * 3 + 1];
            positions[i * 3 + 2] +=
              velocities[i * 3 + 2] + Math.cos(timeRef.current * 1) * 0.0002;

            // Less air resistance for slower, longer-lasting particles
            velocities[i * 3] *= 0.995;
            velocities[i * 3 + 1] *= 0.995;
            velocities[i * 3 + 2] *= 0.995;

            // Add very slight rotation to particles
            const rotationSpeed = 0.01; // in radians, slower rotation
            const vx = velocities[i * 3];
            const vz = velocities[i * 3 + 2];
            velocities[i * 3] =
              vx * Math.cos(rotationSpeed) - vz * Math.sin(rotationSpeed);
            velocities[i * 3 + 2] =
              vx * Math.sin(rotationSpeed) + vz * Math.cos(rotationSpeed);

            // Fade out particles over lifetime
            if (emberMaterial && particleTime > 2.25) {
              const fadeRatio = (3 - particleTime) / 0.75; // fade out during last 0.75 seconds
              emberMaterial.opacity = fadeRatio * 0.6; // Lower max opacity
            }
          }
        }

        // Hide unused particles by moving them far away
        for (let i = activeParticleCount; i < positions.length / 3; i++) {
          positions[i * 3] = 1000; // Move far away
          positions[i * 3 + 1] = 1000;
          positions[i * 3 + 2] = 1000;
        }

        emberRef.current.geometry.attributes.position.needsUpdate = true;
      }
    });

    return (
      <group ref={ref} position={position} rotation={rotation} scale={scale}>
        {/* Render the torch model */}
        <primitive object={scene} />

        {/* Add flame outer glow - a slightly larger, more transparent cone */}
        <mesh ref={flameOuterRef} position={[0, 1.525, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.27, 0.75, 12, 1, true]} />
          <meshBasicMaterial
            color="#ff9933"
            transparent={true}
            opacity={0.5}
            depthWrite={false}
          />
        </mesh>

        {/* Add flame core - a cone */}
        <mesh ref={flameCoreRef} position={[0, 1.6, 0]} rotation={[0, 0, 0]}>
          <coneGeometry args={[0.18, 0.6, 8, 1, true]} />
          <meshBasicMaterial
            color="#ffcc00"
            transparent={true}
            opacity={0.8}
            depthWrite={false}
          />
        </mesh>

        {/* Add ember particles */}
        <points
          ref={emberRef}
          geometry={emberGeometry}
          material={emberMaterial}
          position={[0, 1.2, 0]}
        />
        {/* Add flickering point light for ambient illumination */}
        <pointLight
          ref={pointLightRef}
          position={[0, 1.7, 0]}
          intensity={10}
          color="#ffa64d"
          distance={20}
          decay={0.3}
          castShadow
          shadow-mapSize-width={512}
          shadow-mapSize-height={512}
          shadow-radius={8}
          shadow-bias={-0.0001}
        />
      </group>
    );
  }
);
