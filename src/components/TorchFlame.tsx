import { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { FlameShader } from '../shaders/FlameShader';
import { EmberParticles } from './EmberParticles';

interface TorchFlameProps {
  position?: [number, number, number];
  scale?: [number, number, number];
  color?: string;
  innerColor?: string;
  showEmbers?: boolean;
  emberCount?: number;
  emberColor?: string;
}

export const TorchFlame = ({
  position = [0, 0, 0],
  scale = [1, 1, 1],
  color = '#ff5500',
  innerColor = '#ffff00',
  showEmbers = true,
  emberCount = 10,
  emberColor = '#ff6600'
}: TorchFlameProps) => {
  const meshRef = useRef<THREE.Mesh>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  // Create geometry with more segments for better detail
  const geometry = useMemo(() => {
    return new THREE.CylinderGeometry(0.5, 0.5, 1, 32, 32);
  }, []);

  // Create shader material
  const material = useMemo(() => {
    return new THREE.ShaderMaterial({
      uniforms: {
        ...FlameShader.uniforms,
        color: { value: new THREE.Color(color) },
        innerColor: { value: new THREE.Color(innerColor) },
        scale: { value: new THREE.Vector3(...scale) }
      },
      vertexShader: FlameShader.vertexShader,
      fragmentShader: FlameShader.fragmentShader,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
  }, [color, innerColor, scale]);

  // Update time uniform for animation
  useFrame((state) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = state.clock.elapsedTime;
    }
  });

  // Calculate ember position (at the base of the flame)
  const emberPosition: [number, number, number] = [
    position[0],
    position[1] - 1.5,
    position[2]
  ];

  return (
    <group position={position}>
      <mesh ref={meshRef}>
        <primitive object={geometry} />
        <primitive object={material} ref={materialRef} />
      </mesh>
      
      {showEmbers && (
        <EmberParticles 
          position={emberPosition}
          count={emberCount}
          color={emberColor}
          size={0.003}
          minSpeed={0.5}
          maxSpeed={2}
          lifespan={3}
          emissionRate={0.3}
          radius={0.5 * scale[0]}
        />
      )}
    </group>
  );
};
