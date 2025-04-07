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
import { useState, useEffect, useRef } from "react";
import { Vector3 } from "three";

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

  useEffect(() => {
    // Play paper sound when component mounts
    setShowPaperSound(true);
  }, []);

  const handleStart = () => {
    setDismissPaperSound(true);
    // Wait for the paper sound to finish before starting
    setTimeout(() => {
      setHasStarted(true);
    }, 500); // Adjust this timing based on your paper sound duration
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
      <Canvas shadows>
        <fog attach="fog" args={["#000000", 5, 60]} />

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

        {DEBUG && <Stats className="stats" />}
      </Canvas>

      {/* Trigger text overlay */}
      <TriggerText text={triggerText} />

      {/* Trigger list overlay */}
      <TriggerList triggeredTriggers={triggeredTriggers} />

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
