import { Environment, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Player } from "./components/Player";
import { Level } from "./components/Level";
import { BackgroundMusic } from "./components/BackgroundMusic";
import { TriggerText } from "./components/TriggerText";
import { TriggerList } from "./components/TriggerList";
import { useState, useEffect, useRef } from "react";
import { Vector3 } from "three";

const DEBUG = false;

export const App = () => {
  const [hasStarted, setHasStarted] = useState(false);
  const playerPositionRef = useRef(new Vector3());
  const [triggerText, setTriggerText] = useState<string | null>(null);
  const [triggeredTriggers, setTriggeredTriggers] = useState<string[]>([]);

  const handleStart = () => {
    setHasStarted(true);
  };

  const handleTrigger = (name: string) => {
    console.log("Trigger:", name);
    setTriggerText(name);
    setTriggeredTriggers((prev) => {
      if (!prev.includes(name)) {
        return [...prev, name];
      }
      return prev;
    });
  };

  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <BackgroundMusic hasStarted={hasStarted} />
      <Canvas shadows>
        <fog attach="fog" args={["#000000", 5, 60]} />

        <Physics debug={DEBUG}>
          <Level onTrigger={handleTrigger} />
          <Player hasStarted={hasStarted} playerPositionRef={playerPositionRef} />
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
          <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            Dungeon Cartographer
          </h1>
          <p style={{ fontSize: "1.5rem", marginBottom: "2rem" }}>
            Click anywhere to start
          </p>
          <div style={{ fontSize: "1rem", textAlign: "center", maxWidth: "600px" }}>
            <p>Use WASD to move, SPACE to jump, and M to toggle the map.</p>
            <p>Click to lock your mouse and begin exploring the dungeon.</p>
          </div>
        </div>
      )}
    </div>
  );
};
