import { Environment, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Player } from "./components/Player";
import { Level } from "./components/Level";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { SecretAudio } from "./components/SecretAudio";
import { TriggerText } from "./components/TriggerText";
import { TriggerList } from "./components/TriggerList";
import { PaperSound } from "./components/PaperSound";
import { CompletionMessage } from "./components/CompletionMessage";
import { CompletedMapScene } from "./components/CompletedMapScene";
import { useState, useEffect, useRef } from "react";
import { Vector3 } from "three";
import levelJson from "./level.json";

const DEBUG = false;

export const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const playerPositionRef = useRef(new Vector3());
  const [triggerText, setTriggerText] = useState<string | null>(null);
  const [triggeredTriggers, setTriggeredTriggers] = useState<string[]>([]);
  const [shouldPlaySecretAudio, setShouldPlaySecretAudio] = useState(false);
  const [currentTriggerName, setCurrentTriggerName] = useState<string | null>(
    null
  );
  const [showPaperSound, setShowPaperSound] = useState(true);
  const [dismissPaperSound, setDismissPaperSound] = useState(false);
  const [showCompletionMessage, setShowCompletionMessage] = useState(false);
  const [showCompletedMapScene, setShowCompletedMapScene] = useState(false);

  // Get unique trigger names from level.json
  const allUniqueTriggers = [
    ...new Set(
      levelJson.objects
        .filter((obj) => obj.type === "trigger")
        .map((obj) => obj.name)
    ),
  ];

  // Initial player position (same as in Player.tsx)
  const initialPlayerPosition = new Vector3(-5, 0.8, -35);

  useEffect(() => {
    // Play paper sound when component mounts
    setShowPaperSound(true);
  }, []);

  // Check if all unique triggers have been triggered
  useEffect(() => {
    const allTriggersTriggered = allUniqueTriggers.every(trigger => 
      triggeredTriggers.includes(trigger)
    );
    
    if (allTriggersTriggered && allUniqueTriggers.length > 0) {
      setShowCompletionMessage(true);
    }
  }, [triggeredTriggers, allUniqueTriggers]);

  // Check if player is near start position when completion message is shown
  useEffect(() => {
    if (showCompletionMessage) {
      const checkPlayerPosition = () => {
        const playerPos = playerPositionRef.current;
        const distance = playerPos.distanceTo(initialPlayerPosition);
        
        // If player is within 2 units of start position
        if (distance <= 2) {
          // Force release pointer lock with multiple approaches
          if (document.pointerLockElement) {
            document.exitPointerLock();
          }
          
          // Set cursor style to visible
          document.body.style.cursor = 'auto';
          
          setShowCompletedMapScene(true);
        }
      };
      
      // Check position every 500ms
      const intervalId = setInterval(checkPlayerPosition, 500);
      
      return () => clearInterval(intervalId);
    }
  }, [showCompletionMessage]);

  const handleStart = () => {
    setDismissPaperSound(true);
    // Wait for the paper sound to finish before starting
    setTimeout(() => {
      setHasStarted(true);
    }, 500); // Adjust this timing based on your paper sound duration
  };

  const handleRestart = () => {
    // Reset all game state
    setTriggeredTriggers([]);
    setShowCompletionMessage(false);
    setShowCompletedMapScene(false);
    setTriggerText(null);
    setCurrentTriggerName(null);
    setShouldPlaySecretAudio(false);
    
    // Reset player position
    if (playerPositionRef.current) {
      playerPositionRef.current.copy(initialPlayerPosition);
    }
  };

  const handleTrigger = (name: string, isFirstTrigger: boolean) => {
    console.log("Trigger:", name, "isFirstTrigger:", isFirstTrigger);

    // Update triggered triggers list
    setTriggeredTriggers((prev) => {
      if (!prev.includes(name)) {
        return [...prev, name];
      }
      return prev;
    });

    // Play secret audio for subsequent triggers
    if (isFirstTrigger) {
      setShouldPlaySecretAudio(true);
      setCurrentTriggerName(name);
      setTriggerText(name);
    }
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <BackgroundMusic hasStarted={hasStarted} />
      <SecretAudio
        shouldPlay={shouldPlaySecretAudio}
        triggerName={currentTriggerName}
      />
      <PaperSound shouldPlay={showPaperSound} />
      <PaperSound shouldPlay={dismissPaperSound} />
      <ambientLight intensity={1} />
      <Canvas shadows>
        <fog attach="fog" args={["#000000", 5, 60]} />

        {showCompletedMapScene ? (
          <CompletedMapScene 
            isVisible={showCompletedMapScene} 
            onRestart={handleRestart}
          />
        ) : (
          <Physics debug={DEBUG}>
            <Level
              onTrigger={handleTrigger}
              triggeredTriggers={triggeredTriggers}
            />
            <Player
              hasStarted={hasStarted}
              playerPositionRef={playerPositionRef}
            />
          </Physics>
        )}

        {DEBUG && <Stats className="stats" />}
      </Canvas>

      {/* Trigger text overlay */}
      <TriggerText text={triggerText} />

      {/* Trigger list overlay */}
      <TriggerList triggeredTriggers={triggeredTriggers} />

      {/* Completion message */}
      <CompletionMessage isVisible={showCompletionMessage && !showCompletedMapScene} />

      {!hasStarted && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            backgroundColor: "rgba(0, 0, 0, 0.7)",
            color: "white",
            zIndex: 1000,
            cursor: "pointer",
          }}
          onClick={handleStart}
        >
          <div
            style={{
              backgroundImage: "url('/textures/map.png')",
              backgroundSize: "cover",
              backgroundPosition: "center",
              padding: "3rem",
              borderRadius: "15px",
              maxWidth: "1200px",
              width: "90%",
              position: "relative",
              boxShadow: "0 0 30px rgba(0,0,0,0.5)",
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: "4.5rem",
                  marginBottom: "1.5rem",
                  color: "#f4e0b6",
                  fontFamily: "'MedievalSharp', cursive",
                  textAlign: "center",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                }}
              >
                Cartographer's Guild Mission
              </h1>
              <div
                style={{
                  fontSize: "1.8rem",
                  lineHeight: "1.8",
                  color: "#f4e0b6",
                  fontFamily: "'MedievalSharp', cursive",
                  marginBottom: "3rem",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                }}
              >
                <p style={{ marginBottom: "1.5rem" }}>
                  Greetings, brave cartographer. The Guild has received reports
                  of an ancient dungeon that requires mapping. Your task is to
                  explore and document its depths.
                </p>
                <p style={{ marginBottom: "1.5rem" }}>
                  Use your map wisely - press M to view it, and document your
                  findings as you discover new areas. The Guild has provided you
                  with a torch to light your way.
                </p>
                <p style={{ marginBottom: "1.5rem" }}>Controls:</p>
                <ul style={{ listStyle: "none", padding: "0" }}>
                  <li>WASD - Move through the dungeon</li>
                  <li>M - Toggle map view</li>
                  <li>Mouse - Look around</li>
                </ul>
              </div>
              <p
                style={{
                  fontSize: "2.25rem",
                  textAlign: "center",
                  color: "#f4e0b6",
                  fontFamily: "'MedievalSharp', cursive",
                  cursor: "pointer",
                  textShadow: "2px 2px 4px rgba(0,0,0,0.7)",
                  marginTop: "3rem",
                }}
              >
                Click to accept the mission
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
