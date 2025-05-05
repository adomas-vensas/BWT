import NavigationBarButton from "./NavigationBarButton"
import simulation from "../assets/NavigationBar/simulation.png"
import realTime from "../assets/NavigationBar/real_time.png"
import React, { useState } from 'react'

enum NavigationOption {
    RealTime   = "Real Time",
    Simulation = "Simulation",
}


export default function NavigationBar(){
    const [selected, setSelected] = useState<NavigationOption>(NavigationOption.RealTime)

    return (
        <div className="px-7 bg-white shadow-lg rounded-2xl mb-5">
            <div className="flex">
                <NavigationBarButton
                    title={NavigationOption.RealTime}
                    logoPath={realTime}
                    active={selected == NavigationOption.RealTime}
                    onClick={() => setSelected(NavigationOption.RealTime)}
                /> 
                <NavigationBarButton
                    title={NavigationOption.Simulation}
                    logoPath={simulation}
                    active={selected == NavigationOption.Simulation}
                    onClick={() => setSelected(NavigationOption.Simulation)}
                /> 
            </div>
        </div>
    )
}