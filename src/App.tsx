import { Environment, PerspectiveCamera, Stats } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Physics } from "@react-three/rapier";
import { Player } from "./components/Player";
import { Room } from "./components/World/Room";

const DEBUG = false;

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

        <Environment preset="night" />

        {!DEBUG && <fog attach="fog" args={["#000000", 5, 15]} />}

        <Physics debug={DEBUG}>
          <Room />
          <Player />
        </Physics>

        {DEBUG && <Stats className="stats" />}
      </Canvas>
    </div>
  );
};
