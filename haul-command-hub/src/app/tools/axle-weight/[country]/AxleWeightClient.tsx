'use client';

import { useState } from 'react';

export default function AxleWeightClient({ countryCode, countryName }: { countryCode: string, countryName: string }) {
  const isMetric = countryCode !== 'us' && countryCode !== 'gb';
  const weightUnit = isMetric ? 'kg' : 'lbs';
  const defaultSteer = isMetric ? 5400 : 12000;
  const defaultDrive = isMetric ? 15400 : 34000;
  const defaultTandem = isMetric ? 15400 : 34000;

  const [steerAxle, setSteerAxle] = useState<number>(defaultSteer);
  const [driveAxle, setDriveAxle] = useState<number>(defaultDrive);
  const [trailerAxle1, setTrailerAxle1] = useState<number>(defaultTandem);
  const [trailerAxle2, setTrailerAxle2] = useState<number>(0);
  const [boosterAxle, setBoosterAxle] = useState<number>(0);

  const totalGross = steerAxle + driveAxle + trailerAxle1 + trailerAxle2 + boosterAxle;
  
  const superloadThreshold = isMetric ? 80000 : 150000; 
  const isSuperload = totalGross > superloadThreshold;

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm max-w-4xl mx-auto">
      <div className="flex flex-col md:flex-row gap-8 text-white">
        
        {/* Input Form */}
        <div className="flex-1 space-y-6">
           <h3 className="text-2xl font-bold uppercase tracking-tighter">Enter Axle Scalings</h3>
           
           <div>
             <label className="block text-gray-400 text-sm font-bold uppercase mb-1">Steer Axle ({weightUnit})</label>
             <input type="number" value={steerAxle} onChange={(e) => setSteerAxle(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-white/10 rounded px-4 py-3" />
           </div>
           <div>
             <label className="block text-gray-400 text-sm font-bold uppercase mb-1">Drive Axle(s) ({weightUnit})</label>
             <input type="number" value={driveAxle} onChange={(e) => setDriveAxle(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-white/10 rounded px-4 py-3" />
           </div>
           <div>
             <label className="block text-gray-400 text-sm font-bold uppercase mb-1">Trailer Axle Group 1 ({weightUnit})</label>
             <input type="number" value={trailerAxle1} onChange={(e) => setTrailerAxle1(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-white/10 rounded px-4 py-3" />
           </div>
           <div>
             <label className="block text-gray-400 text-sm font-bold uppercase mb-1">Trailer Axle Group 2 ({weightUnit})</label>
             <input type="number" value={trailerAxle2} onChange={(e) => setTrailerAxle2(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-white/10 rounded px-4 py-3" />
           </div>
           <div>
             <label className="block text-gray-400 text-sm font-bold uppercase mb-1">Booster / Jeep ({weightUnit})</label>
             <input type="number" value={boosterAxle} onChange={(e) => setBoosterAxle(parseInt(e.target.value) || 0)} className="w-full bg-black/60 border border-white/10 rounded px-4 py-3" />
           </div>
        </div>

        {/* Results */}
        <div className="flex-1 border-t md:border-t-0 md:border-l border-white/10 pt-6 md:pt-0 md:pl-8 flex flex-col justify-center">
           <div className="text-center">
             <span className="block text-gray-400 text-sm font-bold uppercase tracking-widest mb-2">Total Gross Weight</span>
             <div className="text-6xl font-black text-accent">{totalGross.toLocaleString()} <span className="text-2xl">{weightUnit}</span></div>
           </div>

           <div className="mt-8 space-y-4">
             <div className={`p-4 rounded-lg border ${isSuperload ? 'bg-red-500/10 border-red-500/30' : 'bg-green-500/10 border-green-500/30'}`}>
                <h4 className={`text-lg font-bold ${isSuperload ? 'text-red-400' : 'text-green-400'}`}>
                  {isSuperload ? 'Superload Threshold Exceeded' : 'Routine Overweight Category'}
                </h4>
                <p className="text-sm text-gray-300 mt-1">
                  {isSuperload ? `Your gross weight exceeds ${countryName}'s default superload bounds. Engineering structural review and DOT bridge analysis will likely be required.` : 'Standard state/provincial dimension permits apply. Routine bridge routing analysis used.'}
                </p>
             </div>

             <button className="w-full bg-white text-black font-bold py-3 mt-4 rounded-lg hover:bg-gray-200 transition text-sm uppercase tracking-wider">
               Check Bridge Formulas
             </button>
           </div>
        </div>
      </div>
    </div>
  );
}
