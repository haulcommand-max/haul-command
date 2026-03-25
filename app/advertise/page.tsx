'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { Crosshair, Megaphone, TrendingUp, BarChart3, Settings2 } from 'lucide-react';

export default function FreightAdvertisingPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden p-6 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-600">
              Standing Orders & Ads
            </h1>
            <p className="text-gray-400 mt-2">Corridor Sponsorships and Recurring Load Automation</p>
          </div>
          <button className="px-6 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-200 transition-colors shadow-lg">
            Create Campaign
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Active Sponsorships (Ads) */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Megaphone className="w-5 h-5 text-indigo-500" /> Active Corridor Sponsorships</h2>
            
            {[
              { corridor: 'I-10 West (Houston \u2192 LA)', bid: '$4.50/day', status: 'Winning', views: '14.2K', converts: 24 },
              { corridor: 'I-40 East (Flagstaff \u2192 ABQ)', bid: '$2.15/day', status: 'Outbid', views: '8.4K', converts: 9 },
            ].map((ad, i) => (
              <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 backdrop-blur-xl hover:bg-white/10 transition-colors">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h3 className="text-lg font-bold">{ad.corridor}</h3>
                    <div className="flex items-center gap-3 mt-2">
                      <span className={`px-2 py-0.5 rounded text-xs font-bold ${ad.status === 'Winning' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                        {ad.status}
                      </span>
                      <span className="text-sm font-mono text-gray-400">Current Bid: {ad.bid}</span>
                    </div>
                  </div>
                  <button className="text-gray-400 hover:text-white"><Settings2 className="w-5 h-5" /></button>
                </div>

                <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-4">
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Impressions</div>
                    <div className="text-xl font-semibold">{ad.views}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Conversions</div>
                    <div className="text-xl font-semibold">{ad.converts}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 uppercase tracking-wider mb-1">Cost Per Load</div>
                    <div className="text-xl font-semibold text-emerald-400">$8.40</div>
                  </div>
                </div>
              </div>
            ))}
          </motion.div>

          {/* Standing Orders Rules Engine */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="lg:col-span-1 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2"><Crosshair className="w-5 h-5 text-amber-500" /> Standing Orders</h2>
            
            <div className="bg-gradient-to-b from-amber-500/10 to-black/40 border border-amber-500/20 rounded-2xl p-6 shadow-[0_0_30px_rgba(245,158,11,0.1)]">
              <h3 className="font-bold text-amber-400 mb-2">Automated Dispatch Rules</h3>
              <p className="text-sm text-gray-400 mb-6">Instantly dispatch loads to tier-1 operators when conditions are met.</p>
              
              <div className="space-y-3">
                {[
                  { name: 'TX Triangle Heavy', limit: 'Max $4.50/mi' },
                  { name: 'Midwest Agriculture', limit: 'Max $3.80/mi' }
                ].map((rule, i) => (
                  <div key={i} className="p-3 bg-black/40 border border-white/5 rounded-xl flex justify-between items-center group cursor-pointer hover:border-amber-500/50 transition-colors">
                    <div>
                      <div className="font-semibold text-sm text-gray-200">{rule.name}</div>
                      <div className="text-xs font-mono text-amber-500/70">{rule.limit}</div>
                    </div>
                    <div className="w-2 h-2 rounded-full bg-emerald-500 group-hover:shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                  </div>
                ))}
              </div>
              
              <button className="w-full mt-6 py-2 border border-amber-500/30 text-amber-500 font-semibold rounded-lg hover:bg-amber-500/10 transition-colors">
                + Add Rule
              </button>
            </div>
            
            {/* Quick Stats */}
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <h3 className="font-bold mb-4 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-blue-400" /> 30-Day Velocity</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Automated Matches</span>
                  <span className="font-mono font-bold text-white">142</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Ad Spend</span>
                  <span className="font-mono font-bold text-white">$450.00</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400 text-sm">Avg Fill Time</span>
                  <span className="font-mono font-bold text-emerald-400">12 min <TrendingUp className="w-3 h-3 inline" /></span>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </div>
    </div>
  );
}
