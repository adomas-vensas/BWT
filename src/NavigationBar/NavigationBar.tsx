import NavigationBarButton from "./NavigationBarButton"
import simulation from "../assets/NavigationBar/simulation.png"
import realTime from "../assets/NavigationBar/real_time.png"
import about from "../assets/NavigationBar/about.png"
import { NavigationOption } from './NavigationOption'


interface NavigationBarProps {
    selected: NavigationOption
    onSelect: (opt: NavigationOption) => void
}

export default function NavigationBar({ selected, onSelect} : NavigationBarProps){
    return (
        <div>

            <div className="px-7 bg-white shadow-lg rounded-2xl mb-5">
                <div className="flex">
                    <NavigationBarButton
                        title={NavigationOption.RealTime}
                        logoPath={realTime}
                        active={selected == NavigationOption.RealTime}
                        onClick={() => onSelect(NavigationOption.RealTime)}
                        /> 
                    <NavigationBarButton
                        title={NavigationOption.Simulation}
                        logoPath={simulation}
                        active={selected == NavigationOption.Simulation}
                        onClick={() => onSelect(NavigationOption.Simulation)}
                        />
                    <NavigationBarButton
                        title={NavigationOption.About}
                        logoPath={about}
                        active={selected == NavigationOption.About}
                        onClick={() => onSelect(NavigationOption.About)}
                        /> 
                </div>
            </div>
        </div>
    )
}