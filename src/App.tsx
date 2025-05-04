import { Canvas, useFrame, useThree } from "@react-three/fiber"
import Scene from './Scene'

function App() {
  return (
    <Canvas
      className="position: fixed top-0 left-0"
      onCreated={({ gl }) => {
        gl.setPixelRatio(window.devicePixelRatio)
        gl.setSize(window.innerWidth, window.innerHeight)
      }}
      camera={{ position: [0, 30, 0], up: [1, 0, 0], near: 0.1, far: 1000 }}>
      <Scene />
    </Canvas>
  )
}

export default App
