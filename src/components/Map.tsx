import { Billboard, Html, useTexture } from "@react-three/drei";
import { useThree } from "@react-three/fiber";
import { RigidBody } from "@react-three/rapier";
import { useEffect, useRef, useState } from "react";
import { CanvasTexture, Mesh, ShaderMaterial, Vector2, Vector3 } from "three";

interface MapProps {
  position?: [number, number, number];
  rotation?: [number, number, number];
  scale?: [number, number, number];
  isMapUp?: boolean;
}

type DrawingTool = "pen" | "eraser" | "select";

// Local storage key for map data
const MAP_STORAGE_KEY = "dungeon-map-drawing-data";

export const Map = ({
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = [1, 1, 1],
  isMapUp = false,
}: MapProps) => {
  const mapRef = useRef<Mesh>(null);
  const { camera, raycaster } = useThree();
  const [isDrawing, setIsDrawing] = useState(false);
  const lastPoint = useRef<Vector2 | null>(null);
  const [currentTool, setCurrentTool] = useState<DrawingTool>("pen");
  
  // Store original position and rotation when the component mounts
  const originalPosition = useRef(new Vector3(...position));
  const originalRotation = useRef<[number, number, number]>([...rotation]);

  // Load map texture
  const mapTexture = useTexture(`${import.meta.env.BASE_URL}textures/map.png`);

  // Load tool textures
  const toolTextures = useTexture({
    pen: `${import.meta.env.BASE_URL}hud/tool-pen.jpg`,
    eraser: `${import.meta.env.BASE_URL}hud/tool-eraser.jpg`,
    select: `${import.meta.env.BASE_URL}hud/tool-selection.jpg`,
    clear: `${import.meta.env.BASE_URL}hud/tool-clear.jpg`,
  });

  // Create canvas for drawing
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawingTextureRef = useRef<CanvasTexture | null>(null);
  const materialRef = useRef<ShaderMaterial | null>(null);

  // Pencil texture for drawing
  const [pencilTexture, setPencilTexture] = useState<CanvasTexture | null>(
    null
  );

  // Selection state
  const [selectionStart, setSelectionStart] = useState<Vector2 | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Vector2 | null>(null);
  const [isSelecting, setIsSelecting] = useState(false);
  const [isMovingSelection, setIsMovingSelection] = useState(false);
  const [selectionData, setSelectionData] = useState<ImageData | null>(null);
  const [selectionOffset, setSelectionOffset] = useState<Vector2 | null>(null);
  // Store original canvas state before selection
  const originalCanvasState = useRef<ImageData | null>(null);

  // Create a separate canvas for selection overlay
  const selectionCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const selectionTextureRef = useRef<CanvasTexture | null>(null);

  // Create pencil texture
  useEffect(() => {
    const pencilCanvas = document.createElement("canvas");
    pencilCanvas.width = 3;
    pencilCanvas.height = 3;
    const pencilCtx = pencilCanvas.getContext("2d");

    if (pencilCtx) {
      // Create a gradient for the pencil texture
      const gradient = pencilCtx.createRadialGradient(1.5, 1.5, 0, 1.5, 1.5, 1.5);
      gradient.addColorStop(0, "rgba(80, 52, 25, 1)");
      gradient.addColorStop(0.5, "rgba(80, 52, 25, 0.8)");
      gradient.addColorStop(1, "rgba(80, 52, 25, 0)");

      pencilCtx.fillStyle = gradient;
      pencilCtx.fillRect(0, 0, 3, 3);

      // Add some noise for texture
      const imageData = pencilCtx.getImageData(0, 0, 3, 3);
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
    // Create main drawing canvas
    const canvas = document.createElement("canvas");
    canvas.width = 512;
    canvas.height = 512;
    canvasRef.current = canvas;

    // Create selection overlay canvas
    const selectionCanvas = document.createElement("canvas");
    selectionCanvas.width = 512;
    selectionCanvas.height = 512;
    selectionCanvasRef.current = selectionCanvas;

    // Create selection texture
    const selectionTexture = new CanvasTexture(selectionCanvas);
    selectionTexture.needsUpdate = true;
    selectionTextureRef.current = selectionTexture;

    // Create context
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "rgba(0, 0, 0, 0)"; // Transparent background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.strokeStyle = "#654321"; // Dark brown color
      ctx.lineWidth = 3;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";

      // Load saved map data from localStorage if it exists
      const savedMapData = localStorage.getItem(MAP_STORAGE_KEY);
      if (savedMapData) {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0);
          if (drawingTextureRef.current) {
            drawingTextureRef.current.needsUpdate = true;
          }
        };
        img.src = savedMapData;
      }
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
        selectionTexture: { value: selectionTexture },
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
        uniform sampler2D selectionTexture;
        varying vec2 vUv;
        void main() {
          vec4 mapColor = texture2D(mapTexture, vUv);
          vec4 drawingColor = texture2D(drawingTexture, vUv);
          vec4 selectionColor = texture2D(selectionTexture, vUv);
          
          // First mix map and drawing
          vec4 combinedColor = mix(mapColor, drawingColor, drawingColor.a * 0.8);
          
          // Then overlay selection on top
          gl_FragColor = mix(combinedColor, selectionColor, selectionColor.a);
        }
      `,
      transparent: true,
      side: 2,
    });

    materialRef.current = material;

    return () => {
      texture.dispose();
      selectionTexture.dispose();
      material.dispose();
    };
  }, [mapTexture]);

  // Update material uniforms when drawing texture changes
  useEffect(() => {
    if (materialRef.current && drawingTextureRef.current) {
      materialRef.current.uniforms.drawingTexture.value =
        drawingTextureRef.current;
    }
  }, [drawingTextureRef.current]);

  // Update material uniforms when selection texture changes
  useEffect(() => {
    if (materialRef.current && selectionTextureRef.current) {
      materialRef.current.uniforms.selectionTexture.value =
        selectionTextureRef.current;
    }
  }, [selectionTextureRef.current]);

  // Save map data to localStorage when drawing changes
  const saveMapToLocalStorage = () => {
    if (canvasRef.current) {
      const dataUrl = canvasRef.current.toDataURL("image/png");
      localStorage.setItem(MAP_STORAGE_KEY, dataUrl);
    }
  };

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
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    if (currentTool === "pen" && pencilTexture) {
      // Draw a point with the pencil texture
      ctx.save();
      ctx.globalAlpha = 0.8;
      ctx.drawImage(pencilTexture.image, point.x - 1.5, point.y - 1.5, 3, 3);
      ctx.restore();
    } else if (currentTool === "eraser") {
      // Erase a circular area
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      ctx.beginPath();
      ctx.arc(point.x, point.y, 8, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Fully opaque white for complete erasure
      ctx.fill();
      ctx.restore();
    }

    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }

    // Save to localStorage after drawing
    saveMapToLocalStorage();
  };

  // Function to draw a line between two points with pencil texture
  const drawLine = (start: Vector2, end: Vector2) => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    // Calculate distance and angle
    const dx = end.x - start.x;
    const dy = end.y - start.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    if (currentTool === "pen" && pencilTexture) {
      // Draw multiple points along the line to create a textured line
      const steps = Math.max(1, Math.floor(distance / 0.75));
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
          x + offsetX - 1.5,
          y + offsetY - 1.5,
          3,
          3
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
        ctx.globalCompositeOperation = "destination-out";
        ctx.beginPath();
        ctx.arc(x, y, 8, 0, Math.PI * 2);
        ctx.fillStyle = "rgba(255, 255, 255, 1)"; // Fully opaque white for complete erasure
        ctx.fill();
        ctx.restore();
      }
    }

    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }

    // Save to localStorage after drawing
    saveMapToLocalStorage();
  };

  // Function to draw selection rectangle on the selection canvas
  const drawSelectionRect = () => {
    if (!selectionCanvasRef.current || !selectionStart || !selectionEnd) return;
    const ctx = selectionCanvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear the selection canvas
    ctx.clearRect(
      0,
      0,
      selectionCanvasRef.current.width,
      selectionCanvasRef.current.height
    );

    // Draw the selection rectangle with dashed lines
    ctx.save();
    ctx.strokeStyle = "#000";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 3]); // Dashed line

    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    ctx.strokeRect(x, y, width, height);
    ctx.restore();

    if (selectionTextureRef.current) {
      selectionTextureRef.current.needsUpdate = true;
    }
  };

  // Function to capture selection data
  const captureSelectionData = () => {
    if (!canvasRef.current || !selectionStart || !selectionEnd) return;
    const ctx = canvasRef.current.getContext("2d");
    if (!ctx) return;

    const x = Math.min(selectionStart.x, selectionEnd.x);
    const y = Math.min(selectionStart.y, selectionEnd.y);
    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);

    // Store the original canvas state before making changes
    originalCanvasState.current = ctx.getImageData(
      0,
      0,
      canvasRef.current.width,
      canvasRef.current.height
    );

    // Capture the selection area
    const imageData = ctx.getImageData(x, y, width, height);
    setSelectionData(imageData);

    // Clear the selected area
    ctx.clearRect(x, y, width, height);

    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }

    // Draw the selection data on the selection canvas immediately
    if (selectionCanvasRef.current) {
      const selectionCtx = selectionCanvasRef.current.getContext("2d");
      if (selectionCtx) {
        // Clear the selection canvas first
        selectionCtx.clearRect(
          0,
          0,
          selectionCanvasRef.current.width,
          selectionCanvasRef.current.height
        );

        // Draw the selection data
        selectionCtx.putImageData(imageData, x, y);

        // Draw the selection rectangle
        selectionCtx.save();
        selectionCtx.strokeStyle = "#000";
        selectionCtx.lineWidth = 1;
        selectionCtx.setLineDash([5, 3]); // Dashed line
        selectionCtx.strokeRect(x, y, width, height);
        selectionCtx.restore();

        if (selectionTextureRef.current) {
          selectionTextureRef.current.needsUpdate = true;
        }
      }
    }
  };

  // Function to move selection
  const moveSelection = (point: Vector2) => {
    if (
      !canvasRef.current ||
      !selectionData ||
      !selectionStart ||
      !selectionEnd ||
      !selectionOffset ||
      !selectionCanvasRef.current
    )
      return;
    const ctx = canvasRef.current.getContext("2d");
    const selectionCtx = selectionCanvasRef.current.getContext("2d");
    if (!ctx || !selectionCtx) return;

    // Calculate the new position
    const newX = point.x - selectionOffset.x;
    const newY = point.y - selectionOffset.y;

    // Clear the selection canvas
    selectionCtx.clearRect(
      0,
      0,
      selectionCanvasRef.current.width,
      selectionCanvasRef.current.height
    );

    // Draw the selection at the new position on the selection canvas
    selectionCtx.putImageData(selectionData, newX, newY);

    // Draw selection rectangle
    selectionCtx.save();
    selectionCtx.strokeStyle = "#000";
    selectionCtx.lineWidth = 1;
    selectionCtx.setLineDash([5, 3]); // Dashed line

    const width = Math.abs(selectionEnd.x - selectionStart.x);
    const height = Math.abs(selectionEnd.y - selectionStart.y);
    selectionCtx.strokeRect(newX, newY, width, height);
    selectionCtx.restore();

    // Update selection coordinates
    setSelectionStart(new Vector2(newX, newY));
    setSelectionEnd(new Vector2(newX + width, newY + height));

    if (selectionTextureRef.current) {
      selectionTextureRef.current.needsUpdate = true;
    }
  };

  // Function to finalize selection
  const finalizeSelection = () => {
    if (
      !canvasRef.current ||
      !selectionCanvasRef.current ||
      !selectionData ||
      !selectionStart
    )
      return;

    const ctx = canvasRef.current.getContext("2d");
    const selectionCtx = selectionCanvasRef.current.getContext("2d");
    if (!ctx || !selectionCtx) return;

    // Create a temporary canvas to process the selection data
    const tempCanvas = document.createElement("canvas");
    tempCanvas.width = selectionData.width;
    tempCanvas.height = selectionData.height;
    const tempCtx = tempCanvas.getContext("2d");

    if (tempCtx) {
      // Put the selection data on the temp canvas
      tempCtx.putImageData(selectionData, 0, 0);

      // Apply the selection to the main canvas using 'source-over' to only add non-transparent pixels
      ctx.save();
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(tempCanvas, selectionStart.x, selectionStart.y);
      ctx.restore();
    }

    // Clear the selection canvas
    selectionCtx.clearRect(
      0,
      0,
      selectionCanvasRef.current.width,
      selectionCanvasRef.current.height
    );

    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }

    if (selectionTextureRef.current) {
      selectionTextureRef.current.needsUpdate = true;
    }

    // Reset selection state
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionData(null);
    setSelectionOffset(null);
    setIsSelecting(false);
    setIsMovingSelection(false);
    originalCanvasState.current = null;

    // Save to localStorage after moving selection
    saveMapToLocalStorage();
  };

  // Handle pointer down to start drawing
  const handlePointerDown = (e: any) => {
    if (!isMapUp || !mapRef.current) return; // Only allow drawing when map is up

    if (e.button === 0) {
      // Left click
      e.stopPropagation(); // Prevent other handlers from firing
      console.log("Left click detected on map"); // Debug log

      const point = getCanvasPoint(e);
      if (point) {
        if (currentTool === "select") {
          // If we already have a selection and clicked inside it, start moving it
          if (selectionStart && selectionEnd && selectionData) {
            const x = Math.min(selectionStart.x, selectionEnd.x);
            const y = Math.min(selectionStart.y, selectionEnd.y);
            const width = Math.abs(selectionEnd.x - selectionStart.x);
            const height = Math.abs(selectionEnd.y - selectionStart.y);

            if (
              point.x >= x &&
              point.x <= x + width &&
              point.y >= y &&
              point.y <= y + height
            ) {
              setIsMovingSelection(true);
              setSelectionOffset(new Vector2(point.x - x, point.y - y));
              return;
            } else {
              // If clicked outside the selection, finalize the current selection
              // and start a new one
              finalizeSelection();
            }
          }

          // Start a new selection
          if (canvasRef.current) {
            const ctx = canvasRef.current.getContext("2d");
            if (ctx) {
              // Store the original canvas state before starting selection
              originalCanvasState.current = ctx.getImageData(
                0,
                0,
                canvasRef.current.width,
                canvasRef.current.height
              );
            }
          }

          setSelectionStart(point);
          setSelectionEnd(point);
          setIsSelecting(true);
          setSelectionData(null);
        } else {
          // Regular drawing with pen or eraser
          // If there's an active selection, finalize it first
          if (selectionData) {
            finalizeSelection();
          }

          setIsDrawing(true);
          lastPoint.current = point;
          drawPoint(point);
        }
      }
    }
  };

  // Handle pointer move to continue drawing
  const handlePointerMove = (e: any) => {
    if (!isMapUp) return;

    e.stopPropagation(); // Prevent other handlers from firing

    const currentPoint = getCanvasPoint(e);
    if (currentPoint) {
      if (currentTool === "select") {
        if (isSelecting && selectionStart) {
          // Update selection end point
          setSelectionEnd(currentPoint);
          drawSelectionRect();
        } else if (isMovingSelection && selectionData) {
          // Move the selection
          moveSelection(currentPoint);
        }
      } else if (isDrawing && lastPoint.current) {
        // Regular drawing with pen or eraser
        drawLine(lastPoint.current, currentPoint);
        lastPoint.current = currentPoint;
      }
    }
  };

  // Handle pointer up to stop drawing
  const handlePointerUp = (e: any) => {
    if (!isMapUp) return;

    e.stopPropagation(); // Prevent other handlers from firing

    if (currentTool === "select") {
      if (isSelecting && selectionStart && selectionEnd) {
        // Only capture selection if the area is large enough
        const width = Math.abs(selectionEnd.x - selectionStart.x);
        const height = Math.abs(selectionEnd.y - selectionStart.y);

        if (width > 5 && height > 5) {
          // Finalize the selection
          captureSelectionData();
          setIsSelecting(false);
        } else {
          // If selection is too small, cancel it
          setIsSelecting(false);
          setSelectionStart(null);
          setSelectionEnd(null);

          // Clear selection canvas
          if (selectionCanvasRef.current) {
            const ctx = selectionCanvasRef.current.getContext("2d");
            if (ctx) {
              ctx.clearRect(
                0,
                0,
                selectionCanvasRef.current.width,
                selectionCanvasRef.current.height
              );
              if (selectionTextureRef.current) {
                selectionTextureRef.current.needsUpdate = true;
              }
            }
          }
        }
      } else if (isMovingSelection) {
        // Don't finalize the move, just stop moving
        setIsMovingSelection(false);
      }
    } else {
      // Regular drawing with pen or eraser
      setIsDrawing(false);
      lastPoint.current = null;
    }
  };

  // Debug function to clear the canvas
  const clearCanvas = () => {
    if (!canvasRef.current || !selectionCanvasRef.current) return;
    const ctx = canvasRef.current.getContext("2d");
    const selectionCtx = selectionCanvasRef.current.getContext("2d");
    if (!ctx || !selectionCtx) return;

    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    ctx.fillStyle = "rgba(0, 0, 0, 0)";
    ctx.fillRect(0, 0, canvasRef.current.width, canvasRef.current.height);

    selectionCtx.clearRect(
      0,
      0,
      selectionCanvasRef.current.width,
      selectionCanvasRef.current.height
    );

    if (drawingTextureRef.current) {
      drawingTextureRef.current.needsUpdate = true;
    }

    if (selectionTextureRef.current) {
      selectionTextureRef.current.needsUpdate = true;
    }

    // Clear localStorage when canvas is cleared
    localStorage.removeItem(MAP_STORAGE_KEY);

    // Clear selection state
    setSelectionStart(null);
    setSelectionEnd(null);
    setSelectionData(null);
    setIsSelecting(false);
    setIsMovingSelection(false);
    originalCanvasState.current = null;
  };

  // Toggle between pen and eraser
  const toggleTool = () => {
    setCurrentTool((prev) => {
      if (prev === "pen") return "eraser";
      if (prev === "eraser") return "select";
      return "pen";
    });

    // Don't clear selection state when changing tools
    // This allows the selection to persist when switching tools
  };

  // Add a key handler to clear the canvas with 'C' key and toggle tool with 'T' key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isMapUp) {
        if (e.key.toLowerCase() === "c") {
          clearCanvas();
        } else if (e.key.toLowerCase() === "t") {
          toggleTool();
        } else if (e.key === "Escape" && selectionData) {
          // Cancel selection on Escape key
          finalizeSelection();
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMapUp, selectionData]);

  // Store original values when the component mounts or props change
  useEffect(() => {
    if (!isMapUp && mapRef.current) {
      originalPosition.current.set(position[0], position[1], position[2]);
      originalRotation.current = [...rotation];
    }
  }, [position, rotation, isMapUp]);

  return (
    <RigidBody type="fixed">
      {isMapUp ? (
        // When map is up, use Billboard to face camera
        <Billboard
          follow={true}
          lockX={false}
          lockY={false}
          lockZ={false}
        >
          <mesh
            ref={mapRef}
            position={position}
            scale={scale}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
          >
            <planeGeometry args={[0.5, 0.4]} />
            {materialRef.current && (
              <primitive object={materialRef.current} attach="material" />
            )}

            {/* HUD for map tools */}
            <group position={[0, -0.13, 0.01]}>
              <Html
                transform
                distanceFactor={0.15}
                position={[0, 0, 0]}
                style={{
                  width: "400px",
                  display: "flex",
                  justifyContent: "center",
                  pointerEvents: "none",
                }}
              >
                <div
                  style={{
                    padding: "5px 10px",
                    borderRadius: "5px",
                    display: "flex",
                    gap: "8px",
                    alignItems: "center",
                    pointerEvents: "auto",
                  }}
                >
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTool("pen");
                    }}
                    style={{
                      width: "64px",
                      height: "64px",
                      border:
                        currentTool === "pen"
                          ? "2px solid #f0d6a6"
                          : "2px solid transparent",
                      borderRadius: "3px",
                      cursor: "pointer",
                      overflow: "hidden",
                      position: "relative",
                    }}
                  >
                    <img
                      src={toolTextures.pen.image.src}
                      alt="Pen tool"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTool("eraser");
                    }}
                    style={{
                      width: "64px",
                      height: "64px",
                      border:
                        currentTool === "eraser"
                          ? "2px solid #f0d6a6"
                          : "2px solid transparent",
                      borderRadius: "3px",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={toolTextures.eraser.image.src}
                      alt="Eraser tool"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      setCurrentTool("select");
                    }}
                    style={{
                      width: "64px",
                      height: "64px",
                      border:
                        currentTool === "select"
                          ? "2px solid #f0d6a6"
                          : "2px solid transparent",
                      borderRadius: "3px",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={toolTextures.select.image.src}
                      alt="Selection tool"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                  <div
                    onClick={(e) => {
                      e.stopPropagation();
                      clearCanvas();
                    }}
                    style={{
                      width: "64px",
                      height: "64px",
                      border: "2px solid transparent",
                      borderRadius: "3px",
                      cursor: "pointer",
                      overflow: "hidden",
                    }}
                  >
                    <img
                      src={toolTextures.clear.image.src}
                      alt="Clear canvas"
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  </div>
                </div>
              </Html>
            </group>
          </mesh>
        </Billboard>
      ) : (
        // When map is down, use regular mesh with original rotation
        <mesh
          ref={mapRef}
          position={position}
          rotation={rotation}
          scale={scale}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <planeGeometry args={[0.5, 0.4]} />
          {materialRef.current && (
            <primitive 
              object={materialRef.current} 
              attach="material"
              roughness={1}
              metalness={0}
            />
          )}
        </mesh>
      )}
    </RigidBody>
  );
};
