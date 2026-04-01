'use client';
import React, { useState } from 'react';

// Extracted from Supabase Plan: 20260227_sociable_directory_upgrades.sql
// Fills the mobile app requirement allowing operators to leave public trust endorsements on each other's profiles.

export default function MobileSocialEndorsements({ targetProviderId }: { targetProviderId: string }) {
  const [endorsed, setEndorsed] = useState(false);

  // Mocking the endorsements array
  const endorsements = [
    { from: 'Acme Heavy Haul', type: 'professionalism', text: 'On time and deeply knowledgeable of GA port rules.' },
    { from: 'Texas Elite Freight', type: 'equipment', text: 'Brand new high pole, perfectly calibrated.' }
  ];

  return (
    <div className="bg-hc-gray-900 border-t border-hc-gray-800 p-4 mt-2 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-white">Trust Endorsements</h3>
        <button 
          onClick={() => setEndorsed(true)}
          disabled={endorsed}
          className={`px-4 py-2 rounded text-xs font-bold uppercase ${endorsed ? 'bg-hc-gray-800 text-hc-gray-500' : 'bg-transparent border border-hc-yellow-400 text-hc-yellow-400 hover:bg-yellow-900/20'}`}
        >
          {endorsed ? 'Endorsed ✅' : 'Endorse Operator'}
        </button>
      </div>

      <div className="space-y-4">
        {endorsements.map((e, i) => (
          <div key={i} className="bg-black border border-hc-gray-800 p-4 rounded-lg">
            <div className="flex justify-between items-start mb-2">
              <span className="font-bold text-sm text-white">{e.from}</span>
              <span className="text-[10px] text-hc-yellow-400 border border-hc-yellow-400/50 bg-yellow-900/10 px-2 py-1 rounded">
                +{e.type.toUpperCase()}
              </span>
            </div>
            <p className="text-xs text-hc-gray-400">"{e.text}"</p>
          </div>
        ))}
        {endorsements.length === 0 && (
          <p className="text-sm text-hc-gray-500 text-center py-4">No endorsements yet.</p>
        )}
      </div>
    </div>
  );
}
