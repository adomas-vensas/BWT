import { useData } from './WeatherContext'


export default function WeatherWidget(){
    const { data, loading, error } = useData()

    if(!data)
    {
        return null;
    }

    const { temperature_2m, wind_speed_10m, wind_direction_10m } = data.current
    const temperatureUnit = data.currentUnits.temperature_2m
    const windSpeedUnit = data.currentUnits.wind_speed_10m

    return (
        <div className="bg-white/60 p-3 rounded shadow-lg text-sm space-y-1">
          <div className="flex items-center">
            <span className="mr-2">🌡️</span>
            <span>{temperature_2m} {temperatureUnit}</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">💨</span>
            <span>{degToCompass(wind_direction_10m)} {wind_speed_10m} {windSpeedUnit}</span>
          </div>
          <div className="flex items-center">
            <span className="mr">Last updated:</span>
            <span> {data.current.time}</span>
          </div>
        </div>
      )

}

function degToCompass(num:number) {
    var val = Math.floor((num / 22.5) + 0.5);
    var arr = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
    return arr[(val % 16)];
}