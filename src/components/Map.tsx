import { useRef, useEffect, useState } from "react";
import { Mesh, Vector2, CanvasTexture, ShaderMaterial, Vector3 } from "three";
import { useThree } from "@react-three/fiber";
import { useTexture, Html, Text } from "@react-three/drei";
import { RigidBody } from "@react-three/rapier";

interface MapProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isMapUp?: boolean;
}

type DrawingTool = "pen" | "eraser";

export const Map = ({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isMapUp = false
}: MapProps) => {
  const mapRef = useRef<Mesh>(null);
  const { camera, raycaster } = useThree();
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<Vector2 | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");
  
  // Load map texture
  const mapTexture = useTexture("/textures/map.png");
  
  // Create canvas for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingTextureRef = useRef<CanvasTexture | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);
  
  // Pencil texture for drawing
  const [pencilTexture, setPencilTexture] = useState<CanvasTexture | null>(null);

  // Create pencil texture
  useEffect(() => {
    const pencilCanvas = document.createElement('canvas');
    pencilCanvas.width = 4;
    pencilCanvas.height = 4;
    const pencilCtx = pencilCanvas.getContext('2d');
    
    if (pencilCtx) {
      // Create a gradient for the pencil texture
      const gradient = pencilCtx.createRadialGradient(2, 2, 0, 2, 2, 2);
      gradient.addColorStop(0, 'rgba(80, 52, 25, 1)');
      gradient.addColorStop(0.5, 'rgba(80, 52, 25, 0.8)');
      gradient.addColorStop(1, 'rgba(80, 52, 25, 0)');
      
      pencilCtx.fillStyle = gradient;
      pencilCtx.fillRect(0, 0, 4, 4);
      
      // Add some noise for texture
      const imageData = pencilCtx.getImageData(0, 0, 4, 4);
      const data = imageData.data;
      
      for (let i = 0; i < data.length; i += 4) {
        // Add some random variation to the alpha channel
        const noise = Math.random() * 0.3;
        data[i + 3] = Math.min(255, data[i + 3] * (1 + noise));
      }
      
      pencilCtx.putImageData(imageData, 0, 0);
      
      // Create texture from canvas
      const texture = new CanvasTexture(pencilCanvas);
      setPencilTexture(texture);
    }
    
    return () => {
      if (pencilTexture) {
        pencilTexture.dispose();
      }
    };
  }, []);

  // Create canvas and texture on mount
  useEffect(() => {
    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;

    // Create context
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)'; // Transparent background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = '#654321'; // Dark brown color
      ctx.lineWidth = 3;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
    }

    // Create texture from canvas
    const texture = new CanvasTexture(canvas);
    texture.needsUpdate = true;
    drawingTextureRef.current = texture;

    // Create shader material
    const material = new ShaderMaterial({
      uniforms: {
        mapTexture: { value: mapTexture },
        drawingTexture: { value: texture },
      },
      vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D mapTexture;
        uniform sampler2D drawingTexture;
        varying vec2 vUv;
        void main() {
          vec4 mapColor = texture2D(mapTexture, vUv);
          vec4 drawingColor = texture2D(drawingTexture, vUv);
          gl_FragColor = mix(mapColor, drawingColor, drawingColor.a * 0.8);
        }
      `,
      transparent: true,
      side: 2,
    });
    
    materialRef.current = material;

    return () => {
      texture.dispose();
      material.dispose();
    };
  }, [mapTexture]);

  // Update material uniforms when drawing texture changes
  useEffect(() => {
    if (materialRef.current && drawingTextureRef.current) {
      materialRef.current.uniforms.drawingTexture.value = drawingTextureRef.current;
    }
  }, [drawingTextureRef.current]);

  // Function to get canvas point from mouse event
  const getCanvasPoint = (e: any): Vector2 | null => {
    if (!mapRef.current || !canvasRef.current) return null;

    // Get mouse position in normalized device coordinates (-1 to +1)
    const mouse = new Vector2(
      (e.clientX / window.innerWidth) * 2 - 1,
      -(e.clientY / window.innerHeight) * 2 + 1
    );
    
    // Update the raycaster with the mouse position
    raycaster.setFromCamera(mouse, camera);
    
    // Get intersection with the map mesh
    const intersects = raycaster.intersectObject(mapRef.current);
    
    if (intersects.length > 0) {
      const intersect = intersects[0];
      const uv = intersect.uv;
      
      if (uv) {
        // Convert UV coordinates to canvas coordinates
        return new Vector2(
          uv.x * canvasRef.current!.width,
          (1 - uv.y) * canvasRef.current!.height
        );
      }
    }
    
    return null;
  };

  // Function to draw a point with pencil texture
  const drawPoint = (point: Vector2) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    if (currentTool === "pen" && pencilTexture) {
      // Draw a point with the pencil texture
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.drawImage(
        pencilTexture.image,
        point.x - 2,
        point.y - 2,
        4,
        4
      );
      ctx.restore();
    } else if (currentTool === "eraser") {
      // Erase a circular area
      ctx.save();
      ctx.globalCompositeOperation = 'destination-out';
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Fully opaque white for complete erasure
      ctx.fill();
      ctx.restore();
    }
    
    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }
  };

  // Function to draw a line between two points with pencil texture
  const drawLine = (start: Vector2, end: Vector2) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    // Calculate distance and angle
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    
    if (currentTool === "pen" && pencilTexture) {
      // Draw multiple points along the line to create a textured line
      const steps = Math.max(1, Math.floor(distance / 1));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = start.x + dx * t;
        const y = start.y + dy * t;
        
        // Add some randomness to the position for a more natural look
        const offsetX = (Math.random() - 0.5) * 0.25;
        const offsetY = (Math.random() - 0.5) * 0.25;
        
        ctx.save();
        ctx.globalAlpha = 0.7 + Math.random() * 0.3;
        ctx.drawImage(
          pencilTexture.image,
          x + offsetX - 2,
          y + offsetY - 2,
          4,
          4
        );
        ctx.restore();
      }
    } else if (currentTool === "eraser") {
      // Erase along the line
      const steps = Math.max(1, Math.floor(distance / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const x = start.x + dx * t;
        const y = start.y + dy * t;
        
        ctx.save();
        ctx.globalCompositeOperation = 'destination-out';
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 1)'; // Fully opaque white for complete erasure
        ctx.fill();
        ctx.restore();
      }
    }
    
    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }
  };

  // Handle pointer down to start drawing
  const handlePointerDown = (e: any) => {
    if (!isMapUp || !mapRef.current) return; // Only allow drawing when map is up
    
    if (e.button === 0) { // Left click
      e.stopPropagation(); // Prevent other handlers from firing
      console.log("Left click detected on map"); // Debug log
      
      const point = getCanvasPoint(e);
      if (point) {
        setIsDrawing(true);
        lastPoint.current = point;
        drawPoint(point);
      }
    }
  };

  // Handle pointer move to continue drawing
  const handlePointerMove = (e: any) => {
    if (!isMapUp || !isDrawing || !lastPoint.current) return;
    
    e.stopPropagation(); // Prevent other handlers from firing
    
    const currentPoint = getCanvasPoint(e);
    if (currentPoint) {
      drawLine(lastPoint.current, currentPoint);
      lastPoint.current = currentPoint;
    }
  };

  // Handle pointer up to stop drawing
  const handlePointerUp = (e: any) => {
    if (!isMapUp) return;
    
    e.stopPropagation(); // Prevent other handlers from firing
    setIsDrawing(false);
    lastPoint.current = null;
  };

  // Debug function to clear the canvas
  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = 'rgba(0, 0, 0, 0)';
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }
  };

  // Toggle between pen and eraser
  const toggleTool = () => {
    setCurrentTool(prev => prev === "pen" ? "eraser" : "pen");
  };

  // Add a key handler to clear the canvas with 'C' key and toggle tool with 'T' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMapUp) {
        if (e.key.toLowerCase() === 'c') {
          clearCanvas();
        } else if (e.key.toLowerCase() === 't') {
          toggleTool();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isMapUp]);

  return (
    <RigidBody type="fixed">
      <mesh 
        ref={mapRef} 
        position={position} 
        rotation={rotation} 
        scale={scale}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <planeGeometry args={[0.4, 0.3]} />
        {materialRef.current && <primitive object={materialRef.current} attach="material" />}
        
        {/* HUD for map tools */}
        {isMapUp && (
          <group position={[0, -0.13, 0.01]}>
            <Html
              transform
              distanceFactor={0.15}
              position={[0, 0, 0]}
              style={{
                width: '200px',
                display: 'flex',
                justifyContent: 'center',
                pointerEvents: 'none'
              }}
            >
              <div style={{
                background: 'rgba(50, 30, 10, 0.8)',
                padding: '5px 10px',
                borderRadius: '5px',
                color: '#f0d6a6',
                fontFamily: 'serif',
                display: 'flex',
                gap: '10px',
                alignItems: 'center',
                pointerEvents: 'auto'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTool("pen");
                  }}
                  style={{
                    background: currentTool === "pen" ? '#8b5a2b' : 'transparent',
                    border: '1px solid #f0d6a6',
                    color: '#f0d6a6',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Pen
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setCurrentTool("eraser");
                  }}
                  style={{
                    background: currentTool === "eraser" ? '#8b5a2b' : 'transparent',
                    border: '1px solid #f0d6a6',
                    color: '#f0d6a6',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Eraser
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    clearCanvas();
                  }}
                  style={{
                    background: 'transparent',
                    border: '1px solid #f0d6a6',
                    color: '#f0d6a6',
                    padding: '3px 8px',
                    borderRadius: '3px',
                    cursor: 'pointer'
                  }}
                >
                  Clear
                </button>
              </div>
            </Html>
          </group>
        )}
      </mesh>
    </RigidBody>
  );
};