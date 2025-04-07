import { Environment, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Player } from "./components/Player";
import { Level } from "./components/Level";

const DEBUG = false;

export const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows>
        <Environment preset="night" />
        <ambientLight intensity={1} color="#404040" />
        <fog attach="fog" args={["#000000", 5, 60]} />

        <Physics debug={DEBUG}>
          <Level />
          <Player />
        </Physics>

        {DEBUG && <Stats className="stats" />}
      </Canvas>
    </div>
  );
};
