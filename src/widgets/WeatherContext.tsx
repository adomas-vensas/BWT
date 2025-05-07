import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'

interface Current {
    time: string,
    interval: number,
    wind_speed_10m: number,
    wind_direction_10m: number,
    temperature_2m: number,
    rain: number,
    wind_gusts_10m: number
}

interface CurrentUnits {
    time: string,
    interval: string,
    wind_speed_10m: string,
    wind_direction_10m: string,
    temperature_2m: string,
    rain: string,
    wind_gusts_10m: string
}

interface WeatherData {
    elevation: number,
    currentUnits: CurrentUnits,
    current: Current
}

interface DataContextValue {
  data: WeatherData | null
  loading: boolean
  error?: string
}

const DataContext = createContext<DataContextValue | undefined>(undefined)

export function WeatherContext({ children }: { children: React.ReactNode }) {
    const [data, setData]       = useState<WeatherData | null>(null)
    const [loading, setLoading] = useState(true)

    const url = 
          'https://api.open-meteo.com/v1/forecast?'
        + 'latitude=54.7314&longitude=25.2627'
        + '&current=weather_code,wind_speed_10m,wind_direction_10m,temperature_2m,rain,wind_gusts_10m'
        + '&timezone=auto'
        + '&wind_speed_unit=ms' // VU MIF Informatikos instituto koordinatės
    
    const fetchWeather = useCallback(async() => {

        const response = await fetch(url)
        const data = await response.json()
        
        const mapped: WeatherData = {
            elevation:      data.elevation,
            currentUnits: {
              time:             data.current_units.time,
              interval:         data.current_units.interval,          // if it really uses the same?
              wind_speed_10m:   data.current_units.wind_speed_10m,
              wind_direction_10m: data.current_units.wind_direction_10m,
              temperature_2m:   data.current_units.temperature_2m,
              rain:             data.current_units.rain,
              wind_gusts_10m:   data.current_units.wind_gusts_10m,
            },
            current: {
              time:             data.current.time,        // or data.current_weather.time ? 
              interval:         data.current.interval,        // or data.current_weather.time ? 
              wind_speed_10m:   data.current.wind_speed_10m,
              wind_direction_10m: data.current.wind_direction_10m,
              temperature_2m:   data.current.temperature_2m,
              rain:             data.current.rain ?? 0,
              wind_gusts_10m:   data.current.wind_gusts_10m,
            }
          }
        
        setData(mapped)
        setLoading(false)

    },[])

    useEffect(() => {
      fetchWeather()
    }, [])

    useQuarterHourFetcher(fetchWeather);

    return (
        <DataContext.Provider value={{ data, loading }}>
        {children}
        </DataContext.Provider>
    )
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error("useData must be used inside a DataProvider")
  return ctx
}

function useQuarterHourFetcher(fetchFn: () => void) {
  useEffect(() => {
    // 1) Compute ms until next quarter mark
    const now = new Date()
    const minutes = now.getMinutes()
    const seconds = now.getSeconds()
    const ms       = now.getMilliseconds()

    // that gives us minute‑offset into the hour, e.g. 23 on 12:23:45.123
    const offset = minutes % 15              

    // minutes until next quarter: 15-offset
    const minsUntilNext = (15 - offset) % 15 
    const msUntilNext   = 
      minsUntilNext * 60_000       // to ms
      - seconds * 1000             // subtract elapsed seconds
      - ms                         // subtract elapsed ms
      + 5 * 1000                  // add 5 second margin

    // 2) Schedule first fetch at exactly the quarter mark
    const timerId = window.setTimeout(() => {
      // do the first fetch
      fetchFn()

      // 3) now that we're aligned, fetch every 15 minutes
      const intervalId = window.setInterval(fetchFn, 15 * 60_000)

      // on cleanup cancel the interval
      cleanupFns.push(() => window.clearInterval(intervalId))
    }, msUntilNext)

    // store cleanup for the timeout
    const cleanupFns: (() => void)[] = [
      () => window.clearTimeout(timerId)
    ]

    return () => cleanupFns.forEach((fn) => fn())
  }, [fetchFn])
}
