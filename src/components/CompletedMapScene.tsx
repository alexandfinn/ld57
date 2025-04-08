import { useEffect, useState, useRef } from "react";
import { useTexture } from "@react-three/drei";
import { Html } from "@react-three/drei";
import { Vector3, TextureLoader, CanvasTexture } from "three";
import { useThree } from "@react-three/fiber";

interface CompletedMapSceneProps {
  isVisible: boolean;
  onRestart: () => void;
}

export const CompletedMapScene = ({
  isVisible,
  onRestart,
}: CompletedMapSceneProps) => {
  const [mapData, setMapData] = useState<string | null>(null);
  const { camera } = useThree();
  const mapCanvasRef = useRef<HTMLCanvasElement | null>(null);

  // Load the map texture
  const mapTexture = useTexture("/textures/map.png");

  // Load the completed map data from localStorage and adjust camera
  useEffect(() => {
    if (isVisible) {
      // Force release pointer lock with multiple approaches
      if (document.pointerLockElement) {
        document.exitPointerLock();
      }

      // Set cursor style to visible
      document.body.style.cursor = "auto";

      const savedMapData = localStorage.getItem("dungeon-map-drawing-data");
      setMapData(savedMapData);

      // Position camera to view the map
      camera.position.set(0, 0, 20);
      camera.lookAt(0, 0, 0);

      // Create a canvas for combining textures
      const canvas = document.createElement("canvas");
      canvas.width = 1024;
      canvas.height = 1024;
      mapCanvasRef.current = canvas;
    }
  }, [isVisible, camera]);

  // Function to download the combined map
  const downloadMap = () => {
    if (!mapCanvasRef.current) return;

    const ctx = mapCanvasRef.current.getContext("2d");
    if (!ctx) return;

    // Clear the canvas
    ctx.clearRect(
      0,
      0,
      mapCanvasRef.current.width,
      mapCanvasRef.current.height
    );

    // Draw the base map texture
    const mapImage = new Image();
    mapImage.src = "/textures/map.png";

    mapImage.onload = () => {
      // Draw the base map
      if (!mapCanvasRef.current) return;
      ctx.drawImage(
        mapImage,
        0,
        0,
        mapCanvasRef.current.width,
        mapCanvasRef.current.height
      );

      // If there's player drawing data, overlay it
      if (mapData) {
        const drawingImage = new Image();
        drawingImage.src = mapData;

        drawingImage.onload = () => {
          // Draw the player's drawings with transparency
          if (!mapCanvasRef.current) return;
          ctx.globalAlpha = 0.8;
          ctx.drawImage(
            drawingImage,
            0,
            0,
            mapCanvasRef.current.width,
            mapCanvasRef.current.height
          );

          // Reset alpha
          ctx.globalAlpha = 1.0;

          // Create download link
          if (!mapCanvasRef.current) return;
          const link = document.createElement("a");
          link.href = mapCanvasRef.current.toDataURL("image/png");
          link.download = "dungeon-map.png";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
        };
      } else {
        // If no drawing data, just download the base map
        if (!mapCanvasRef.current) return;
        const link = document.createElement("a");
        link.href = mapCanvasRef.current.toDataURL("image/png");
        link.download = "dungeon-map.png";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    };
  };

  if (!isVisible) return null;

  return (
    <group position={[0, 0, 0]}>
      {/* Background */}

      {/* Map display */}
      <group position={[0, 0, 0]}>
        {/* Base map texture */}
        <mesh>
          <planeGeometry args={[15, 12]} />
          <meshBasicMaterial
            map={mapTexture}
            transparent
            opacity={1}
            side={2}
          />
        </mesh>

        {/* Player's drawings overlay */}
        {mapData && (
          <mesh position={[0, 0, 0.01]}>
            <planeGeometry args={[15, 12]} />
            <meshBasicMaterial
              map={new TextureLoader().load(mapData)}
              transparent
              opacity={0.8}
              side={2}
            />
          </mesh>
        )}

        {/* Background plane */}
        <mesh position={[0, 0, -0.1]}>
          <planeGeometry args={[20, 20]} />
          <meshBasicMaterial
            color="#1a1a1a"
            transparent
            opacity={0.8}
            side={2}
          />
        </mesh>
      </group>

      {/* Completion message */}
      <Html position={[0, 8, 0]} center>
        <div
          style={{
            color: "#f4e0b6",
            fontSize: "2.5rem",
            fontFamily: "'MedievalSharp', cursive",
            textAlign: "center",
            background: "rgba(0,0,0,0.7)",
            padding: "2rem 3rem",
            borderRadius: "1rem",
            maxWidth: "800px",
            boxShadow: "0 0 20px rgba(0,0,0,0.5)",
            marginBottom: "8rem",
            border: "2px solid #654321",
          }}
        >
          <h1
            style={{
              fontSize: "3.5rem",
              marginBottom: "1rem",
              textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
            }}
          >
            Congratulations!
          </h1>
          <p
            style={{
              fontSize: "1.5rem",
              marginBottom: "1rem",
              textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
            }}
          >
            Share your masterpiece with fellow adventurers in the comments!
            We'll be selecting the Master Cartographer of the Jam!
          </p>
        </div>
      </Html>

      {/* Action buttons */}
      <Html position={[0, -8, 0]} center>
        <div
          style={{
            display: "flex",
            gap: "2rem",
            justifyContent: "center",
          }}
        >
          <button
            onClick={downloadMap}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.5rem",
              backgroundColor: "#654321",
              color: "#f4e0b6",
              border: "2px solid #8b6b43",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontFamily: "'MedievalSharp', cursive",
              boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
              transition: "all 0.3s",
              textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#8b6b43";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#654321";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Download Map
          </button>

          <button
            onClick={onRestart}
            style={{
              padding: "1rem 2rem",
              fontSize: "1.5rem",
              backgroundColor: "#4a4a4a",
              color: "#f4e0b6",
              border: "2px solid #6a6a6a",
              borderRadius: "0.5rem",
              cursor: "pointer",
              fontFamily: "'MedievalSharp', cursive",
              boxShadow: "0 4px 8px rgba(0,0,0,0.5)",
              transition: "all 0.3s",
              textShadow: "1px 1px 2px rgba(0,0,0,0.7)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = "#6a6a6a";
              e.currentTarget.style.transform = "translateY(-2px)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = "#4a4a4a";
              e.currentTarget.style.transform = "translateY(0)";
            }}
          >
            Restart Game
          </button>
        </div>
      </Html>
    </group>
  );
};
