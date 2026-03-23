import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertiser Dashboard — Haul Command AdGrid',
  description: 'Manage your advertising campaigns on Haul Command. Track impressions, clicks, CTR, and spend across the pilot car network.',
};

/* ══════════════════════════════════════════════════════
   ADGRID — Advertiser Dashboard (Option B AdOS expansion)
   External companies advertise exactly to target segments.
   ══════════════════════════════════════════════════════ */

const DEMO_CAMPAIGNS = [
  {
    id: 'demo-1',
    name: 'I-95 Corridor Takeover',
    tier: 'Exclusive Corridor Sponsor',
    status: 'active',
    impressions: 42450,
    clicks: 1387,
    spend: 149,
    budget: 149,
    daysRemaining: 18,
    segment: 'All Operators',
  },
  {
    id: 'demo-2',
    name: 'Pilot Car Insurance Retargeting',
    tier: 'Run of Network',
    status: 'active',
    impressions: 18920,
    clicks: 434,
    spend: 19,
    budget: 19,
    daysRemaining: 12,
    segment: 'Unverified Operators',
  },
];

export default function AdvertiserDashboard() {
  const hasCampaigns = DEMO_CAMPAIGNS.length > 0;

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-7xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              AdGrid <span className="text-accent">OS</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Self-serve enterprise advertising for the heavy haul industry</p>
          </div>
          <Link
            href="/advertise/create"
            className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shrink-0"
          >
            + New Campaign
          </Link>
        </div>

        {/* Audience Segments Insight */}
        <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 mb-8">
          <h2 className="text-white font-bold text-lg mb-4">AdGrid Network Audiences</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
              <div className="text-accent text-xl font-black">7,335</div>
              <div className="text-white font-bold text-xs uppercase my-1">Fuel Card Segment</div>
              <div className="text-gray-500 text-[10px]">Target all active verified operators logging daily miles</div>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
              <div className="text-accent text-xl font-black">1,820</div>
              <div className="text-white font-bold text-xs uppercase my-1">Insurance Segment</div>
              <div className="text-gray-500 text-[10px]">Target newly registered, unverified profile operators</div>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
              <div className="text-accent text-xl font-black">2,410</div>
              <div className="text-white font-bold text-xs uppercase my-1">Equipment Segment</div>
              <div className="text-gray-500 text-[10px]">Target new operators standing up their first rig</div>
            </div>
            <div className="bg-black/40 border border-white/5 p-4 rounded-xl">
              <div className="text-accent text-xl font-black">3,105</div>
              <div className="text-white font-bold text-xs uppercase my-1">Hotel Segment</div>
              <div className="text-gray-500 text-[10px]">Target operators actively running multi-day corridors</div>
            </div>
          </div>
        </div>

        {/* Active Campaigns Table */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Your Active Campaigns</h2>
            <div className="text-xs text-gray-500">
              Pricing: $19/mo (Network), $59/mo (Corridor), $149/mo (Exclusive)
            </div>
          </div>
          
          <div className="space-y-4">
            {DEMO_CAMPAIGNS.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all"
              >
                <div className="flex flex-col sm:flex-row justify-between mb-4 gap-2">
                  <div>
                    <h3 className="text-white font-bold text-base">{campaign.name}</h3>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-accent text-xs font-semibold">{campaign.tier}</span>
                      <span className="text-gray-600 text-[10px]">|</span>
                      <span className="text-gray-400 text-xs">Targeting: {campaign.segment}</span>
                    </div>
                  </div>
                  <div className="self-start">
                    <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-green-500/10 text-green-400">
                      {campaign.status.toUpperCase()}
                    </span>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 bg-black/30 p-4 rounded-lg border border-white/5">
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Impressions</div>
                    <div className="text-white font-bold">{campaign.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Clicks</div>
                    <div className="text-white font-bold">{campaign.clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">CTR</div>
                    <div className="text-accent font-bold">{(campaign.clicks / campaign.impressions * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Budget Use</div>
                    <div className="text-white font-bold">${campaign.spend} <span className="text-gray-500 font-normal">/ mo</span></div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-1">Cycle Renews</div>
                    <div className="text-white font-bold">{campaign.daysRemaining} Days</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
