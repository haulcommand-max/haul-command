'use client';
import React, { useState } from 'react';

// Haul Command UI Bundle executing Tasks 24, 27, 28, 29.

// ----------------------------------------------------------------------
// Task 24: <TrainingProviderCard />
// Shows marketplace listings for certified academies.
// ----------------------------------------------------------------------
export function TrainingProviderCard({ provider }: { provider: { name: string, region: string, courses: string[] } }) {
  return (
    <div className="p-4 bg-hc-gray-900 border border-hc-gray-800 rounded shadow-md">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-white">{provider.name}</h4>
        <span className="text-xs bg-hc-gray-800 px-2 py-1 rounded text-hc-gray-400">{provider.region}</span>
      </div>
      <p className="text-xs text-hc-yellow-400 font-bold">Approved Provider</p>
      <div className="mt-3 flex gap-2 flex-wrap">
        {provider.courses.map((c, i) => <span key={i} className="text-xs border border-hc-gray-700 bg-black px-2 py-1 rounded">{c}</span>)}
      </div>
    </div>
  );
}

// ----------------------------------------------------------------------
// Task 27: <InsuranceDiscountBanner />
// Monetization layer triggering when scores exceed 90.
// ----------------------------------------------------------------------
export function InsuranceDiscountBanner({ trustScore }: { trustScore: number }) {
  if (trustScore < 90) return null;
  return (
    <div className="bg-gradient-to-r from-blue-900 to-black border border-blue-600 rounded-lg p-6 flex justify-between items-center">
      <div>
        <h3 className="text-xl font-bold text-white mb-1">Unlock 20% Off Liability Insurance</h3>
        <p className="text-sm text-blue-200">Your Trust Score of {trustScore} qualifies you for Tier-1 broker premiums with our partners.</p>
      </div>
      <button className="bg-[#121212] text-white font-bold py-2 px-6 rounded hover:bg-gray-200">Claim Reward</button>
    </div>
  );
}

// ----------------------------------------------------------------------
// Task 28: <OperatorFicoGauge />
// Circular visual gauge for operator readiness.
// ----------------------------------------------------------------------
export function OperatorFicoGauge({ score }: { score: number }) {
  const color = score > 80 ? 'text-green-500' : score > 50 ? 'text-hc-yellow-400' : 'text-red-500';
  return (
    <div className="relative flex items-center justify-center w-32 h-32 rounded-full border-[6px] border-hc-gray-800 shadow-xl bg-black">
      <div className={`text-3xl font-black ${color}`}>{score}</div>
      <div className="absolute top-0 bottom-0 left-0 right-0 border-[6px] rounded-full border-t-transparent border-l-transparent" style={{ borderColor: 'inherit' }}></div>
      <span className="absolute bottom-2 text-[10px] text-hc-gray-500 font-bold tracking-widest uppercase">Trust</span>
    </div>
  );
}

// ----------------------------------------------------------------------
// Task 29: <LanguageSwitcher />
// Dynamically toggles UI text between local and universal logic.
// ----------------------------------------------------------------------
export function LanguageSwitcher() {
  const [lang, setLang] = useState('US');
  return (
    <select 
      value={lang} 
      onChange={(e) => setLang(e.target.value)}
      className="bg-hc-gray-900 text-hc-gray-300 text-sm border border-hc-gray-700 rounded px-2 py-1 focus:outline-none"
    >
      <option value="US">🇺🇸 EN-US (Pilot Car)</option>
      <option value="FR">🇫🇷 FR-FR (Voiture Pilote)</option>
      <option value="DE">🇩🇪 DE-DE (Begleitfahrzeug)</option>
      <option value="AU">🇦🇺 EN-AU (Pilot Vehicle)</option>
    </select>
  );
}
