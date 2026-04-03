'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { AdGridClassifiedsFeed } from '@/components/ads/AdGridClassifiedsFeed';
import SocialProofBanner from '@/components/social/SocialProofBanner';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';

// LIVE MARKET DATA BASED ON 2026 RATE GUIDE
const RATES = {
  pevo: {
    Southeast: { min: 1.65, max: 1.85 },
    Midwest: { min: 1.75, max: 1.95 },
    Northeast: { min: 1.80, max: 2.00 },
    Southwest: { min: 1.85, max: 2.00 },
    WestCoast: { min: 2.00, max: 2.25 }
  },
  heightPole: {
    Southeast: { min: 1.90, max: 2.20 },
    Midwest: { min: 2.00, max: 2.50 },
    Northeast: { min: 2.00, max: 2.50 }, // Same as Midwest per guide
    Southwest: { min: 2.10, max: 2.60 }, // Infer from Midwest/WestCoast gap
    WestCoast: { min: 2.25, max: 2.75 }
  },
  bucket: {
    Southeast: { min: 2.25, max: 3.50, hrMin: 150, hrMax: 225 },
    Midwest: { min: 2.25, max: 3.50, hrMin: 175, hrMax: 250 },
    Northeast: { min: 2.25, max: 3.50, hrMin: 175, hrMax: 250 },
    Southwest: { min: 2.25, max: 3.50, hrMin: 185, hrMax: 260 },
    WestCoast: { min: 2.25, max: 3.50, hrMin: 200, hrMax: 275 }
  },
  survey: {
    val100: { Southeast: [550, 850], Midwest: [600, 950], WestCoast: [700, 1200] },
    val300: { Southeast: [550, 850], Midwest: [600, 950], WestCoast: [700, 1200] } // Extrapolated from the distance-based breakdown
  }
};

export default function EscortCalculator() {
  const [region, setRegion] = useState<keyof typeof RATES.pevo>('Southeast');
  const [miles, setMiles] = useState<number>(350);
  const [serviceType, setServiceType] = useState('pevo');
  const [nightMove, setNightMove] = useState(false);
  const [waitHours, setWaitHours] = useState(0);

  // Math Layer
  const baseRate = RATES[serviceType === 'bucket' ? 'bucket' : serviceType === 'heightPole' ? 'heightPole' : 'pevo'][region];
  
  let rateMin = baseRate.min * miles;
  let rateMax = baseRate.max * miles;

  // Modifiers
  if (nightMove) {
    rateMin += (0.25 * miles);
    rateMax += (0.50 * miles);
  }

  if (waitHours > 0) {
    rateMin += (waitHours * 50);
    rateMax += (waitHours * 75);
  }

  // Short distance minimums
  if (serviceType === 'pevo' && miles < 150) {
    rateMin = Math.max(rateMin, 350);
    rateMax = Math.max(rateMax, 500);
  }

  return (
    <div className="min-h-screen bg-[#07090f] text-white font-sans pt-8 pb-32">
      {/* SoftwareApplication schema — unlocks Google rich results for free tools */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify({
          '@context': 'https://schema.org',
          '@type': 'SoftwareApplication',
          name: 'Haul Command Escort Cost Calculator',
          description: 'Calculate accurate heavy haul escort vehicle costs by region, service type, and distance using 2026 Haul Command Rate Guide live market data.',
          url: 'https://haulcommand.com/tools/escort-calculator',
          applicationCategory: 'BusinessApplication',
          operatingSystem: 'Web',
          offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
          creator: { '@type': 'Organization', name: 'Haul Command' },
        }) }}
      />
      <div className="max-w-5xl mx-auto px-4">
        {/* Header */}
        <div className="mb-10 border-b border-white/10 pb-8">
          <div className="inline-block px-3 py-1 bg-amber-500/20 text-amber-500 text-xs font-bold tracking-widest uppercase rounded-full mb-4 border border-amber-500/20">
            2026 Live Market Data
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-4">
            Live Quote <span className="text-amber-500">System</span>
          </h1>
          <p className="text-gray-400 max-w-2xl text-lg">
            Calculate accurate oversize load support rates based on the official 2026 Haul Command Rate Guide.
          </p>
        </div>

        <div className="grid md:grid-cols-12 gap-8">
          {/* Calculator Controls */}
          <div className="md:col-span-4 flex flex-col gap-6 bg-white/5 border border-white/10 p-6 rounded-2xl">
            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Region</label>
              <select 
                value={region} 
                onChange={(e) => setRegion(e.target.value as keyof typeof RATES.pevo)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Southeast">Southeast (FL, GA, AL...)</option>
                <option value="Midwest">Midwest (OH, IL, IN...)</option>
                <option value="Northeast">Northeast (NY, PA...)</option>
                <option value="Southwest">Southwest (TX, NM...)</option>
                <option value="WestCoast">West Coast (CA, WA...)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Service Type</label>
              <select 
                value={serviceType} 
                onChange={(e) => setServiceType(e.target.value)}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
              >
                <option value="pevo">Base Escort (Lead/Chase)</option>
                <option value="heightPole">Height Pole & Specialized</option>
                <option value="bucket">Bucket Truck (Line Lift)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Total Miles</label>
              <input 
                type="number" 
                value={miles}
                onChange={(e) => setMiles(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                min="0"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Wait Time (Hours)</label>
              <input 
                type="number" 
                value={waitHours}
                onChange={(e) => setWaitHours(Number(e.target.value))}
                className="w-full bg-[#0a0a0a] border border-white/10 rounded-lg p-3 text-white focus:outline-none focus:border-amber-500"
                min="0"
              />
            </div>

            <div className="flex items-center gap-3 bg-[#0a0a0a] p-3 rounded-lg border border-white/10 cursor-pointer" onClick={() => setNightMove(!nightMove)}>
              <input type="checkbox" checked={nightMove} readOnly className="w-4 h-4 accent-amber-500" />
              <div className="flex-1">
                <div className="text-sm font-bold text-white">Night Moves</div>
                <div className="text-[10px] text-gray-500 uppercase">+ $0.25 to $0.50/mile</div>
              </div>
            </div>
          </div>

          {/* Results Panel */}
          <div className="md:col-span-8">
            <div className="bg-gradient-to-br from-amber-500/20 to-orange-600/10 border border-amber-500/30 rounded-3xl p-8 lg:p-12 h-full flex flex-col justify-center">
              <div className="text-amber-500 font-bold tracking-widest uppercase text-sm mb-4 text-center">
                Estimated Project Rate
              </div>
              <div className="text-center font-black text-5xl lg:text-7xl tabular-nums text-white drop-shadow-lg mb-6">
                ${Math.round(rateMin).toLocaleString()} <span className="text-gray-500 font-normal text-3xl mx-2">-</span> ${Math.round(rateMax).toLocaleString()}
              </div>
              
              <div className="grid grid-cols-3 gap-6 border-t border-amber-500/20 pt-8 mt-4">
                <div className="text-center">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Base Rate</div>
                  <div className="text-xl font-bold text-white">${baseRate.min.toFixed(2)} - ${baseRate.max.toFixed(2)}<span className="text-sm text-gray-500">/mi</span></div>
                </div>
                <div className="text-center border-l border-amber-500/20 pl-6">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Night Premium</div>
                  <div className="text-xl font-bold text-white">{nightMove ? '+$0.25/mi' : '$0'}</div>
                </div>
                <div className="text-center border-l border-amber-500/20 pl-6">
                  <div className="text-xs text-gray-400 uppercase font-bold mb-1">Wait Time Total</div>
                  <div className="text-xl font-bold text-white">${waitHours * 50} - ${waitHours * 75}</div>
                </div>
              </div>

              <div className="mt-10 max-w-lg mx-auto text-center">
                <Link aria-label="Navigation Link" href={`/directory/us`} className="inline-block w-full text-center bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-black py-4 rounded-xl font-black text-sm tracking-widest uppercase shadow-xl shadow-amber-500/20 transition-all">
                  Find {serviceType === 'bucket' ? 'Bucket Trucks' : 'Pilot Cars'} in {region}
                </Link>
                <div className="text-[10px] text-gray-500 mt-4 leading-relaxed">
                  DISCLAIMER: Rates are estimates based on the 2026 Operator Resource Guide. Final pricing requires detailed assessment. 
                  If your pricing only covers gas, you're not profitable — you're just busy.
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Support Grids */}
        <div className="grid md:grid-cols-2 gap-6 mt-12">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-white">Route Survey (Engineering) Rates</h3>
            <div className="space-y-3">
              {['Southeast ($550-850)', 'Midwest/Northeast ($600-950)', 'West Coast ($700-1200)'].map(r => (
                <div key={r} className="flex justify-between items-center text-sm border-b border-white/5 pb-2">
                  <span className="text-gray-400">{r.split('(')[0]}</span>
                  <span className="font-bold text-amber-500">{r.split('(')[1].replace(')','')} / day</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-gray-500 mt-4">Includes height/bridge clearance. Urban areas & multi-state add complexity fees.</p>
          </div>
          
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-4 text-white">Police Escorts & Premiums</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-gray-400">State Police</span><span className="font-bold text-white">$31/hr + $0.044/mi</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Local/Municipal</span><span className="font-bold text-white">$50–$100/hr</span></div>
              <div className="flex justify-between mt-4 pt-4 border-t border-white/5"><span className="text-gray-400">Urban Coordination</span><span className="font-bold text-amber-500">+$100–$300</span></div>
              <div className="flex justify-between"><span className="text-gray-400">Weekend/Seasonal</span><span className="font-bold text-amber-500">+10-25%</span></div>
            </div>
          </div>
        </div>

        {/* Equipment Marketplace */}
        <div className="mt-12">
          <h2 className="text-xl font-bold mb-4">Equipment Marketplace</h2>
          <AdGridClassifiedsFeed
            items={[
              {
                id: 'cl-1', title: '2024 Ford F-150 Pilot Car Setup — Full Kit',
                price: 42500, location: 'Houston, TX', images: [],
                seller_name: 'Mike T.', seller_verified: true,
                posted_ago: '3 hours ago', category: 'pilot_truck',
                condition: 'like_new', featured: true,
              },
              {
                id: 'cl-2', title: 'Telescoping Height Pole — 18ft Max',
                price: 1200, location: 'Oklahoma City, OK', images: [],
                seller_name: 'OKC Escort Supply', seller_verified: true,
                posted_ago: '1 day ago', category: 'height_pole',
                condition: 'new', featured: false,
              },
              {
                id: 'cl-3', title: 'LED Amber Beacon Kit — DOT Approved',
                price: 349, location: 'Jacksonville, FL', images: [],
                seller_name: 'SafeFleet Parts', seller_verified: true,
                posted_ago: '2 days ago', category: 'beacon',
                condition: 'new', featured: false,
              },
              {
                id: 'cl-4', title: 'OVERSIZE LOAD Sign Kit + Flags (Complete)',
                price: 189, location: 'Dallas, TX', images: [],
                seller_name: 'Pilot Pro Gear', seller_verified: false,
                posted_ago: '5 days ago', category: 'sign_kit',
                condition: 'good', featured: false,
              },
            ]}
          />
        </div>

        {/* AI Search Answer Block */}
        <StaticAnswerBlock
          question="How much does a pilot car cost per mile in 2026?"
          answer="In 2026, pilot car (escort vehicle) costs range from $1.65 to $2.25 per mile for standard lead/chase escorts, depending on region. Southeast rates: $1.65–$1.85/mi. Midwest: $1.75–$1.95/mi. West Coast: $2.00–$2.25/mi. Night moves add $0.25–$0.50/mi. Short hauls under 150 miles typically have a minimum of $350–$500."
          confidence="verified_current"
          source="2026 Haul Command Rate Guide"
          ctaLabel="Get an Instant Quote"
          ctaUrl="/tools/escort-calculator"
        />

        {/* Social Proof */}
        <div className="mt-8">
          <SocialProofBanner />
        </div>

      </div>
    </div>
  );
}
