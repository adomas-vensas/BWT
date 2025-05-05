import NavigationBarButton from "./NavigationBarButton"
import simulation from "../assets/NavigationBar/simulation.png"
import realTime from "../assets/NavigationBar/real_time.png"


export default function NavigationBar(){
    return (
        <div className="px-7 bg-white shadow-lg rounded-2xl mb-5">
            <div className="flex">
                <NavigationBarButton title="Real Time" logoPath={realTime} /> 
                <NavigationBarButton title="Simulation" logoPath={simulation}/> 
                {/* <NavigationBarButton title="Explore"/>
                <NavigationBarButton title="About"/>  */}
            </div>
        </div>
    )
}