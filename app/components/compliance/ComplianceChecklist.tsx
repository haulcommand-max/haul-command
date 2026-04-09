'use client';
import React, { useState } from 'react';

// Task 30: <ComplianceChecklist /> Component
// Extracted from heavy regulatory environments like France (Voiture Pilote) and US Superloads.

const CHECKS = [
  "Verify Amber Lights / Strobes active and visible 360°",
  "Oversize Load / Convoi Exceptionnel banners deployed securely",
  "High pole calibrated strictly 6 inches above max load height",
  "UHF/CB Radio communication established with driver",
  "Permits (Digital or Print) verified for the active routing"
];

export default function ComplianceChecklist() {
  const [checkedItems, setCheckedItems] = useState<number[]>([]);

  const toggleCheck = (idx: number) => {
    if (checkedItems.includes(idx)) {
      setCheckedItems(checkedItems.filter(i => i !== idx));
    } else {
      setCheckedItems([...checkedItems, idx]);
    }
  };

  const isComplete = checkedItems.length === CHECKS.length;

  return (
    <div className="bg-black border border-hc-gray-700 rounded-lg p-6 max-w-md w-full text-white mx-auto shadow-2xl">
      <h2 className="text-xl font-bold mb-1 flex items-center gap-2">
        <span className="text-hc-yellow-400">⚠</span> Pre-Trip Safety Protocol
      </h2>
      <p className="text-xs text-hc-gray-400 mb-6">Must be completed before route initiation.</p>

      <div className="space-y-3">
        {CHECKS.map((text, idx) => (
          <label 
            key={idx} 
            className={`flex items-start gap-4 p-4 rounded-lg cursor-pointer border transition-colors ${checkedItems.includes(idx) ? 'bg-hc-gray-900 border-hc-yellow-400' : 'bg-hc-gray-800 border-hc-gray-700 hover:border-hc-gray-500'}`}
          >
            <input 
              type="checkbox" 
              className="mt-1 h-5 w-5 bg-hc-gray-900 border-hc-gray-600 text-hc-yellow-400 focus:ring-hc-yellow-400 focus:ring-opacity-25 rounded"
              checked={checkedItems.includes(idx)}
              onChange={() => toggleCheck(idx)}
            />
            <span className={`text-sm ${checkedItems.includes(idx) ? 'text-gray-200' : 'text-gray-400'}`}>
              {text}
            </span>
          </label>
        ))}
      </div>

      <button 
        disabled={!isComplete}
        className={`w-full mt-6 py-4 rounded font-extrabold uppercase tracking-widest transition-all ${isComplete ? 'bg-hc-yellow-400 text-white hover:bg-yellow-500 shadow-lg shadow-yellow-900/50' : 'bg-hc-gray-800 text-hc-gray-600 cursor-not-allowed'}`}
      >
        {isComplete ? 'Initiate Dispatch' : 'Complete Checks'}
      </button>
    </div>
  );
}
