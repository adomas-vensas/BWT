import React, { createContext, useContext, useEffect, useState } from 'react'

interface DataContextValue {
  data: string | null
  loading: boolean
  error?: string
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function WeatherContext({ children }: { children: React.ReactNode }) {
    const [data, setData]       = useState<string | null>(null)
    const [loading, setLoading] = useState(true)
    const [error, setError]     = useState<string>()
    const url = 
          'https://api.open-meteo.com/v1/forecast?'
        + 'latitude=54.7314&longitude=25.2627'
        + '&current=wind_speed_10m,wind_direction_10m,temperature_2m,rain,wind_gusts_10m'
        + '&timezone=auto'
        + '&wind_speed_unit=ms'
    
    useEffect(() =>{
        async function fetchWeather() {
            fetch(url)
            .then(res => res.json())
            .then(d => setData(d))
            .catch(err => setError(err.message))
            .finally(() => setLoading(false))
        }

        fetchWeather()

        const intervalId = setInterval(fetchWeather, 10 * 60 * 1000) //every 10 minutes

        return () => {
            clearInterval(intervalId)
        }
    }, []);

    return (
        <DataContext.Provider value={{ data, loading, error }}>
        {children}
        </DataContext.Provider>
    )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used inside a DataProvider")
  return ctx
}
