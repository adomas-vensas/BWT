import { useState } from 'react'
import { Canvas } from "@react-three/fiber"
import Scene from './Scene'
import { WeatherContext } from './Panels/RealTime/WeatherContext'
import NavigationBar from "./NavigationBar/NavigationBar"
import { NavigationOption } from "./NavigationBar/NavigationOption"
import SimulationPanelModal from './Panels/Simulation/SimulationPanelModal'
import RealTimePanelModal from './Panels/RealTime/RealTimePanelModal'
import { SimulationParamsRequest } from './API/SimulationParamsRequest'
import { calculateDLattice, calculateULattice, calculateResolutions, dMaxPhysical, uMaxPhysical } from './utilities/constraints'
import AboutPanelModal from './Panels/About/AboutPanelModal'

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
        camera={{ position: [-5, 5, -5], up: [0, 1, 0], near: 0.1, far: 1000 }}>
          <Scene params={params} />
      </Canvas>

      {/* <Stats className='aboslute bottom-3 right-3 z-20' /> */}
        
      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 z-10">
        <NavigationBar selected={selected} onSelect={opt => {
          const select = opt == selected ? NavigationOption.None : opt;
          setSelected(select)
        }} />
      </div>
      
      <WeatherContext>
        <RealTimePanelModal open={selected == NavigationOption.RealTime}/>
      </WeatherContext>


      <SimulationPanelModal
        open={selected == NavigationOption.Simulation}
        onChange={(newParams) => {
          setParams(newParams);
        }}
        params={params}
      />

      <AboutPanelModal open={selected == NavigationOption.About}/>

    </div>
  )
}

export default App
