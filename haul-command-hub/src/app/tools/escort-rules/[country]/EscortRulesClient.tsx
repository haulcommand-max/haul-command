'use client';

import { useState } from 'react';
import Link from 'next/link';

interface RuleDictionary {
  name: string;
  slug: string;
  escort_trigger_width_1: number;
  escort_trigger_width_2: number;
  height_trigger_escort: number;
  height_trigger_survey: number;
  length_trigger: number;
  superload_threshold_width: number;
  superload_threshold_weight: number;
  night_movement: string;
  weekend_movement: string;
  height_pole_required: string;
  permit_portal_url: string;
}

export default function EscortRulesClient({ 
  countryCode, 
  countryName, 
  dictionary 
}: { 
  countryCode: string; 
  countryName: string; 
  dictionary: RuleDictionary[];
}) {
  const [width, setWidth] = useState<number>(countryCode === 'us' ? 8.5 : 2.5);
  const [height, setHeight] = useState<number>(countryCode === 'us' ? 13.5 : 4.0);
  const [length, setLength] = useState<number>(countryCode === 'us' ? 65 : 16.5);
  const [weight, setWeight] = useState<number>(countryCode === 'us' ? 80000 : 40000);

  const unitDesc = countryCode === 'us' ? 'feet/lbs' : 'meters/kg';

  function evaluateRule(rule: RuleDictionary) {
    let escorts = 0;
    let needsPole = false;
    let needsSurvey = false;
    let isSuperload = false;

    // Width triggers
    if (width >= rule.escort_trigger_width_2) {
      escorts = 2; // Front and Rear
    } else if (width >= rule.escort_trigger_width_1) {
      escorts = 1; // Front or Rear depending on highway
    }

    // Height triggers
    if (height >= rule.height_trigger_survey) {
      needsSurvey = true;
      needsPole = true;
      escorts = Math.max(escorts, 1);
    } else if (height >= rule.height_trigger_escort) {
      needsPole = true;
      escorts = Math.max(escorts, 1);
    }

    // Length triggers
    if (length >= rule.length_trigger) {
      escorts = Math.max(escorts, 1);
    }

    // Superload
    if (width >= rule.superload_threshold_width || weight >= rule.superload_threshold_weight) {
      isSuperload = true;
    }

    return { escorts, needsPole, needsSurvey, isSuperload };
  }

  return (
    <div className="bg-black/40 border border-white/10 rounded-2xl p-6 shadow-2xl backdrop-blur-sm">
      <div className="flex flex-col md:flex-row gap-8">
        
        {/* Load Dimensions Input Sidebar */}
        <div className="w-full md:w-1/3 space-y-6">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-xl font-bold text-white">Load Setup</h3>
            <span className="text-xs text-accent uppercase tracking-widest font-bold">({unitDesc})</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Total Width</label>
            <input 
              type="number" step="0.1" 
              value={width} onChange={(e) => setWidth(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Loaded Height</label>
            <input 
              type="number" step="0.1" 
              value={height} onChange={(e) => setHeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Overall Length</label>
            <input 
              type="number" step="0.1" 
              value={length} onChange={(e) => setLength(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent text-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-400 mb-1">Gross Weight</label>
            <input 
              type="number" step="1000" 
              value={weight} onChange={(e) => setWeight(parseFloat(e.target.value) || 0)}
              className="w-full bg-black/60 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-accent text-lg"
            />
          </div>

          <button className="w-full bg-accent text-black font-bold py-3 rounded-lg hover:bg-white transition-colors flex justify-center items-center gap-2 shadow-lg shadow-accent/20">
            🔄 Calculate Escort Needs
          </button>
        </div>

        {/* Results Area */}
        <div className="w-full md:w-2/3">
          <div className="flex justify-between items-end mb-4">
            <h3 className="text-xl font-bold text-white">{countryName} Regulations</h3>
            <button className="text-sm text-gray-400 hover:text-white flex items-center gap-1">
              🚀 Share Report
            </button>
          </div>

          <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
            {dictionary.map((rule) => {
              const res = evaluateRule(rule);
              const isBase = res.escorts === 0 && !res.isSuperload;

              return (
                <div key={rule.slug} className={`p-4 rounded-xl border transition-colors ${isBase ? 'bg-white/[0.02] border-white/5' : 'bg-accent/5 border-accent/20'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h4 className="text-lg font-bold text-white">{rule.name}</h4>
                    <Link href={rule.permit_portal_url} target="_blank" className="text-xs text-accent hover:underline">
                      DOT Portal →
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span className={`px-2.5 py-1 text-xs font-bold rounded flex items-center gap-1 ${res.escorts > 0 ? 'bg-yellow-500/20 text-yellow-500 border border-yellow-500/30' : 'bg-gray-800 text-gray-400'}`}>
                      {res.escorts === 0 ? 'No Escort Required' : `${res.escorts} Escort(s) Required`}
                    </span>
                    {res.needsPole && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-blue-500/20 text-blue-400 border border-blue-500/30">
                        Height Pole Req
                      </span>
                    )}
                    {res.needsSurvey && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                        Route Survey Req
                      </span>
                    )}
                    {res.isSuperload && (
                      <span className="px-2.5 py-1 text-xs font-bold rounded bg-red-500/20 text-red-400 border border-red-500/30 uppercase tracking-wider relative overflow-hidden group">
                        Superload
                        <span className="absolute inset-0 bg-red-500/20 translate-x-[-100%] group-hover:translate-x-full transition-transform duration-700 pointer-events-none" />
                      </span>
                    )}
                  </div>

                  {res.escorts > 0 && (
                    <div className="mt-3 pt-3 border-t border-white/10 text-xs text-gray-400 grid grid-cols-2 gap-2">
                      <div><span className="text-gray-500">Night travel:</span> {rule.night_movement}</div>
                      <div><span className="text-gray-500">Weekend travel:</span> {rule.weekend_movement}</div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
