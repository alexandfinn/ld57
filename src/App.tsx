import { Canvas } from "@react-three/fiber";
import { Player } from "./components/Player";
import { 
  Environment, 
  Grid, 
  OrbitControls, 
  PerspectiveCamera, 
  Box 
} from "@react-three/drei";

export const App = () => {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Canvas>
        <PerspectiveCamera
          makeDefault
          position={[0, 1.7, 0]}
          fov={75}
          near={0.1}
          far={1000}
        />
        
        <ambientLight intensity={1.5} />
        <directionalLight position={[10, 10, 5]} intensity={2} />
        <directionalLight position={[-10, -10, -5]} intensity={1} />
        
        {/* Environment for better lighting */}
        <Environment preset="sunset" />
        
        {/* Grid for better spatial reference */}
        <Grid
          args={[20, 20]}
          position={[0, -0.5, 0]}
          cellSize={1}
          cellThickness={0.5}
          cellColor="#6f6f6f"
          sectionSize={5}
          sectionThickness={1}
          sectionColor="#9d4b4b"
          fadeDistance={30}
          fadeStrength={1}
          followCamera={false}
        />
        
        {/* Reference cube using drei's Box */}
        <Box position={[0, 0.5, -5]} args={[1, 1, 1]}>
          <meshStandardMaterial color="red" />
        </Box>
        
        <Player />
      </Canvas>
    </div>
  );
};
