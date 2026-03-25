'use client';

import { useState } from 'react';

export default function RateEstimatorClient({ countryCode, countryName }: { countryCode: string, countryName: string }) {
  const isMetric = countryCode !== 'us' && countryCode !== 'gb';
  const distanceLabel = isMetric ? 'Kilometers' : 'Miles';
  const currencySymbol = countryCode === 'gb' ? '£' : (countryCode === 'de' || countryCode === 'fr' || countryCode === 'it' || countryCode === 'es' || countryCode === 'nl') ? '€' : '$';
  
  const [loadedDistance, setLoadedDistance] = useState(350);
  const [deadheadDistance, setDeadheadDistance] = useState(100);
  const [baseRate, setBaseRate] = useState(isMetric ? 1.15 : 1.85); // per km/mi
  const [deadheadRate, setDeadheadRate] = useState(isMetric ? 0.90 : 1.25);
  const [overnightStops, setOvernightStops] = useState(0);
  const [overnightFee, setOvernightFee] = useState(150);
  const [waitTimeHours, setWaitTimeHours] = useState(0);
  const [waitRate, setWaitRate] = useState(50);
  const [numEscorts, setNumEscorts] = useState(1);
  const [tollCost, setTollCost] = useState(0);

  // Totals
  const totalLoaded = loadedDistance * baseRate;
  const totalDeadhead = deadheadDistance * deadheadRate;
  const totalOvernight = overnightStops * overnightFee;
  const totalWait = waitTimeHours * waitRate;
  const baseSubtotal = totalLoaded + totalDeadhead + totalOvernight + totalWait + tollCost;
  const grandTotal = baseSubtotal * numEscorts;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col lg:flex-row gap-10">
        
        {/* Input Panel */}
        <div className="w-full lg:w-1/2 space-y-6">
          <div>
            <h3 className="text-xl font-bold text-white mb-4">Route Parameters</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Loaded {distanceLabel}</label>
                <input 
                  type="number" step="1" 
                  value={loadedDistance} onChange={(e) => setLoadedDistance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Loaded Rate (/{distanceLabel})</label>
                <input 
                  type="number" step="0.05" 
                  value={baseRate} onChange={(e) => setBaseRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Deadhead {distanceLabel}</label>
                <input 
                  type="number" step="1" 
                  value={deadheadDistance} onChange={(e) => setDeadheadDistance(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Deadhead Rate (/{distanceLabel})</label>
                <input 
                  type="number" step="0.05" 
                  value={deadheadRate} onChange={(e) => setDeadheadRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/10">
            <h3 className="text-xl font-bold text-white mb-4">Incidentals</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Overnight Stops</label>
                <input 
                  type="number" step="1" 
                  value={overnightStops} onChange={(e) => setOvernightStops(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Motel/Layover Fee</label>
                <input 
                  type="number" step="5" 
                  value={overnightFee} onChange={(e) => setOvernightFee(parseInt(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Wait Time (Hours)</label>
                <input 
                  type="number" step="1" 
                  value={waitTimeHours} onChange={(e) => setWaitTimeHours(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Hourly Wait Rate</label>
                <input 
                  type="number" step="5" 
                  value={waitRate} onChange={(e) => setWaitRate(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Tolls / Route Fees</label>
                <input 
                  type="number" step="1" 
                  value={tollCost} onChange={(e) => setTollCost(parseFloat(e.target.value) || 0)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1">Number of Escorts</label>
                <input 
                  type="number" step="1" min="1" max="10"
                  value={numEscorts} onChange={(e) => setNumEscorts(parseInt(e.target.value) || 1)}
                  className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Output Panel */}
        <div className="w-full lg:w-1/2 flex flex-col">
          <div className="bg-black/80 rounded-2xl p-8 border border-accent/20 flex-grow shadow-2xl flex flex-col relative overflow-hidden">
            {/* Background design elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -z-10" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-accent/5 rounded-full blur-[80px] -z-10" />

            <h3 className="text-xl font-black text-white mb-6 tracking-tight">Est. Pilot Car Invoice</h3>
            
            <div className="space-y-4 font-mono text-sm tracking-tight flex-grow">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-gray-400">Loaded Miles/Km Cost</span>
                <span className="text-white text-base">{currencySymbol}{totalLoaded.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-gray-400">Deadhead Cost</span>
                <span className="text-white text-base">{currencySymbol}{totalDeadhead.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-gray-400">Layover / Motels</span>
                <span className="text-white text-base">{currencySymbol}{totalOvernight.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-gray-400">Delays / Wait Time</span>
                <span className="text-white text-base">{currencySymbol}{totalWait.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="text-gray-400">Tolls / Fees</span>
                <span className="text-white text-base">{currencySymbol}{tollCost.toFixed(2)}</span>
              </div>
              {numEscorts > 1 && (
                <div className="flex justify-between items-end border-b border-white/10 pb-2 text-accent">
                  <span>Subtotal × {numEscorts} Escorts</span>
                  <span className="text-base">{currencySymbol}{(baseSubtotal).toFixed(2)} ea</span>
                </div>
              )}
            </div>

            <div className="mt-8 pt-6 border-t border-accent/30 flex justify-between items-center">
              <div>
                <span className="block text-gray-400 text-sm font-medium uppercase tracking-widest mb-1">Total Estimate</span>
                <span className="block text-xs text-gray-500">Excludes permit & police fees</span>
              </div>
              <div className="text-4xl sm:text-5xl font-black text-accent drop-shadow-lg">
                {currencySymbol}{grandTotal.toFixed(2)}
              </div>
            </div>
            
            <button className="w-full mt-8 bg-white text-black font-bold py-4 rounded-lg hover:bg-gray-100 transition-colors uppercase tracking-widest text-sm shadow-xl hover:scale-[1.02]">
              Save Estimate PDF
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
