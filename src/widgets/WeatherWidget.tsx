import React from 'react'
import { WeatherContext, useData } from './WeatherContext'


export default function WeatherWidget(){
    const { data, loading, error } = useData()

    if(!data)
    {
        return null;
    }

    const { temperature_2m, wind_speed_10m } = data.current

    return (
        <div className="bg-white/90 p-3 rounded shadow-lg text-sm space-y-1">
          <div className="flex items-center">
            <span className="mr-2">🌡️</span>
            <span>{temperature_2m}°C</span>
          </div>
          <div className="flex items-center">
            <span className="mr-2">💨</span>
            <span>{wind_speed_10m} m/s</span>
          </div>
        </div>
      )

}