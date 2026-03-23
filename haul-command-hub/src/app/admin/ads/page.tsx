import Navbar from '@/components/Navbar';
import Link from 'next/link';

export const metadata = {
  title: 'Ad Revenue Dashboard | Haul Command Admin',
};

// Mock data representing the 2-sided AdGrid marketplace performance
const AD_STATS = {
  totalRevenue: 28450,
  projectedRevenue: 34500,
  activeAdvertisers: 284,
  networkFillRate: 84.5,
};

const TOP_PLACEMENTS = [
  { name: 'I-10 Corridor Load Board', type: 'Exclusive', revenue: '$9,250', ctr: '4.2%' },
  { name: 'Texas Triangle Map Header', type: 'Corridor', revenue: '$4,500', ctr: '3.8%' },
  { name: 'Unverified Operator Push', type: 'Run of Network', revenue: '$3,800', ctr: '8.1%' },
  { name: 'Directory: Route Planners', type: 'Corridor', revenue: '$2,100', ctr: '2.5%' },
];

const TOP_ADVERTISERS = [
  { name: 'Peterbilt Southwest', segment: 'Equipment', spend: '$2,150/mo' },
  { name: 'Escort Guard Insurance', segment: 'Insurance', spend: '$1,800/mo' },
  { name: 'Love\'s Travel Stops', segment: 'Fuel/Hotel', spend: '$1,500/mo' },
  { name: 'Titan Heavy Haul Permits', segment: 'Permits', spend: '$900/mo' },
];

export default function AdminAdsDashboard() {
  return (
    <>
      <Navbar />
      <main className="max-w-7xl mx-auto px-4 py-8 overflow-x-hidden">
        <div className="mb-8">
          <Link href="/admin/system" className="text-gray-500 text-xs font-bold hover:text-accent mb-2 inline-block">← Back to Admin</Link>
          <h1 className="text-3xl font-black text-white">
            AdGrid <span className="text-accent">Revenue OS</span>
          </h1>
          <p className="text-gray-400 text-sm mt-1">Platform advertising economics and placement performance.</p>
        </div>

        {/* High Level Economics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-to-br from-white/[0.04] to-transparent border border-white/[0.06] p-5 rounded-2xl">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">Total Monthly Revenue</div>
            <div className="text-3xl font-black text-green-400">${AD_STATS.totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-green-500/60 mt-2">↑ 18% from last month</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">Projected Monthly</div>
            <div className="text-3xl font-black text-white">${AD_STATS.projectedRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-500 mt-2">Based on active subscriptions ($19-$149)</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">Active Advertisers</div>
            <div className="text-3xl font-black text-white">{AD_STATS.activeAdvertisers}</div>
            <div className="text-xs text-gray-500 mt-2">B2B clients on subscription</div>
          </div>
          <div className="bg-white/[0.02] border border-white/[0.06] p-5 rounded-2xl">
            <div className="text-gray-500 text-[10px] uppercase font-bold tracking-wider mb-2">Network Inventory Fill</div>
            <div className="text-3xl font-black text-accent">{AD_STATS.networkFillRate}%</div>
            <div className="text-xs text-gray-500 mt-2">Ad impression utilization</div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Top Advertisers */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Top Advertisers</h2>
            <div className="space-y-3">
              {TOP_ADVERTISERS.map((ad, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent font-bold text-xs">{i + 1}</div>
                    <div>
                      <div className="text-white text-sm font-bold">{ad.name}</div>
                      <div className="text-gray-500 text-[10px] uppercase">{ad.segment} Segment</div>
                    </div>
                  </div>
                  <div className="text-accent font-bold text-sm tracking-wide">{ad.spend}</div>
                </div>
              ))}
            </div>
            <button className="w-full mt-4 bg-white/5 hover:bg-white/10 text-white text-xs font-bold py-3 rounded-xl transition-colors">
              Export Advertiser Ledger (CSV)
            </button>
          </section>

          {/* Top Placements */}
          <section className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h2 className="text-lg font-bold text-white mb-4">Top Performing Placements</h2>
            <div className="space-y-3">
              {TOP_PLACEMENTS.map((place, i) => (
                <div key={i} className="flex items-center justify-between p-3 rounded-lg bg-black/40 border border-white/5">
                  <div>
                    <div className="text-white text-sm font-bold">{place.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] bg-accent/10 text-accent px-2 py-0.5 rounded font-bold">{place.type}</span>
                      <span className="text-gray-500 text-[10px]">CTR: <span className="text-gray-300">{place.ctr}</span></span>
                    </div>
                  </div>
                  <div className="text-green-400 font-bold text-sm">{place.revenue}</div>
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </>
  );
}
