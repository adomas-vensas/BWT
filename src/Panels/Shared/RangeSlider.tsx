import { useState } from "react";

interface RangeSliderProps {
    min:number,
    max:number,
    step:number
}

export default function RangeSlider({min, max, step}: RangeSliderProps) {

    const [value, setValue] = useState((max - min) / 2);

    return (
        <div className="relative mb-10">
        <label htmlFor="labels-range-input" className="sr-only">Labels range</label>
        <input
            id="labels-range-input"
            type="range"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-700"
        />
        {/* Labels */}
        <span className="text-sm text-gray-500 dark:text-gray-400 absolute start-0 -bottom-6">Min ($100)</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 absolute left-1/3 -translate-x-1/2 -bottom-6">$500</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 absolute left-2/3 -translate-x-1/2 -bottom-6">$1000</span>
        <span className="text-sm text-gray-500 dark:text-gray-400 absolute end-0 -bottom-6">Max ($1500)</span>

        {/* Current value */}
        <p className="mt-4 text-sm text-center text-gray-700 dark:text-gray-300">Selected: ${value}</p>
        </div>
      );
}