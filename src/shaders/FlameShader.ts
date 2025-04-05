import * as THREE from 'three';

export const FlameShader = {
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color(0xff5500) },
    innerColor: { value: new THREE.Color(0xffff00) },
    scale: { value: new THREE.Vector3(1, 1, 1) },
    noiseScale: { value: new THREE.Vector3(1, 2, 1) },
    noiseIntensity: { value: 0.2 },
    flameSpeed: { value: 0.2 },
    flameHeight: { value: 1.2 },
    flameWidth: { value: 0.5 },
    flameDetail: { value: 1.5 },
    turbulenceScale: { value: 1.0 },
    turbulenceSpeed: { value: 0.15 },
    radiusVariation: { value: 0.5 },
    radiusSpeed: { value: 0.4 },
    radiusDetail: { value: 2.0 }
  },
  vertexShader: `
    uniform float time;
    uniform vec3 scale;
    uniform vec3 noiseScale;
    uniform float noiseIntensity;
    uniform float flameSpeed;
    uniform float flameHeight;
    uniform float flameWidth;
    uniform float flameDetail;
    uniform float turbulenceScale;
    uniform float turbulenceSpeed;
    uniform float radiusVariation;
    uniform float radiusSpeed;
    uniform float radiusDetail;
    
    varying vec3 vPosition;
    varying float vNoise;
    
    // Simplex noise function
    vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
    vec3 permute(vec3 x) { return mod289(((x*34.0)+1.0)*x); }
    
    float snoise(vec2 v) {
      const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
      vec2 i  = floor(v + dot(v, C.yy));
      vec2 x0 = v -   i + dot(i, C.xx);
      vec2 i1;
      i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
      vec4 x12 = x0.xyxy + C.xxzz;
      x12.xy -= i1;
      i = mod289(i);
      vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
      vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
      m = m*m;
      m = m*m;
      vec3 x = 2.0 * fract(p * C.www) - 1.0;
      vec3 h = abs(x) - 0.5;
      vec3 ox = floor(x + 0.5);
      vec3 a0 = x - ox;
      m *= 1.79284291400159 - 0.85373472095314 * (a0*a0 + h*h);
      vec3 g;
      g.x  = a0.x  * x0.x  + h.x  * x0.y;
      g.yz = a0.yz * x12.xz + h.yz * x12.yw;
      return 130.0 * dot(m, g);
    }
    
    // Improved turbulence function for smoother flow
    float turbulence(vec2 p, float scale) {
      float sum = 0.0;
      float freq = 1.0;
      float amp = 1.0;
      float maxSum = 0.0;
      
      // Increase octaves for smoother flow
      for(int i = 0; i < 5; i++) {
        sum += abs(snoise(p * freq * scale)) * amp;
        maxSum += amp;
        freq *= 1.5;
        amp *= 0.7;
      }
      
      // Normalize the result
      return sum / maxSum;
    }
    
    // Flow field function for more natural movement
    vec2 flowField(vec2 p, float time) {
      float angle = snoise(p * 0.3 + time * turbulenceSpeed) * 6.28318;
      return vec2(cos(angle), sin(angle));
    }
    
    // Enhanced function to calculate radius variation at different heights
    float radiusVariationAtHeight(float height, float time) {
      // Create multiple noise layers with different frequencies and speeds
      float heightNoise = snoise(vec2(height * 3.0, time * radiusSpeed));
      
      // Add a second noise layer with different frequency
      float detailNoise = snoise(vec2(height * 5.0, time * radiusSpeed * 1.5));
      
      // Add a third noise layer for more variation
      float fineNoise = snoise(vec2(height * 8.0, time * radiusSpeed * 2.0));
      
      // Add a fourth noise layer for very fine detail
      float microNoise = snoise(vec2(height * 12.0, time * radiusSpeed * 2.5));
      
      // Create a height-based modulation factor
      float heightMod = sin(height * 6.28318 * 2.0) * 0.5 + 0.5;
      
      // Combine the noise layers with different weights
      float combinedNoise = heightNoise * 0.4 + 
                           detailNoise * 0.3 + 
                           fineNoise * 0.2 + 
                           microNoise * 0.1;
      
      // Apply height-based modulation
      combinedNoise *= 1.0 + heightMod * 0.5;
      
      // Create a pulsing effect
      float pulse = sin(time * radiusSpeed * 0.5) * 0.1 + 0.9;
      
      // Map the noise to a variation factor with enhanced range
      return 1.0 + combinedNoise * radiusVariation * pulse;
    }
    
    void main() {
      // Flip the Y position for base calculations
      vec3 flippedPosition = vec3(position.x, -position.y, position.z);
      vPosition = flippedPosition;
      
      // Calculate base flame shape with smoother taper
      float baseHeight = flippedPosition.y * flameHeight;
      
      // Create flow field for more natural movement
      vec2 flow = flowField(flippedPosition.xz * turbulenceScale, time);
      
      // Add noise for flame flicker with flow influence
      float noise = turbulence(
        vec2(flippedPosition.x * noiseScale.x, flippedPosition.z * noiseScale.z) + 
        flow * time * flameSpeed,
        flameDetail
      );
      
      // Apply noise to height with smoother transition
      float heightOffset = noise * noiseIntensity * smoothstep(1.0, 0.0, flippedPosition.y);
      
      // Calculate radius variation at this height
      float radiusFactor = radiusVariationAtHeight(flippedPosition.y, time);
      
      // Calculate flame width taper with smoother curve and radius variation
      float widthTaper = smoothstep(1.0, 0.0, flippedPosition.y * flameWidth) * radiusFactor;
      
      // Apply width taper to x and z coordinates
      vec3 modifiedPosition = flippedPosition;
      modifiedPosition.x *= widthTaper;
      modifiedPosition.z *= widthTaper;
      
      // Apply height modification with flow influence
      modifiedPosition.y = baseHeight + heightOffset + flow.y * 0.05;
      
      // Store noise value for fragment shader
      vNoise = noise;
      
      // Output final position
      gl_Position = projectionMatrix * modelViewMatrix * vec4(modifiedPosition * scale, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform vec3 innerColor;
    uniform float time;
    
    varying vec3 vPosition;
    varying float vNoise;
    
    void main() {
      // Calculate distance from center for radial gradient
      float dist = length(vPosition.xz);
      
      // Calculate height-based color blend with smoother transition (using negative y)
      float heightFactor = smoothstep(0.0, 0.9, -vPosition.y);
      
      // Mix colors based on height and noise with smoother blend
      vec3 flameColor = mix(innerColor, color, heightFactor);
      
      // Add noise-based variation with reduced intensity
      flameColor += vec3(vNoise * 0.1);
      
      // Fade out at edges with smoother transition
      float edgeFade = smoothstep(1.0, 0.0, dist);
      
      // Fade out at top and bottom with smoother transitions (using negative y)
      float verticalFade = smoothstep(0.0, 0.3, -vPosition.y) * 
                          smoothstep(1.0, 0.7, -vPosition.y);
      
      // Combine fades
      float alpha = edgeFade * verticalFade;
      
      // Output final color
      gl_FragColor = vec4(flameColor, alpha);
    }
  `
}; 