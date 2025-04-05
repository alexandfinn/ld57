import { Environment, PerspectiveCamera, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Player } from "./components/Player";
import { Room } from "./components/World/Room";
import { Torch } from "./components/Torch";

const DEBUG = true;

export const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas shadows>
        <PerspectiveCamera
          makeDefault
          position={[0, 2, 5]}
          fov={75}
          near={0.1}
          far={15}
        />

        {DEBUG && <ambientLight intensity={2} />}

        <Torch position={[0, 1, 0]} />

        <Environment preset="night" />

        {!DEBUG && <fog attach="fog" args={["#000000", 5, 15]} />}

        <Room />

        <Player />

        {DEBUG && <Stats className="stats" />}
      </Canvas>
    </div>
  );
};
