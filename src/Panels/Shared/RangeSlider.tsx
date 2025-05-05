import { useState } from "react";

interface RangeSliderProps {
    min:number,
    max:number,
    step:number,
    unit?:string
}

export default function RangeSlider({min, max, step, unit = ""}: RangeSliderProps) {

    const [value, setValue] = useState((max - min) / 2);

    return (
        <div className="relative mb-10">
        {/* Current value */}
        <p className="mt-2 text-sm text-left text-gray-700 dark:text-gray-300">Selected: {value} {unit}</p>
        <input
            id="labels-range-input"
            type="range"
            value={value}
            step={step}
            min={min}
            max={max}
            onChange={(e) => setValue(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer dark:bg-gray-200"
        />
        </div>
      );
}