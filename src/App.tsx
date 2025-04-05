import { Canvas } from "@react-three/fiber";
import { Player } from "./components/Player";
import { Room } from "./components/Room";
import {
  Environment,
  Grid,
  OrbitControls,
  PerspectiveCamera,
  Box,
  Stats,
} from "@react-three/drei";
import { Torch } from "./components/Torch";

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

        {/* Reduced ambient light intensity for darker atmosphere */}
        {/* <ambientLight intensity={0.2} /> */}

        <Torch position={[0, 1, 0]} />

        {/* Changed environment preset to night for darker atmosphere */}
        <Environment preset="night" />

        {/* Add fog to limit visibility */}
        <fog attach="fog" args={['#000000', 5, 15]} />

        {/* Room component */}
        <Room width={20} length={20} height={6} />

        <Player />

        {/* FPS Counter */}
        <Stats className="stats" />
      </Canvas>
    </div>
  );
};
