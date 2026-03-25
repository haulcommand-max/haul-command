'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Users, MapPin, Search, AlertCircle, RefreshCw, Layers } from 'lucide-react';

export default function LiveDispatchPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-hidden">
      
      {/* Background Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />

      {/* Header */}
      <header className="relative z-20 border-b border-white/5 bg-black/60 backdrop-blur-md px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Activity className="w-5 h-5 text-red-500 animate-pulse" />
          <h1 className="text-xl font-bold tracking-widest text-gray-200 uppercase">Live Dispatch Control</h1>
          <div className="px-2 py-0.5 rounded bg-red-500/10 border border-red-500/20 text-xs font-mono text-red-400">
            SECURE LINK 24.90
          </div>
        </div>
        <div className="flex gap-4">
          <div className="w-64 relative hidden md:block">
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder="Search load ID or operator..." className="w-full bg-white/5 border border-white/10 rounded-full pl-10 pr-4 py-1.5 text-sm outline-none focus:border-white/30 transition-colors" />
          </div>
        </div>
      </header>

      <main className="relative z-10 max-w-[1600px] mx-auto p-4 md:p-6 grid grid-cols-1 xl:grid-cols-4 gap-6 h-[calc(100vh-5rem)]">
        
        {/* Left Column: Live Activity Feed */}
        <div className="xl:col-span-1 flex flex-col gap-4 overflow-hidden">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-sm font-bold tracking-wider text-gray-400"><Layers className="w-4 h-4 inline mr-2" /> ACTIVE JOBS</h2>
            <RefreshCw className="w-3 h-3 text-gray-600 animate-spin" />
          </div>

          <div className="overflow-y-auto space-y-3 pb-20 scrollbar-hide">
            {[
              { id: 'LD-8891', route: 'Dallas \u2192 Omaha', status: 'Rolling', progress: 65, op: 'Apex Heavy Haul', delay: false },
              { id: 'LD-9902', route: 'Denver \u2192 Boise', status: 'Stopped', progress: 42, op: 'Titan Escort', delay: true },
              { id: 'LD-9915', route: 'Atlanta \u2192 Miami', status: 'Arrived', progress: 100, op: 'Pioneer Pilot Cars', delay: false },
              { id: 'LD-8822', route: 'Houston \u2192 Tulsa', status: 'Rolling', progress: 12, op: 'Sentinel Transport Intel', delay: false },
            ].map((job, idx) => (
              <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 * idx }} key={idx} className="bg-white/5 border border-white/10 rounded-xl p-4 hover:border-white/20 transition-colors cursor-pointer group">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-mono text-xs text-blue-400 font-bold">{job.id}</span>
                  <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${job.delay ? 'bg-amber-500/20 text-amber-500 border border-amber-500/30' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'}`}>
                    {job.delay ? 'Delayed' : job.status}
                  </span>
                </div>
                <div className="font-bold text-gray-200 mb-1">{job.route}</div>
                <div className="text-xs text-gray-500 flex items-center justify-between">
                  <div className="flex items-center gap-1"><Users className="w-3 h-3" /> {job.op}</div>
                  <span className="font-mono text-[10px]">{job.progress}%</span>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1 bg-black/40 rounded-full mt-3 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-1000 ${job.delay ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${job.progress}%` }} />
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Center/Right: Telematics Map */}
        <div className="xl:col-span-3 bg-black flex flex-col rounded-3xl border border-white/10 overflow-hidden relative shadow-2xl">
          
          {/* Map Overlay Simulation */}
          <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/9/127/198.png')] bg-cover bg-center opacity-40 mix-blend-screen filter brightness-[0.2] contrast-[1.5] grayscale" />

          {/* H3 Density Hexagons Mock */}
          <div className="absolute inset-0 w-full h-full opacity-30 select-none pointer-events-none">
            <svg width="100%" height="100%">
              <pattern id="hexagons" width="50" height="43.4" patternUnits="userSpaceOnUse" patternTransform="scale(2)">
                <path d="M25 0 L50 14.4 L50 43.3 L25 57.7 L0 43.3 L0 14.4 Z" fill="none" stroke="rgba(59,130,246,0.3)" strokeWidth="0.5" />
              </pattern>
              <rect width="100%" height="100%" fill="url(#hexagons)" />
              
              {/* Highlight specific hexes (fake clusters) */}
              <polygon points="125 0 150 14.4 150 43.3 125 57.7 100 43.3 100 14.4" fill="rgba(59,130,246,0.5)" transform="translate(200, 300)" className="animate-pulse" />
              <polygon points="125 0 150 14.4 150 43.3 125 57.7 100 43.3 100 14.4" fill="rgba(239,68,68,0.3)" transform="translate(600, 200)" />
            </svg>
          </div>

          {/* Map Metrics HUD */}
          <div className="absolute top-6 left-6 right-6 flex justify-between items-start pointer-events-none">
            <div className="bg-black/80 backdrop-blur border border-white/5 p-4 rounded-xl flex gap-6 shadow-2xl pointer-events-auto">
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Global Supply</div>
                <div className="text-2xl font-bold font-mono text-emerald-400">1,240<span className="text-sm text-gray-500 ml-1">OP</span></div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Open Demand</div>
                <div className="text-2xl font-bold font-mono text-blue-400">89<span className="text-sm text-gray-500 ml-1">LDS</span></div>
              </div>
              <div className="w-px bg-white/10" />
              <div>
                <div className="text-[10px] text-gray-500 font-mono tracking-widest uppercase">Hot Zones</div>
                <div className="text-2xl font-bold font-mono text-red-400 animate-pulse">4</div>
              </div>
            </div>

            <div className="bg-black/60 backdrop-blur rounded-full px-4 py-2 text-xs font-mono text-gray-400 border border-white/5 flex items-center gap-2 pointer-events-auto cursor-help">
              <MapPin className="w-3 h-3" /> H3 Indexing: Active
            </div>
          </div>

          {/* Telematics Pings */}
          <div className="absolute top-[40%] left-[30%] w-3 h-3 bg-emerald-500 rounded-full shadow-[0_0_15px_rgba(16,185,129,0.8)]">
            <div className="absolute inset-0 bg-emerald-500 rounded-full animate-ping opacity-75" />
            
            {/* Operator Tooltip (mock) */}
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-black/80 backdrop-blur-md border border-white/10 rounded-lg p-2 flex flex-col items-center shadow-xl z-50 whitespace-nowrap hidden group-hover/ping:block group-hover:block pointer-events-none">
              <span className="text-xs font-bold text-gray-200">Apex Heavy Haul</span>
              <span className="text-[10px] font-mono text-emerald-400">65 MPH</span>
            </div>
          </div>
          
          <div className="absolute top-[60%] right-[30%] w-3 h-3 bg-blue-500 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.8)]">
            <div className="absolute inset-0 bg-blue-500 rounded-full animate-ping opacity-75" />
          </div>

          {/* Critical Hazard Alert */}
          <div className="absolute bottom-6 left-6 max-w-sm bg-red-950/80 backdrop-blur-xl border border-red-500/50 rounded-2xl p-4 shadow-2xl pointer-events-auto">
            <div className="flex gap-3">
              <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
              <div>
                <h3 className="font-bold text-red-400 mb-1">Route Interference Detected</h3>
                <p className="text-sm text-red-200/80 mb-3">Weather delay triggering automatic rerouting prompts for 3 active loads near Dallas.</p>
                <div className="flex gap-2">
                  <button className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 text-xs font-bold rounded-lg hover:bg-red-500/30">
                    Acknowledge
                  </button>
                  <button className="px-3 py-1 text-red-300 text-xs font-bold hover:text-white">
                    View Impact
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>
    </div>
  );
}
