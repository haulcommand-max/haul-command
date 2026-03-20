import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Advertiser Dashboard — Haul Command AdGrid',
  description: 'Manage your advertising campaigns on Haul Command. Track impressions, clicks, CTR, and spend across the pilot car network.',
};

/* ══════════════════════════════════════════════════════
   ADGRID — Advertiser Dashboard
   Shows campaign list with performance metrics.
   In V1 this is a static shell since campaigns require auth.
   ══════════════════════════════════════════════════════ */

const DEMO_CAMPAIGNS = [
  {
    id: 'demo-1',
    name: 'I-95 Corridor Sponsor',
    type: 'Corridor Sponsor',
    status: 'active',
    impressions: 12450,
    clicks: 387,
    spend: 1240,
    budget: 3000,
    daysRemaining: 18,
  },
  {
    id: 'demo-2',
    name: 'Southeast Directory Listing',
    type: 'Sponsored Listing',
    status: 'active',
    impressions: 8920,
    clicks: 234,
    spend: 890,
    budget: 1500,
    daysRemaining: 12,
  },
];

export default function AdvertiserDashboard() {
  const hasCampaigns = false; // Will be dynamic once auth+data wired

  return (
    <>
      <Navbar />
      <main className="flex-grow w-full max-w-6xl mx-auto px-4 py-8 sm:py-12 overflow-x-hidden">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tighter">
              Ad <span className="text-accent">Dashboard</span>
            </h1>
            <p className="text-gray-500 text-sm mt-1">Manage your Haul Command advertising campaigns</p>
          </div>
          <Link
            href="/advertise/create"
            className="bg-accent text-black px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
          >
            + New Campaign
          </Link>
        </div>

        {!hasCampaigns ? (
          /* Empty State */
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📊</div>
            <h2 className="text-white font-bold text-xl mb-2">No Campaigns Yet</h2>
            <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
              Reach thousands of pilot car operators and brokers across the Haul Command network.
              Create your first campaign to get started.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 max-w-2xl mx-auto mb-8">
              {[
                { label: 'Operators Tracked', value: '7,335' },
                { label: 'Monthly Searches', value: '50k+' },
                { label: 'Countries', value: '57' },
                { label: 'Avg. CPM', value: '$4.20' },
              ].map((stat) => (
                <div key={stat.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                  <div className="text-accent font-black text-lg">{stat.value}</div>
                  <div className="text-gray-500 text-[10px] mt-0.5">{stat.label}</div>
                </div>
              ))}
            </div>
            <Link
              href="/advertise/create"
              className="inline-flex bg-accent text-black px-8 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors shadow-lg shadow-accent/20"
            >
              Create Your First Campaign →
            </Link>
          </div>
        ) : (
          /* Campaigns Table (wired to real data in production) */
          <div className="space-y-4">
            {DEMO_CAMPAIGNS.map((campaign) => (
              <div
                key={campaign.id}
                className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all"
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-white font-semibold text-sm">{campaign.name}</h3>
                    <span className="text-gray-500 text-xs">{campaign.type}</span>
                  </div>
                  <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                    campaign.status === 'active'
                      ? 'bg-green-500/20 text-green-400'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}>
                    {campaign.status.toUpperCase()}
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase">Impressions</div>
                    <div className="text-white font-bold">{campaign.impressions.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase">Clicks</div>
                    <div className="text-white font-bold">{campaign.clicks.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase">CTR</div>
                    <div className="text-accent font-bold">{(campaign.clicks / campaign.impressions * 100).toFixed(1)}%</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase">Spend</div>
                    <div className="text-white font-bold">${campaign.spend.toLocaleString()} / ${campaign.budget.toLocaleString()}</div>
                  </div>
                  <div>
                    <div className="text-gray-500 text-[10px] uppercase">Days Left</div>
                    <div className="text-white font-bold">{campaign.daysRemaining}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
