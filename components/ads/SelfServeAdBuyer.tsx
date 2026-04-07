'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Check, Upload, BarChart, Map, Crown, Zap } from 'lucide-react';
import Image from 'next/image';

const TIERS = [
  {
    id: 'corridor',
    name: 'Corridor Spotlight',
    desc: 'Target operators strictly on a single high-traffic route.',
    price: '$150',
    cycle: '/mo',
    features: ['1 Target Corridor', 'Native Inline Placement', '5,000 Est. Impressions', 'Basic Analytics'],
    icon: Map,
    color: '#3b82f6',
    popular: false,
  },
  {
    id: 'state',
    name: 'State Domination',
    desc: 'Own the state-level directory and claim all intent.',
    price: '$450',
    cycle: '/mo',
    features: ['1 Full State', 'Top Leaderboard Slot', '25,000 Est. Impressions', 'Priority Routing Leads'],
    icon: Zap,
    color: '#f97316',
    popular: true,
  },
  {
    id: 'global',
    name: 'Crown Jewel',
    desc: 'Sitewide branding across all 120 countries.',
    price: '$2,500',
    cycle: '/mo',
    features: ['Global Visibility', 'Homepage Takeover Slot', '250,000+ Impressions', 'Brand Lift Dashboard'],
    icon: Crown,
    color: '#C6923A',
    popular: false,
  }
];

export default function SelfServeAdBuyer() {
  const [selectedTier, setSelectedTier] = useState('state');
  const [targetName, setTargetName] = useState('Texas (High Volume)');
  const [creativeMode, setCreativeMode] = useState<'upload'|'generate'>('upload');

  const activeTier = TIERS.find(t => t.id === selectedTier) || TIERS[1];

  return (
    <div className="w-full max-w-6xl mx-auto py-12 px-4 sm:px-6">
      
      {/* Header */}
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-black text-white tracking-tight font-[family-name:var(--font-display,sans-serif)] mb-4">
          Command The Market
        </h2>
        <p className="text-[#8fa3b8] text-base sm:text-lg max-w-2xl mx-auto">
          Deploy premium sponsorships across the Haul Command network. Capture hyper-local intent instantly with our self-serve AdGrid OS.
        </p>
      </div>

      <div className="grid lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Left Col: Setup */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* Step 1: Tier Selection */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-[0.2em] mb-5">Step 1: Choose Attack Vector</h3>
            <div className="grid sm:grid-cols-3 gap-4">
              {TIERS.map((tier) => (
                <button
                  key={tier.id}
                  onClick={() => setSelectedTier(tier.id)}
                  className={`relative flex flex-col text-left p-5 rounded-xl border transition-all duration-200 ${
                    selectedTier === tier.id 
                      ? 'bg-white/[0.08] border-white/40' 
                      : 'bg-black/20 border-white/[0.04] hover:bg-white/[0.04]'
                  }`}
                >
                  {tier.popular && (
                    <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-[#f97316] text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                      Best Value
                    </div>
                  )}
                  <tier.icon className="w-6 h-6 mb-3" style={{ color: tier.color }} />
                  <div className="font-bold text-white text-sm mb-1">{tier.name}</div>
                  <div className="text-[10px] text-[#8fa3b8] mb-4 flex-grow">{tier.desc}</div>
                  <div className="text-xl font-black text-white mt-auto">
                    {tier.price}<span className="text-[10px] text-[#64748b] ml-1 font-semibold">{tier.cycle}</span>
                  </div>
                </button>
              ))}
            </div>
          </section>

          {/* Step 2: Target Selection */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-[0.2em] mb-5">Step 2: Define Territory</h3>
            <div>
              <label className="block text-[11px] font-semibold text-[#8fa3b8] mb-2">Target Market / Geography</label>
              <select 
                value={targetName}
                onChange={(e) => setTargetName(e.target.value)}
                className="w-full bg-[#0b0c10] border border-white/10 rounded-xl px-4 py-3.5 text-sm text-white appearance-none hover:border-white/20 transition-colors focus:ring-1 focus:ring-white/20 outline-none cursor-pointer"
              >
                <option>Texas (High Volume)</option>
                <option>Florida (High Volume)</option>
                <option>Interstate 10 Corridor</option>
                <option>Pennsylvania</option>
              </select>
            </div>
          </section>

          {/* Step 3: Creative */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
            <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-[0.2em] mb-5">Step 3: Creative Assets</h3>
            
            <div className="flex gap-4 mb-6">
               <button onClick={() => setCreativeMode('upload')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-colors ${creativeMode === 'upload' ? 'bg-white/10 border-white/30 text-white' : 'bg-black/20 border-white/5 text-[#8fa3b8] hover:bg-white/[0.02]'}`}>Upload Existing</button>
               <button onClick={() => setCreativeMode('generate')} className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold border transition-colors flex items-center justify-center gap-2 ${creativeMode === 'generate' ? 'bg-[#3b82f6]/10 border-[#3b82f6]/30 text-[#3b82f6]' : 'bg-black/20 border-white/5 text-[#8fa3b8] hover:bg-white/[0.02]'}`}><Zap className="w-4 h-4" /> AI Auto-Generate</button>
            </div>

            {creativeMode === 'upload' ? (
              <div className="rounded-xl border border-dashed border-white/15 bg-black/40 hover:bg-white/[0.02] transition-colors p-10 flex flex-col items-center justify-center cursor-pointer group">
                <div className="w-12 h-12 rounded-full bg-white/[0.04] flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-5 h-5 text-[#8fa3b8] group-hover:text-white transition-colors" />
                </div>
                <div className="text-sm font-bold text-white mb-1">Click to upload or drag & drop</div>
                <div className="text-[11px] text-[#64748b]">PNG, JPG, or GIF (max. 5MB)</div>
              </div>
            ) : (
              <div className="rounded-xl border border-[#3b82f6]/20 bg-[#3b82f6]/5 p-6 relative overflow-hidden">
                 <div className="absolute top-0 right-0 w-32 h-32 bg-[#3b82f6]/10 rounded-full blur-2xl" />
                 <h4 className="text-sm font-bold text-white mb-2 relative z-10 flex items-center gap-2">No design team? No problem.</h4>
                 <p className="text-xs text-[#8fa3b8] mb-4 relative z-10">We'll scan your company profile and auto-generate high-converting AdGrid banners tailored to your selected territory.</p>
                 <div className="w-full bg-[#0b0c10] border border-white/10 rounded-lg px-4 py-3 text-sm text-white focus-within:border-[#3b82f6]/50 transition-colors flex items-center relative z-10">
                   <input type="text" placeholder="Enter your website URL or DOT Number" className="bg-transparent border-none outline-none w-full text-sm" />
                   <button className="ml-2 bg-[#3b82f6] hover:bg-blue-500 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded-md transition-colors">Generate</button>
                 </div>
              </div>
            )}
          </section>

        </div>

        {/* Right Col: Preview & Check */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-6">
            
            {/* Live Preview */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
              <h3 className="text-xs font-bold text-[#64748b] uppercase tracking-[0.2em] mb-4 flex items-center justify-between">
                Live Preview
                <span className="flex items-center gap-1.5 text-[9px] text-[#22c55e] bg-[#22c55e]/10 px-2 py-0.5 rounded-sm">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse"></div> Active
                </span>
              </h3>
              
              <div className="bg-[#0b0c10] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl">
                <div className="p-3 border-b border-white/[0.04] bg-white/[0.02] flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/50"></div>
                  <div className="text-[9px] font-mono text-[#64748b] ml-2">haulcommand.com/{targetName.toLowerCase().split(" ")[0]}</div>
                </div>
                <div className="p-4 sm:p-6 w-full aspect-[4/3] flex flex-col">
                  {/* Fake Page structure */}
                  <div className="w-3/4 h-6 bg-white/[0.06] rounded-md mb-2"></div>
                  <div className="w-1/2 h-3 bg-white/[0.04] rounded-md mb-6"></div>
                  
                  {/* The Ad */}
                  <div className="w-full h-24 bg-gradient-to-r from-[#1e293b] to-[#0f172a] border border-[#334155] rounded-lg mt-auto flex items-center justify-center p-4 relative overflow-hidden">
                     <div className="absolute top-2 right-2 text-[8px] uppercase tracking-widest text-[#94a3b8] bg-black/40 px-1 py-0.5 rounded">Sponsored</div>
                     <BarChart className="w-8 h-8 text-[#64748b] opacity-50" />
                     <div className="ml-3">
                       <div className="w-24 h-3 bg-white/20 rounded mb-1.5"></div>
                       <div className="w-16 h-2 bg-white/10 rounded"></div>
                     </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Checklist & CTA */}
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <span className="text-sm font-bold text-white">Total Value</span>
                <span className="text-2xl font-black text-white">{activeTier.price}<span className="text-xs text-[#8fa3b8] font-semibold ml-1">{activeTier.cycle}</span></span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {activeTier.features.map((feat, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-[#C6923A] mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-[#cbd5e1]">{feat}</span>
                  </li>
                ))}
              </ul>

              <button className="w-full bg-[#C6923A] hover:bg-[#E0B05C] text-black font-bold py-4 rounded-xl transition-colors shadow-[0_0_20px_rgba(198,146,58,0.3)]">
                Deploy Campaign
              </button>
              
              <div className="text-center mt-4">
                <span className="text-[10px] text-[#64748b]">Secure Checkout via Stripe. Pause anytime.</span>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
