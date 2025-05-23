import { useState } from "react";
import { useData } from "./WeatherContext";

interface RealTimePanelModalProps{
    open: boolean
}

export default function RealTimePanelModal({ open }: RealTimePanelModalProps) {
    if (!open) return null;

    const { data, loading, error } = useData()

    if(!data)
    {
        return null;
    }
    
    const { temperature_2m, wind_speed_10m, wind_direction_10m, time } = data.current
    const temperatureUnit = data.currentUnits.temperature_2m
    const windSpeedUnit = data.currentUnits.wind_speed_10m

    // const [windSpeed, setWindSpeed] = useState<number>(params.windSpeed);
    // const [cylinderDiameter, setCylinderDiameter] = useState<number>(params.cylinderDiameter);

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
                  Real Time Parameters
                </h3>
              </div>

              {/* Modal body */}
              <div className="p-4 md:p-5 space-y-4 leading-relaxed">
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300">
                  Wind Speed: {wind_speed_10m} {windSpeedUnit}
                </p>
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300">
                  Wind Direction: {degToCompass(wind_direction_10m)}
                </p>
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300">
                  Temperature: {temperature_2m} {temperatureUnit}
                </p>
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300">
                  Last Updated: {time.replace("T", " ")}
                </p>
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300">
                  Here are the real time parameters that are currently driving the simulation.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}

function degToCompass(num:number) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}