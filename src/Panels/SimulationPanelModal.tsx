interface SimulationPanelModalProps {
    open: boolean
}


export default function SimulationPanelModal({ open }: SimulationPanelModalProps) {
    if (!open) return null;
  
    return (
      <div
        aria-hidden="false"
        className="fixed top-4 bottom-4 right-1 z-40 flex justify-end pointer-events-none"
      >
        {/* Outer wrapper with margins */}
        <div className="mt-4 mb-4 mr-4 h-[calc(100%-2rem)] w-1/1 max-w-md">
          {/* Modal content */}
          <div
            className="h-full bg-white rounded-lg shadow-xl overflow-y-auto relative"
          >
            <div className="relative bg-white rounded-lg shadow-sm dark:bg-gray-700 h-full">
              {/* Modal header */}
              <div className="flex items-center justify-between p-4 md:p-5 border-b rounded-t dark:border-gray-600 border-gray-200">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
                  Simulation Parameters
                </h3>
              </div>
              {/* Modal body */}
              <div className="p-4 md:p-5 space-y-4">
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  With less than a month to go before the European Union enacts new consumer privacy laws...
                </p>
                <p className="text-base leading-relaxed text-gray-500 dark:text-gray-400">
                  The European Union’s General Data Protection Regulation (G.D.P.R.) goes into effect...
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  