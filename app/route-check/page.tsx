'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Globe, Truck, Map, Navigation, AlertTriangle, ShieldCheck, Zap } from 'lucide-react';

export default function RouteIntelDashboard() {
  return (
    <div className="min-h-screen bg-[#020202] text-white font-sans overflow-hidden">
      
      {/* Background Matrix */}
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 mix-blend-overlay z-0"></div>
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full z-0"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-amber-600/10 blur-[120px] rounded-full z-0"></div>

      {/* Top Nav/Header */}
      <header className="relative z-20 border-b border-white/5 bg-black/50 backdrop-blur-xl sticky top-0">
        <div className="max-w-screen-2xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Globe className="w-6 h-6 text-blue-500" />
            <span className="font-bold text-lg tracking-tight">GLOBAL ROUTE INTEL</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400">NETWORK ACTIVE</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <main className="relative z-10 max-w-screen-2xl mx-auto p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-4rem)]">
        
        {/* Left Sidebar: Controls & Constraints */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex-1">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <Truck className="w-4 h-4" /> LOAD PROFILE
            </h3>
            
            <div className="space-y-4">
              {/* Inputs mock */}
              {[
                { label: 'Gross Weight (LBS)', val: '124,000' },
                { label: 'Width (FT)', val: '14.5' },
                { label: 'Height (FT)', val: '15.2' },
                { label: 'Length (FT)', val: '95' },
              ].map((inp, idx) => (
                <div key={idx} className="bg-black/40 border border-white/5 rounded-xl p-3">
                  <div className="text-xs text-gray-500 mb-1 font-mono uppercase">{inp.label}</div>
                  <div className="text-xl font-bold font-mono text-white/90">{inp.val}</div>
                </div>
              ))}
              
              <button className="w-full mt-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all">
                ANALYZE ROUTE
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex-1">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" /> HAUL COMMAND WAZE
            </h3>
            <div className="space-y-3">
              {[
                { event: 'Low Bridge Clearance', dist: '12mi ahead', loc: 'I-40 East', crit: true },
                { event: 'Active Work Zone', dist: '45mi ahead', loc: 'US-87 North', crit: false },
                { event: 'Weight Station Open', dist: '60mi ahead', loc: 'I-35', crit: false },
              ].map((hz, idx) => (
                <div key={idx} className={`p-3 border rounded-xl bg-black/40 ${hz.crit ? 'border-red-500/30' : 'border-white/5'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-sm font-semibold ${hz.crit ? 'text-red-400' : 'text-gray-200'}`}>{hz.event}</span>
                    <span className="text-xs font-mono text-gray-500">{hz.dist}</span>
                  </div>
                  <div className="text-xs text-gray-400">{hz.loc}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Center: The Map Area */}
        <div className="lg:col-span-6 flex flex-col gap-6 h-full">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 w-full bg-[#0a0f18] border border-blue-500/20 rounded-3xl overflow-hidden relative shadow-2xl">
            {/* Map Overlay Elements */}
            <div className="absolute inset-0 bg-[url('https://maps.wikimedia.org/osm-intl/9/127/198.png')] bg-cover bg-center opacity-30 mix-blend-color-dodge filter brightness-50 contrast-125 grayscale" />
            
            {/* The Route Line Mock */}
            <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
              <path d="M 10,90 Q 40,50 60,30 T 90,10" fill="none" stroke="rgba(59, 130, 246, 0.8)" strokeWidth="0.5" strokeDasharray="1,1" className="animate-[dash_20s_linear_infinite]" />
              <circle cx="10" cy="90" r="1.5" fill="#3B82F6" className="animate-pulse" />
              <circle cx="90" cy="10" r="1.5" fill="#10B981" />
              
              {/* Hazard points */}
              <circle cx="50" cy="40" r="1" fill="#EF4444" className="animate-ping" />
            </svg>

            {/* Floating Map Controls */}
            <div className="absolute top-4 right-4 flex flex-col gap-2">
              <button className="bg-black/60 p-2 rounded-lg border border-white/10 hover:bg-black text-white"><Map className="w-5 h-5" /></button>
              <button className="bg-black/60 p-2 rounded-lg border border-white/10 hover:bg-black text-white"><Navigation className="w-5 h-5" /></button>
            </div>

            {/* Bottom Data Overlay */}
            <div className="absolute bottom-4 inset-x-4">
              <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl p-4 flex justify-between items-center shadow-2xl">
                <div>
                  <div className="text-xs text-gray-400 font-mono mb-1">SELECTED CORRIDOR</div>
                  <div className="text-lg font-bold">Texas Triangle: Dallas to Houston</div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono mb-1">TOTAL DISTANCE</div>
                    <div className="text-lg font-bold text-blue-400">239 MI</div>
                  </div>
                  <div className="text-right">
                    <div className="text-xs text-gray-400 font-mono mb-1">EST. DURATION</div>
                    <div className="text-lg font-bold text-amber-400">4h 15m</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar: Jurisdiction & Certifications */}
        <div className="lg:col-span-3 flex flex-col gap-6 h-full">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="p-5 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-md flex-1">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 mb-4 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-500" /> JURISDICTION RULES
            </h3>

            <div className="space-y-4">
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <div className="text-emerald-400 font-bold mb-1">Texas DOT</div>
                <div className="text-sm text-gray-300">Permit accepted natively. Superload provisions active for 120k+ lbs.</div>
              </div>

              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <div className="text-amber-400 font-bold mb-1">Pilot Car Requirements</div>
                <div className="text-sm text-gray-300">
                  <ul className="list-disc list-inside space-y-1">
                    <li>1 Front Escort (due to width &gt; 14&apos;)</li>
                    <li>1 Rear Escort (due to length &gt; 90&apos;)</li>
                    <li>Height Pole required (height &gt; 15&apos;)</li>
                  </ul>
                </div>
              </div>

              <div className="p-4 bg-black/40 border border-white/5 rounded-xl">
                <div className="text-gray-200 font-bold mb-1 flex items-center justify-between">
                  Curfew Restrictions <Zap className="w-3 h-3 text-amber-500" />
                </div>
                <div className="text-sm font-mono text-gray-400">No travel within Houston city limits 6AM-9AM, 4PM-7PM.</div>
              </div>
            </div>
          </motion.div>
        </div>

      </main>

      <style jsx global>{`
        @keyframes dash {
          to {
            stroke-dashoffset: -100;
          }
        }
      `}</style>
    </div>
  );
}
