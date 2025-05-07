import RangeSlider from "../Shared/RangeSlider";
import { useState, useEffect } from "react";
import { SimulationParamsRequest } from "../../API/SimulationParamsRequest";
import { calculateDLattice, calculateULattice, calculateResolutions, dMaxPhysical, uMaxPhysical } from '../../utilities/constraints'

interface SimulationPanelModalProps {
    open: boolean
    onChange: (params: SimulationParamsRequest) => void;
    params: SimulationParamsRequest
}


export default function SimulationPanelModal({ open, onChange, params }: SimulationPanelModalProps) {
    if (!open) return null;

    const [windSpeed, setWindSpeed] = useState<number>(params.windSpeed);
    const [cylinderDiameter, setCylinderDiameter] = useState<number>(params.cylinderDiameter);

    const handleSend = async () => {
      const d = calculateDLattice(cylinderDiameter)
      const u0 = calculateULattice(windSpeed)
      const [nx, ny] = calculateResolutions(d)
  
      const params: SimulationParamsRequest = {
          windSpeed: u0,
          cylinderDiameter: d,
          reynoldsNumber: 150,
          reducedVelocity: 5,
          massRatio: 10,
          dampingRatio: 0,
          nx: nx,
          ny: ny
      }

      onChange(params);
    };

    return (
      <div
        aria-hidden="false"
        className="fixed top-4 bottom-4 right-1 z-40 flex justify-end pointer-events-auto"
      >
        {/* Outer wrapper with margins */}
        <div className="mt-2 mb-4 mr-4 h-[calc(100%-2rem)] w-full max-w-md">
          {/* Modal content */}
          <div className="h-11/12 bg-white rounded-lg shadow-xl overflow-y-auto relative">
            <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700 h-full">

              {/* Modal header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Simulation Parameters
                </h3>
              </div>

              {/* Modal body */}
              <div className="p-4 md:p-5 space-y-4 leading-relaxed">
                  <RangeSlider propertyName="Wind Speed" onChange={setWindSpeed} min={0.1} max={uMaxPhysical} initialValue={uMaxPhysical * 0.5} step={0.1} unit="m/s"/>
                  <RangeSlider propertyName="Cylinder Diameter" onChange={setCylinderDiameter} min={0.1} max={dMaxPhysical} initialValue={dMaxPhysical * 0.5} step={0.1} unit="m"/>
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Maxime, libero!
                </p>
              </div>

              <button className="bg-amber-50 rounded-lg ml-2" onClick={handleSend}>Send data</button>
            </div>
          </div>
        </div>
      </div>
    );
  }
  