'use client';

import { useState } from 'react';

const AXLE_CONFIGS = [
  { id: 'single', name: 'Single Axle', maxLimit: 20000, color: 'border-blue-500/50 bg-blue-500/10 text-blue-400' },
  { id: 'tandem', name: 'Tandem (2 axles)', maxLimit: 34000, color: 'border-amber-500/50 bg-amber-500/10 text-amber-400' },
  { id: 'tridem', name: 'Tridem (3 axles)', maxLimit: 42000, color: 'border-purple-500/50 bg-purple-500/10 text-purple-400' },
  { id: 'quad', name: 'Quad (4 axles)', maxLimit: 50000, color: 'border-red-500/50 bg-red-500/10 text-red-400' },
] as const;

export default function AxleWeightTool() {
  const [weight, setWeight] = useState<string>('');
  const [config, setConfig] = useState<string>('tandem');

  const selectedConfig = AXLE_CONFIGS.find(c => c.id === config) || AXLE_CONFIGS[1];
  const weightNum = parseInt(weight.replace(/,/g, ''), 10) || 0;
  
  const percentage = Math.min((weightNum / selectedConfig.maxLimit) * 100, 150);
  const isOverweight = weightNum > selectedConfig.maxLimit;
  
  return (
    <div className="bg-[#0a0a0a] border border-white/10 rounded-xl p-6 text-white shadow-2xl w-full">
      <div className="mb-4">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1">Axle Weight Distribution Analyzer</h3>
        <p className="text-xs text-gray-500">Calculate stress distribution for your heaviest axle grouping.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Axle Configuration</label>
            <div className="grid grid-cols-2 gap-2">
              {AXLE_CONFIGS.map(c => (
                <button
                  key={c.id}
                  onClick={() => setConfig(c.id)}
                  className={`px-3 py-2 rounded-lg text-xs font-semibold text-left transition-all border ${config === c.id ? c.color : 'border-white/5 bg-white/5 text-gray-400 hover:bg-white/10 hover:border-white/20'}`}
                >
                  {c.name}
                  <div className="mt-1 opacity-60 font-mono">{c.maxLimit.toLocaleString()} lbs</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Group Weight (lbs)</label>
            <input 
              type="text" 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-3 text-sm focus:border-amber-500 focus:outline-none font-mono"
              placeholder="e.g. 36000"
              value={weight}
              onChange={(e) => setWeight(e.target.value.replace(/\D/g, ''))}
            />
          </div>
        </div>

        <div className="flex flex-col justify-center border-l-0 md:border-l border-white/10 md:pl-6 pt-4 md:pt-0 border-t md:border-t-0">
          <div className="mb-2 flex justify-between items-end">
            <span className="text-xs text-gray-400 font-medium tracking-wider">LEGAL TOLERANCE</span>
            <span className={`text-sm font-bold ${isOverweight ? 'text-red-400' : 'text-green-400'}`}>
              {weightNum > 0 ? (isOverweight ? 'OVERWEIGHT' : 'LEGAL') : '---'}
            </span>
          </div>
          
          <div className="h-4 w-full bg-[#1a1a1a] rounded-full overflow-hidden border border-white/5 mb-2">
            <div 
              className={`h-full transition-all duration-500 ${isOverweight ? 'bg-red-500' : 'bg-green-500'}`}
              style={{ width: `${Math.min(percentage, 100)}%` }}
            />
          </div>
          
          <div className="flex justify-between text-[10px] text-gray-500 font-mono">
            <span>0 lbs</span>
            <span>{selectedConfig.maxLimit.toLocaleString()} lbs limit</span>
          </div>

          {weightNum > 0 && (
            <div className={`mt-4 p-3 rounded-lg text-xs ${isOverweight ? 'bg-red-500/10 text-red-300' : 'bg-white/5 text-gray-400'}`}>
              {isOverweight ? (
                <span>⚠️ Your configuration exceeds the federal/standard legal limit by <strong>{(weightNum - selectedConfig.maxLimit).toLocaleString()} lbs</strong>. An overweight permit and potential route restrictions will apply.</span>
              ) : (
                <span>✓ Group is operating at {percentage.toFixed(1)}% of maximum legal capacity.</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
