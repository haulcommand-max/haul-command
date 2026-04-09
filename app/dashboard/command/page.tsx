'use client';

import { useState, useRef, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import { useDynamicPricing } from '@/hooks/useDynamicPricing';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

// ─── ADGRID ITEM TYPES ─────────────────────────────────────
type AdType = 'hotel' | 'classifieds' | 'lead_form' | 'recruiter' | 'bounty' | 'push_campaign';

interface AdSlot {
  id: string;
  type: AdType;
  title: string;
  subtitle: string;
  cta: string;
  onClick: () => void;
}

// ─── COMMAND INPUT ─────────────────────────────────────────
function CommandBar({ onCommand }: { onCommand: (cmd: string) => void }) {
  const [value, setValue] = useState('');
  return (
    <div className="flex gap-2 w-full">
      <input
        className="flex-1 bg-[#0f1117] border border-[#2a2d3a] rounded-lg px-4 py-2 text-sm text-white font-mono placeholder:text-gray-600 focus:outline-none focus:border-[#6d72f6]"
        placeholder="/lock corridor I-10 · /trap scraper · /price corridor US-287"
        value={value}
        onChange={e => setValue(e.target.value)}
        onKeyDown={e => {
          if (e.key === 'Enter' && value.trim()) {
            onCommand(value.trim());
            setValue('');
          }
        }}
      />
      <button aria-label="Interactive Button"
        onClick={() => { if (value.trim()) { onCommand(value.trim()); setValue(''); } }}
        className="bg-[#6d72f6] hover:bg-[#5a5fd6] text-white text-sm px-4 py-2 rounded-lg transition-colors"
      >
        Execute
      </button>
    </div>
  );
}

// ─── AD CARDS ──────────────────────────────────────────────
function HotelBookingCard({ corridor }: { corridor: string }) {
  return (
    <div className="rounded-xl border border-[#1e2230] bg-gradient-to-br from-[#0e1520] to-[#111827] p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <span className="text-2xl">🏨</span>
        <div>
          <p className="text-white font-semibold text-sm">Curfew Hotel Booking</p>
          <p className="text-gray-400 text-xs">Layover-optimized properties along {corridor}</p>
        </div>
        <span className="ml-auto text-xs bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded-full">LIVE</span>
      </div>
      <div className="grid grid-cols-2 gap-2">
        {['Houston Marriott', 'Dallas Drury Inn', 'OKC Hampton', 'Amarillo Days Inn'].map(h => (
          <button aria-label="Interactive Button" key={h} className="text-left text-xs bg-[#1a1f2e] hover:bg-[#252a3a] border border-[#2a2d3a] rounded-lg p-2.5 transition-colors">
            <p className="text-white font-medium">{h}</p>
            <p className="text-green-400 text-xs mt-0.5">Available tonight →</p>
          </button>
        ))}
      </div>
      <button aria-label="Interactive Button" className="w-full bg-amber-500 hover:bg-amber-400 text-white text-xs font-bold py-2 rounded-lg transition-colors">
        BOOK CURFEW LAYOVER · GET 12% COMMISSION
      </button>
    </div>
  );
}

function ClassifiedsFeedCard() {
  const listings = [
    { type: 'Equipment', title: '2022 Pilot Car — 85k mi', price: '$24,500', location: 'Dallas, TX' },
    { type: 'Job', title: 'Escort Driver Needed — I-10 TX', price: '$1,800/wk', location: 'El Paso, TX' },
    { type: 'Equipment', title: 'Height Pole Kit — Full Set', price: '$3,200', location: 'Phoenix, AZ' },
    { type: 'Job', title: 'Flaggers Needed — CO State DOT', price: '$28/hr', location: 'Denver, CO' },
  ];

  return (
    <div className="rounded-xl border border-[#1e2230] bg-gradient-to-br from-[#0e1520] to-[#111827] p-5 flex flex-col gap-3">
      <p className="text-white font-semibold text-sm flex items-center gap-2">
        <span>📋</span> Classifieds Feed
        <span className="ml-auto text-xs text-gray-500">{listings.length} active</span>
      </p>
      <div className="flex flex-col gap-2">
        {listings.map((l, i) => (
          <div key={i} className="flex items-center justify-between bg-[#1a1f2e] rounded-lg px-3 py-2 border border-[#2a2d3a] hover:border-[#6d72f6] cursor-pointer transition-colors">
            <div>
              <span className="text-xs text-[#6d72f6] font-medium">{l.type}</span>
              <p className="text-white text-xs mt-0.5">{l.title}</p>
              <p className="text-gray-500 text-xs">{l.location}</p>
            </div>
            <p className="text-green-400 font-bold text-sm">{l.price}</p>
          </div>
        ))}
      </div>
      <button aria-label="Interactive Button" className="text-[#6d72f6] text-xs hover:underline text-left">Post a listing → $49/month</button>
    </div>
  );
}

function InstantLeadFormCard() {
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="rounded-xl border border-[#1e2230] bg-gradient-to-br from-[#0e1520] to-[#111827] p-5 flex flex-col gap-3">
      <p className="text-white font-semibold text-sm flex items-center gap-2"><span>⚡</span> Instant Lead Form</p>
      {submitted ? (
        <div className="text-center py-4">
          <p className="text-green-400 font-bold text-lg">✓ Lead Dispatched</p>
          <p className="text-gray-400 text-xs mt-1">3 operators will call within 15 minutes.</p>
        </div>
      ) : (
        <>
          <input placeholder="Load origin city" className="bg-[#1a1f2e] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6d72f6]" />
          <input placeholder="Load destination city" className="bg-[#1a1f2e] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6d72f6]" />
          <input placeholder="Phone number" className="bg-[#1a1f2e] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6d72f6]" />
          <button aria-label="Interactive Button" onClick={() => setSubmitted(true)} className="bg-[#6d72f6] hover:bg-[#5a5fd6] text-white text-sm font-bold py-2.5 rounded-lg transition-colors">
            GET 3 ESCORT QUOTES NOW
          </button>
        </>
      )}
    </div>
  );
}

function RecruiterCard() {
  return (
    <div className="rounded-xl border border-[#1e2230] bg-gradient-to-br from-[#0e1520] to-[#111827] p-5 flex flex-col gap-3">
      <p className="text-white font-semibold text-sm flex items-center gap-2"><span>🎯</span> Recruiter Card</p>
      <div className="flex flex-col gap-2">
        {[
          { name: 'SafeRoute Escorts LLC', badge: 'Verified', rate: '$950/day', states: '48 States' },
          { name: 'Titan Pilot Services', badge: 'Premium', rate: '$875/day', states: 'TX, NM, AZ' },
          { name: 'Freedom Flagging Inc.', badge: 'New', rate: '$420/day', states: 'FL, GA, SC' },
        ].map((op, i) => (
          <div key={i} className="flex items-center gap-3 bg-[#1a1f2e] rounded-lg p-3 border border-[#2a2d3a]">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6d72f6] to-[#a855f7] flex items-center justify-center text-white text-sm font-bold">
              {op.name[0]}
            </div>
            <div className="flex-1">
              <p className="text-white text-xs font-semibold">{op.name}</p>
              <p className="text-gray-400 text-xs">{op.states} · {op.rate}</p>
            </div>
            <span className={`text-xs px-2 py-0.5 rounded-full ${op.badge === 'Verified' ? 'bg-green-500/20 text-green-400' : op.badge === 'Premium' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{op.badge}</span>
          </div>
        ))}
      </div>
      <button aria-label="Interactive Button" className="w-full border border-[#6d72f6] text-[#6d72f6] text-xs py-2 rounded-lg hover:bg-[#6d72f6]/10 transition-colors">
        SPONSOR YOUR PROFILE · $299/month
      </button>
    </div>
  );
}

function BountyFlasherCard() {
  const [bounties] = useState([
    { route: 'Houston → Los Angeles', reward: '$2,400', urgency: 'DEPARTING IN 2H', type: 'pilot_car' },
    { route: 'Chicago → Boston', reward: '$1,850', urgency: 'TOMORROW 06:00', type: 'height_pole' },
    { route: 'Atlanta → Miami', reward: '$950', urgency: 'TONIGHT', type: 'flagger' },
  ]);

  return (
    <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-[#1a0a0a] to-[#111827] p-5 flex flex-col gap-3">
      <p className="text-red-400 font-bold text-sm flex items-center gap-2 animate-pulse"><span>🚨</span> LIVE BOUNTIES</p>
      <div className="flex flex-col gap-2">
        {bounties.map((b, i) => (
          <div key={i} className="bg-[#1a1f2e] border border-red-500/20 rounded-lg p-3 flex justify-between items-center">
            <div>
              <p className="text-white text-xs font-medium">{b.route}</p>
              <p className="text-red-400 text-xs mt-0.5">{b.urgency}</p>
            </div>
            <div className="text-right">
              <p className="text-green-400 font-bold">{b.reward}</p>
              <button aria-label="Interactive Button" className="mt-1 text-xs bg-red-600 hover:bg-red-500 text-white px-2 py-0.5 rounded transition-colors">CLAIM</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function PushCampaignCard() {
  const [sent, setSent] = useState(false);
  return (
    <div className="rounded-xl border border-[#1e2230] bg-gradient-to-br from-[#0e1520] to-[#111827] p-5 flex flex-col gap-3">
      <p className="text-white font-semibold text-sm flex items-center gap-2"><span>📣</span> Push Campaign Sender</p>
      <div className="bg-[#1a1f2e] rounded-lg p-3 border border-[#2a2d3a]">
        <p className="text-gray-400 text-xs">Target Audience</p>
        <div className="flex gap-2 mt-2 flex-wrap">
          {['Pilot Cars', 'Flaggers', 'TX Operators', 'Unclaimed'].map(t => (
            <span key={t} className="text-xs bg-[#6d72f6]/20 text-[#6d72f6] px-2 py-0.5 rounded-full cursor-pointer hover:bg-[#6d72f6]/30 transition-colors">{t}</span>
          ))}
        </div>
      </div>
      <textarea
        placeholder="Your message... (SMS + push notification)"
        rows={2}
        className="bg-[#1a1f2e] border border-[#2a2d3a] rounded-lg px-3 py-2 text-sm text-white placeholder:text-gray-600 focus:outline-none focus:border-[#6d72f6] resize-none"
      />
      <div className="flex justify-between items-center">
        <p className="text-gray-500 text-xs">Est. reach: <span className="text-white font-bold">47,832 operators</span></p>
        {sent ? (
          <span className="text-green-400 text-xs font-bold">✓ Campaign Sent</span>
        ) : (
          <button aria-label="Interactive Button" onClick={() => setSent(true)} className="bg-[#6d72f6] hover:bg-[#5a5fd6] text-white text-xs font-bold px-4 py-1.5 rounded-lg transition-colors">
            SEND CAMPAIGN
          </button>
        )}
      </div>
    </div>
  );
}

// ─── DYNAMIC PRICING WIDGET ────────────────────────────────
function PricingWidget() {
  const { brokerFacingPrice, monopolyMargin, isDominating } = useDynamicPricing('I-10 Houston-LA', 1200);
  return (
    <div className={`rounded-xl border p-5 flex flex-col gap-2 ${isDominating ? 'border-green-500/40 bg-gradient-to-br from-[#0a1a0e] to-[#111827]' : 'border-[#1e2230] bg-[#0e1520]'}`}>
      <p className="text-white font-semibold text-sm flex items-center gap-2">
        <span>💹</span> Live Corridor Pricing
        {isDominating && <span className="ml-auto text-xs bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">MONOPOLY LOCK</span>}
      </p>
      <div className="flex justify-between items-end">
        <div>
          <p className="text-gray-400 text-xs">Broker-Facing Rate</p>
          <p className="text-3xl font-black text-white">${brokerFacingPrice.toLocaleString()}</p>
        </div>
        <div className="text-right">
          <p className="text-gray-400 text-xs">Margin Multiplier</p>
          <p className={`text-xl font-bold ${isDominating ? 'text-green-400' : 'text-amber-400'}`}>{monopolyMargin.toFixed(2)}x</p>
        </div>
      </div>
      <div className="w-full bg-[#1a1f2e] rounded-full h-1.5 mt-1">
        <div className="bg-gradient-to-r from-[#6d72f6] to-green-400 h-1.5 rounded-full transition-all duration-1000" style={{ width: `${Math.min(monopolyMargin * 60, 100)}%` }} />
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD EXPORT ─────────────────────────────────
export default function CommandDashboard() {
  const [commandLog, setCommandLog] = useState<string[]>([]);

  const handleCommand = async (cmd: string) => {
    setCommandLog(prev => [`> ${cmd}`, ...prev.slice(0, 4)]);
    try {
      const res = await fetch('/api/command', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
        },
        body: JSON.stringify({ command: cmd })
      });
      const result = await res.json();
      setCommandLog(prev => [`  ↳ ${result.status || result.error || 'executed'}`, ...prev.slice(0, 9)]);
    } catch (e) {
      setCommandLog(prev => [`  ↳ error reaching command bus`, ...prev.slice(0, 9)]);
    }
  };

  return (
    <div className="min-h-screen bg-[#080b11] text-white p-6 font-sans">
      <div className="max-w-7xl mx-auto">

        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-black tracking-tight">⚡ HAUL COMMAND</h1>
            <p className="text-gray-400 text-sm mt-0.5">Unified Command Center · Anti-Gravity Intelligence Stack</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-green-400 text-xs font-medium">DEFENSE ACTIVE</span>
          </div>
        </div>

        {/* Command Bar */}
        <div className="mb-6">
          <CommandBar onCommand={handleCommand} />
          {commandLog.length > 0 && (
            <div className="mt-2 bg-[#0f1117] border border-[#1e2230] rounded-lg p-3">
              {commandLog.map((l, i) => (
                <p key={i} className={`text-xs font-mono ${l.startsWith('>') ? 'text-[#6d72f6]' : 'text-gray-400'}`}>{l}</p>
              ))}
            </div>
          )}
        </div>

        {/* Pricing Widget */}
        <div className="mb-6"><PricingWidget /></div>

        {/* AdGrid */}
        <p className="text-gray-400 text-xs font-medium uppercase tracking-widest mb-4">Monetization Suite</p>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          <HotelBookingCard corridor="I-10 Houston→LA" />
          <ClassifiedsFeedCard />
          <InstantLeadFormCard />
          <RecruiterCard />
          <BountyFlasherCard />
          <PushCampaignCard />
        </div>
      </div>
    </div>
  );
}
