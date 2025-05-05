import React, { useState } from 'react'
import { Canvas } from "@react-three/fiber"
import Scene from './Scene'
import { WeatherContext } from './widgets/WeatherContext'
import WeatherWidget from './widgets/WeatherWidget'
import NavigationBar from "./NavigationBar/NavigationBar"
import { NavigationOption } from "./NavigationBar/NavigationOption"
import SimulationPanelModal from './Panels/SimulationPanelModal'
// import { Stats } from '@react-three/drei'

function App() {

  const [selected, setSelected] = useState<NavigationOption>(NavigationOption.RealTime)

  return (
    <div>
      <Canvas
        className="position: fixed top-0 left-0"
        onCreated={({ gl }) => {
          gl.setPixelRatio(window.devicePixelRatio)
          gl.setSize(window.innerWidth, window.innerHeight)
        }}
        camera={{ position: [0, 30, 0], up: [1, 0, 0], near: 0.1, far: 1000 }}>
          <Scene />
      </Canvas>

      {/* <Stats className='aboslute bottom-3 right-3 z-20' /> */}
        
      <WeatherContext>
        <div className="absolute top-3 left-3 z-10">
          <WeatherWidget />
        </div>
      </WeatherContext>
      
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
        <NavigationBar selected={selected} onSelect={opt => setSelected(opt)} />
      </div>
      
      <SimulationPanelModal
        open={selected == NavigationOption.Simulation}
      />

    </div>
  )
}

export default App
