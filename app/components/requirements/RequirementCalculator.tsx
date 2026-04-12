'use client';

import React, { useState } from 'react';

// Haul Command Global Component
// Derived from NTS Logistics audit - Turning static SEO rules into an interactive utility.
// Determines escort requirements based on user dimension inputs and jurisdiction.

export default function RequirementCalculator({ jurisdictionCode }: { jurisdictionCode: string }) {
  const [format, setFormat] = useState<'imperial' | 'metric'>('imperial');
  const [dimensions, setDimensions] = useState({ width: 0, height: 0, length: 0 });
  const [results, setResults] = useState<{ required: string[]; warnings: string[] } | null>(null);

  const calculateRequirements = (e: React.FormEvent) => {
    e.preventDefault();
    // This logic connects to the `jurisdiction_requirements` Supabase matrix.
    // For MVP client logic, we simulate a rules engine:
    const rules = [];
    const warnings = [];
    
    // Simulate lookup based on metric conversion
    const widthMeters = format === 'imperial' ? dimensions.width * 0.3048 : dimensions.width;
    const heightMeters = format === 'imperial' ? dimensions.height * 0.3048 : dimensions.height;

    // Example Static Texas Logic (From earlier US Tier-A scrape)
    if (jurisdictionCode.toUpperCase() === 'TX') {
      if (widthMeters >= 3.65) rules.push('Lead Pilot Car Required');
      if (widthMeters >= 4.26) rules.push('Chase Pilot Car Required');
      if (heightMeters >= 5.18) rules.push('High Pole Escort Required');
      if (widthMeters >= 4.87) warnings.push('Superload Designation - Route Survey Recommended');
    }
    
    // Example Static Germany Logic (From Tier-A BMDV scrape)
    if (jurisdictionCode.toUpperCase() === 'BW') {
      if (widthMeters >= 3.00) rules.push('BF3 Begleitfahrzeug Required');
      if (widthMeters >= 4.00) rules.push('BF4 (Polizeiersatz) Required');
      if (heightMeters >= 4.00) warnings.push('StreckenprÃ¼fung (Route Survey) Recommended');
    }

    setResults({ required: rules.length ? rules : ['No Escort Required'], warnings });
  };

  return (
    <div className="bg-hc-gray-900 border border-hc-gray-700 rounded-lg p-6 font-sans text-hc-gray-100 shadow-xl">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <span className="text-hc-yellow-400">âš¡</span> Live Escort Calculator ({jurisdictionCode.toUpperCase()})
        </h3>
        <div className="flex bg-hc-gray-800 rounded-md p-1 border border-hc-gray-700 text-xs font-semibold">
          <button 
            type="button"
            className={`px-3 py-1 rounded ${format === 'imperial' ? 'bg-hc-yellow-400 text-white' : 'text-hc-gray-400'}`}
            onClick={() => setFormat('imperial')}
          >
            US/Imperial (ft)
          </button>
          <button 
            type="button"
            className={`px-3 py-1 rounded ${format === 'metric' ? 'bg-hc-yellow-400 text-white' : 'text-hc-gray-400'}`}
            onClick={() => setFormat('metric')}
          >
            Global/Metric (m)
          </button>
        </div>
      </div>

      <form onSubmit={calculateRequirements} className="space-y-4">
        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-wide text-hc-gray-400 mb-1">Load Width</label>
            <input 
              type="number" step="0.1" required
              className="w-full bg-hc-gray-800 border border-hc-gray-700 rounded p-2 focus:ring-1 focus:ring-hc-yellow-400 focus:outline-none" 
              onChange={e => setDimensions({...dimensions, width: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-hc-gray-400 mb-1">Load Height</label>
            <input 
              type="number" step="0.1" required
              className="w-full bg-hc-gray-800 border border-hc-gray-700 rounded p-2 focus:ring-1 focus:ring-hc-yellow-400 focus:outline-none"
              onChange={e => setDimensions({...dimensions, height: Number(e.target.value)})}
            />
          </div>
          <div>
            <label className="block text-xs uppercase tracking-wide text-hc-gray-400 mb-1">Load Length</label>
            <input 
              type="number" step="0.1" 
              className="w-full bg-hc-gray-800 border border-hc-gray-700 rounded p-2 focus:ring-1 focus:ring-hc-yellow-400 focus:outline-none"
              onChange={e => setDimensions({...dimensions, length: Number(e.target.value)})}
            />
          </div>
        </div>
        <button type="submit" className="w-full bg-hc-gray-800 hover:bg-hc-gray-700 text-hc-yellow-400 border border-hc-yellow-400 font-bold py-3 rounded transition-colors">
          Calculate Legal Limits
        </button>
      </form>

      {results && (
        <div className="mt-6 p-4 rounded bg-black border-l-4 border-hc-yellow-400">
          <h4 className="text-sm uppercase text-hc-gray-400 font-bold tracking-wider mb-2">Analysis Result</h4>
          <ul className="space-y-2">
            {results.required.map((req, i) => (
              <li key={i} className="flex items-center gap-2 font-medium">
                <span className="text-red-500">âš </span> {req}
              </li>
            ))}
            {results.warnings.map((warn, i) => (
              <li key={`w-${i}`} className="flex items-start gap-2 text-sm text-hc-gray-300 mt-2">
                <span className="text-blue-400">â„¹</span> {warn}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}