'use client';

import { useState } from 'react';

const STATE_CLEARANCES: Record<string, number> = {
  Texas: 14.5, // feet
  California: 14.0,
  NewYork: 13.5,
  Florida: 14.5,
  Illinois: 13.5,
  Pennsylvania: 13.5,
  Ohio: 13.5,
  Michigan: 13.5,
  Georgia: 14.0,
  NorthCarolina: 14.0,
};

export default function BridgeClearanceTool() {
  const [loadHeightFt, setLoadHeightFt] = useState('');
  const [loadHeightIn, setLoadHeightIn] = useState('');
  const [selectedState, setSelectedState] = useState('Texas');

  const inchesToDecimalFeet = (inches: number) => inches / 12;

  const totalHeight = parseFloat(loadHeightFt || '0') + inchesToDecimalFeet(parseFloat(loadHeightIn || '0'));
  
  const maxClearance = STATE_CLEARANCES[selectedState] || 14.0;
  
  const isSuperload = totalHeight > maxClearance;
  const requiresSurvey = totalHeight > maxClearance - 0.5 && !isSuperload;

  return (
    <div className="bg-[#111] border border-white/10 rounded-xl p-6 text-white max-w-lg mx-auto shadow-2xl relative overflow-hidden group">
      <div className="absolute top-0 right-0 p-2 text-xs font-bold text-amber-500/50 uppercase tracking-widest">
        Route Geometry
      </div>
      
      <div className="mb-6 border-b border-white/10 pb-4">
        <h3 className="text-lg font-bold text-amber-500 mb-1">Bridge Clearance Evaluator</h3>
        <p className="text-xs text-gray-400">Calculate if your load exceeds typical state routing height restrictions.</p>
      </div>

      <div className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-gray-400 mb-1">Target Jurisdiction (State)</label>
          <select 
            className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-sm focus:border-amber-500 focus:outline-none"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
          >
            {Object.keys(STATE_CLEARANCES).map(state => (
              <option key={state} value={state}>{state.replace(/([A-Z])/g, ' $1').trim()}</option>
            ))}
            <option value="Other">Other (Default 14&apos;0&quot;)</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4 border-b border-white/10 pb-6 mb-4">
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Load Height (Feet)</label>
            <input 
              type="number" 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-sm focus:border-amber-500 focus:outline-none"
              placeholder="e.g. 15"
              value={loadHeightFt}
              onChange={(e) => setLoadHeightFt(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1">Load Height (Inches)</label>
            <input 
              type="number" 
              className="w-full bg-[#1a1a1a] border border-white/10 rounded-lg p-2 text-sm focus:border-amber-500 focus:outline-none"
              placeholder="e.g. 6"
              value={loadHeightIn}
              onChange={(e) => setLoadHeightIn(e.target.value)}
            />
          </div>
        </div>

        {totalHeight > 0 && (
          <div className={`p-4 rounded-xl border ${isSuperload ? 'bg-red-500/10 border-red-500/50' : requiresSurvey ? 'bg-amber-500/10 border-amber-500/50' : 'bg-green-500/10 border-green-500/50'}`}>
            <h4 className="text-sm font-bold mb-2 flex items-center justify-between">
              Analysis Results
              {isSuperload && <span className="text-red-400 text-xs px-2 py-0.5 bg-red-500/20 rounded-full">RESTRICTED ROUTING</span>}
              {requiresSurvey && <span className="text-amber-400 text-xs px-2 py-0.5 bg-amber-500/20 rounded-full">SURVEY REQUIRED</span>}
              {!isSuperload && !requiresSurvey && <span className="text-green-400 text-xs px-2 py-0.5 bg-green-500/20 rounded-full">STANDARD OS/OW</span>}
            </h4>
            <div className="text-xs text-gray-300 space-y-1">
              <p>State Legal Clearance Threshold: <strong className="text-white">{Math.floor(maxClearance)}&apos; {Math.round((maxClearance % 1) * 12)}&quot;</strong></p>
              <p>Your Total Height: <strong className="text-white">{loadHeightFt || '0'}&apos; {loadHeightIn || '0'}&quot;</strong> ({(totalHeight).toFixed(2)} ft)</p>
              
              <div className="mt-3 pt-3 border-t border-white/10 text-gray-400">
                {isSuperload && "Your load exceeds the nominal bridge height layout for this state. A specialized heavy-haul survey, bucket truck escorts, and route alterations (wrong-way maneuvers or bridge jumping) are extremely likely."}
                {requiresSurvey && "Your load is within 6 inches of the nominal limit. A height pole escort routing survey will likely be mandated by the DOT."}
                {!isSuperload && !requiresSurvey && "Your load is within typical OS/OW tolerances for overhead strictures in this jurisdiction. Standard bridge clearances apply."}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
