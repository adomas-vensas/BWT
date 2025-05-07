import { useState } from 'react'
import { Canvas } from "@react-three/fiber"
import Scene from './Scene'
import { WeatherContext } from './widgets/WeatherContext'
import WeatherWidget from './widgets/WeatherWidget'
import NavigationBar from "./NavigationBar/NavigationBar"
import { NavigationOption } from "./NavigationBar/NavigationOption"
import SimulationPanelModal from './Panels/Simulation/SimulationPanelModal'
import { SimulationParamsRequest } from './API/SimulationParamsRequest'
import { calculateDLattice, calculateULattice, calculateResolutions, dMaxPhysical, uMaxPhysical } from './utilities/constraints'

function App() {

  const [selected, setSelected] = useState<NavigationOption>(NavigationOption.RealTime)

  const dPhysical = dMaxPhysical * 0.5;
  const d = calculateDLattice(dPhysical);
  const uPhysical = uMaxPhysical * 0.5;
  const u0 = calculateULattice(uPhysical);
  const [nx, ny] = calculateResolutions(d);

  // this is the single source of truth
  const [params, setParams] = useState<SimulationParamsRequest>({
    windSpeed: u0,
    cylinderDiameter: d,
    reynoldsNumber: 150,
    reducedVelocity: 5,
    massRatio: 10,
    dampingRatio: 0,
    nx,
    ny,
  });

  return (
    <div>
      <Canvas
        className="position: fixed top-0 left-0"
        onCreated={({ gl }) => {
          gl.setPixelRatio(window.devicePixelRatio)
          gl.setSize(window.innerWidth, window.innerHeight)
        }}
        camera={{ position: [0, 30, 0], up: [1, 0, 0], near: 0.1, far: 1000 }}>
          <Scene params={params} />
      </Canvas>

      {/* <Stats className='aboslute bottom-3 right-3 z-20' /> */}
        
      <WeatherContext>
        <div className="absolute top-3 left-3 z-10">
          <WeatherWidget />
        </div>
      </WeatherContext>
      
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
        <NavigationBar selected={selected} onSelect={opt => {
          const select = opt == selected ? NavigationOption.None : opt;
          setSelected(select)
        }} />
      </div>
      
      <SimulationPanelModal
        open={selected == NavigationOption.Simulation}
        onChange={(newParams) => {
          setParams(newParams);
        }}
        params={params}
      />

    </div>
  )
}

export default App
