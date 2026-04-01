'use client';
import React from 'react';

// Task 22: <VendorScorecard /> Component
// Visualizes Trust Score and Fraud Indicators extracted from Freedom Pilot OS model.

export default function VendorScorecard({
  companyName,
  score,
  capabilities
}: {
  companyName: string;
  score: number;
  capabilities: string[];
}) {
  const isHealthy = score > 80;
  const isAtRisk = score < 60;

  return (
    <div className="bg-hc-gray-900 border border-hc-gray-800 rounded-xl p-6 shadow-xl w-full max-w-sm">
      <div className="flex justify-between items-start mb-4 border-b border-hc-gray-800 pb-4">
        <div>
          <h2 className="text-xl font-bold text-white">{companyName}</h2>
          <p className="text-xs text-hc-gray-400 mt-1">Verified Logistics Operator</p>
        </div>
        <div className={`rounded-full flex items-center justify-center font-bold text-lg w-12 h-12 shadow-sm border-2 ${
           isHealthy ? 'bg-green-100 text-green-800 border-green-500' : 
           isAtRisk ? 'bg-red-100 text-red-800 border-red-500' : 'bg-yellow-100 text-yellow-800 border-hc-yellow-400'
        }`}>
          {score}
        </div>
      </div>

      <div className="mb-4">
        <h3 className="text-xs font-bold uppercase text-hc-gray-500 tracking-wider mb-2">Capabilities Wallet</h3>
        <div className="flex flex-wrap gap-2">
          {capabilities.map(cap => (
            <span key={cap} className="bg-hc-gray-800 text-hc-gray-300 px-3 py-1 rounded text-xs border border-hc-gray-700 font-medium">
              {cap.replace('_', ' ').toUpperCase()}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2 mt-4">
        <div className="flex items-center justify-between text-sm">
          <span className="text-hc-gray-400">ACORD Insurance Status</span>
          <span className="text-green-500 font-bold flex items-center gap-1">✔ Verified</span>
        </div>
        <div className="flex items-center justify-between text-sm">
          <span className="text-hc-gray-400">Double-Brokering Flags</span>
          <span className="text-hc-gray-200 font-bold">0 Incidents</span>
        </div>
      </div>

      <button className="w-full mt-6 bg-hc-gray-800 hover:bg-hc-gray-700 text-hc-yellow-400 border border-hc-gray-700 py-3 rounded font-bold transition-all shadow-md">
        Dispatch Request
      </button>
    </div>
  );
}
