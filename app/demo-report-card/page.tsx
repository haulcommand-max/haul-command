'use client';

import React, { useState } from 'react';

// MOCK DATA: Infused from the Deduplicated hc_extraction_candidates
const mockEntity = {
  id: 'ent_77291a',
  name: 'PilotCarNearMe Inc',
  type: 'Pilot Car Operator',
  trust_score: 98.4,
  fmcsa_status: 'ACTIVE_CLEAN',
  insurance_verified: true,
  last_known_location: 'Laredo, TX',
  last_ping: '32 mins ago',
  total_completed_loads: 1420,
  equipment: ['High Pole', 'Chase', 'Lead', 'Route Survey'],
  phone: '(Hidden for Privacy - Unlock to View)',
  metrics: {
    on_time_percentage: 99.1,
    cancellation_rate: 0.2,
    avg_response_time_mins: 4,
  },
  recent_routes: [
    { from: 'Laredo, TX', to: 'Charleston, MO', distance: '1031 mi', date: '03/26/2026' }
  ]
};

export default function TruthReportCardDemo() {
  const [unlocked, setUnlocked] = useState(false);

  return (
    <div className="min-h-screen bg-[#0b0c10] text-[#c5c6c7] p-8 font-sans selection:bg-[#66fcf1] selection:text-black">
      
      {/* HEADER SECTION */}
      <div className="max-w-6xl mx-auto mb-8">
        <h1 className="text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-[#45a29e] to-[#66fcf1] tracking-tighter">
          HAUL COMMAND
        </h1>
        <p className="text-sm font-mono text-[#66fcf1]/60 mt-1 uppercase tracking-widest">
          Global Logistics Intelligence // Truth Report Card
        </p>
      </div>

      {/* MAIN LAYOUT */}
      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* LEFT COLUMN: IDENTITY & TRUST */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* Identity Card */}
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-2xl p-6 shadow-2xl">
            {/* Glow Effect */}
            <div className="absolute top-0 right-0 -mt-16 -mr-16 w-32 h-32 bg-[#66fcf1] rounded-full blur-[80px] opacity-20"></div>

            <div className="flex items-center justify-between mb-4">
              <span className="px-3 py-1 rounded-full bg-[#66fcf1]/10 border border-[#66fcf1]/30 text-[#66fcf1] text-xs font-bold uppercase tracking-wide">
                {mockEntity.type}
              </span>
              <div className="flex items-center space-x-2">
                <span className="relative flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                </span>
                <span className="text-xs font-mono text-emerald-400">ACTIVE</span>
              </div>
            </div>

            <h2 className="text-3xl font-bold text-white mb-1">{mockEntity.name}</h2>
            <p className="text-sm text-gray-400 font-medium mb-6">UID: {mockEntity.id}</p>

            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-sm text-gray-400">Trust Score</span>
                <span className="text-xl font-black text-[#66fcf1]">{mockEntity.trust_score}</span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-white/5">
                <span className="text-sm text-gray-400">FMCSA Status</span>
                <span className="text-sm font-bold text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded">{mockEntity.fmcsa_status}</span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-sm text-gray-400">Insurance</span>
                {mockEntity.insurance_verified ? (
                  <span className="flex items-center text-sm font-bold text-emerald-400">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"></path></svg>
                    VERIFIED
                  </span>
                ) : (
                  <span className="text-sm font-bold text-red-400">UNVERIFIED</span>
                )}
              </div>
            </div>
          </div>

          {/* Action Card */}
          <div className="rounded-2xl border border-[#66fcf1]/30 bg-[#1f2833]/80 backdrop-blur-xl p-6 shadow-[0_0_30px_rgba(102,252,241,0.1)]">
            <h3 className="text-lg font-bold text-white mb-4">Contact Information</h3>
            <div className="bg-black/40 rounded-xl p-4 mb-4 text-center border border-white/5">
              <span className={`font-mono ${unlocked ? 'text-[#66fcf1] text-xl' : 'text-gray-500 text-sm'}`}>
                {unlocked ? '(517) 610-4127' : mockEntity.phone}
              </span>
            </div>
            {!unlocked && (
              <button aria-label="Interactive Button" 
                onClick={() => setUnlocked(true)}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-[#45a29e] to-[#66fcf1] text-black font-extrabold uppercase tracking-wide hover:shadow-[0_0_20px_rgba(102,252,241,0.4)] transition-all transform hover:scale-[1.02] active:scale-95"
              >
                Unlock Contact (1 Data Credit)
              </button>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: METRICS & OPERATIONS */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Operations Overview grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl p-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Total Completed</h4>
              <p className="text-3xl font-light text-white">{mockEntity.total_completed_loads}</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl p-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">On-Time Rating</h4>
              <p className="text-3xl font-light text-emerald-400">{mockEntity.metrics.on_time_percentage}%</p>
            </div>
            <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl p-5">
              <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Avg Resp Time</h4>
              <p className="text-3xl font-light text-white">{mockEntity.metrics.avg_response_time_mins} <span className="text-sm text-gray-500">mins</span></p>
            </div>
          </div>

          {/* Capabilities Grid */}
          <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Verified Assets & Capabilities</h3>
            <div className="flex flex-wrap gap-2">
              {mockEntity.equipment.map(eq => (
                <span key={eq} className="px-4 py-2 rounded-lg bg-[#45a29e]/20 border border-[#45a29e]/50 text-[#66fcf1] font-medium text-sm">
                  {eq}
                </span>
              ))}
            </div>
          </div>

          {/* Logistics Radar / Recent Routes */}
          <div className="rounded-2xl border border-white/5 bg-white/5 backdrop-blur-xl p-0 overflow-hidden">
            <div className="p-6 border-b border-white/5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white">Logistics Radar</h3>
              <div className="flex items-center space-x-2 text-xs font-mono text-gray-400">
                <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                <span>Live Tracking Active</span>
              </div>
            </div>
            <div className="p-6 bg-black/20">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Last Known GPS</p>
                  <p className="text-xl font-medium text-white">{mockEntity.last_known_location}</p>
                  <p className="text-xs text-gray-400 mt-1">Pinged: {mockEntity.last_ping}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-bold text-gray-500 uppercase mb-1">Recent Route</p>
                  <p className="text-sm text-[#66fcf1]">{mockEntity.recent_routes[0].from} → {mockEntity.recent_routes[0].to}</p>
                  <p className="text-xs text-gray-400 mt-1">{mockEntity.recent_routes[0].distance} • {mockEntity.recent_routes[0].date}</p>
                </div>
              </div>

              {/* Fake Map Visualization */}
              <div className="w-full h-48 rounded-xl bg-[#0b0c10] border border-white/10 relative overflow-hidden group">
                <div className="absolute inset-0 opacity-30 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
                <div className="absolute inset-x-0 h-px top-1/2 bg-[#66fcf1]/20"></div>
                <div className="absolute inset-y-0 w-px left-1/2 bg-[#66fcf1]/20"></div>
                
                {/* Radar Sweep */}
                <div className="absolute top-1/2 left-1/2 w-[200%] h-[200%] -ml-[100%] -mt-[100%] rounded-full border border-[#66fcf1]/5 opacity-0 group-hover:opacity-100 group-hover:animate-[spin_4s_linear_infinite] transition-opacity duration-1000" style={{ background: 'conic-gradient(from 0deg, transparent 0deg, rgba(102, 252, 241, 0.1) 60deg, rgba(102, 252, 241, 0.4) 90deg, transparent 90deg)' }}></div>

                {/* Radar Dot */}
                <div className="absolute top-[45%] left-[55%] w-3 h-3 bg-[#66fcf1] rounded-full shadow-[0_0_15px_#66fcf1]">
                  <div className="absolute inset-0 rounded-full animate-ping bg-[#66fcf1] opacity-75"></div>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
