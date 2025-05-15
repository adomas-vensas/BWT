interface AboutPanelModalProps{
    open: boolean
}

export default function AboutPanelModal({ open }: AboutPanelModalProps) {
    if (!open) return null;

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
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300 text-justify">
                    This starter project showcases a digital twin of a bladeless wind turbine,
                    simulating its oscillations and how those vibrations create vortex induced vibrations (VIV).
                    An integrated fluid‐dynamics view visualizes vortex shedding — showing how airflow past the turbine creates alternating vortices.
                    Try out this demo to see both aerodynamic phenomena in action.
                </p>
                <p className="text-base leading-relaxed  text-gray-700 dark:text-gray-300">
                    Adomas Vensas, 2025
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
}