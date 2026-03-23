import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';
import { supabaseServer } from '@/lib/supabase-server';
import HCMarketMaturityBanner from '@/components/hc/MarketMaturityBanner';
import HCFaqModule from '@/components/hc/FaqModule';
import HCClaimCorrectVerifyPanel from '@/components/hc/ClaimCorrectVerifyPanel';
import HCTrustGuardrailsModule from '@/components/hc/TrustGuardrailsModule';
import { MotiveReferralCTA } from '@/components/motive';

export const revalidate = 900; // 15 min ISR — matches Motive sync cadence

export const metadata: Metadata = {
  title: 'Heavy Haul Load Board — Post & Find Oversize Loads',
  description:
    'Post oversize loads for escort coverage or find loads in your area. Connect with verified pilot car operators and escort services across 57 countries.',
};

export default async function LoadsPage() {
  const sb = supabaseServer();

  // Pull nearby vehicles from Motive positions (last 1 hour)
  const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { data: recentPositions } = await sb
    .from('motive_vehicle_positions')
    .select('motive_vehicle_id, provider_id, lat, lng, heading, speed_mph, hos_hours_remaining, driver_name, vehicle_number, recorded_at')
    .gte('recorded_at', oneHourAgo)
    .order('recorded_at', { ascending: false })
    .limit(20);

  const liveVehicleCount = recentPositions?.length ?? 0;

  return (
    <>
      <Navbar />
      <main className="flex-grow max-w-7xl mx-auto px-4 py-12">
        {/* Breadcrumbs */}
        <nav className="text-xs text-gray-500 mb-6">
          <Link href="/" className="hover:text-accent">Home</Link>
          <span className="mx-2">›</span>
          <span className="text-white">Load Board</span>
        </nav>

        <HCMarketMaturityBanner
          state="planned"
          countryName="Load Board"
          message="The Haul Command load board is launching soon. Sign up for alerts below."
        />

        <header className="mt-8 mb-12">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Heavy Haul <span className="text-accent">Load Board</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Post oversize and heavy haul loads for pilot coverage, or find available runs in your AO. 
            When live, the board connects brokers with verified pilots on standby.
          </p>
        </header>

        {/* Live Vehicle Count */}
        {liveVehicleCount > 0 && (
          <div className="bg-accent/5 border border-accent/15 rounded-xl px-5 py-4 mb-8 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-white text-sm font-bold">{liveVehicleCount} Pilot Vehicles Tracked Live</span>
            </div>
            <span className="text-gray-500 text-xs">ELD-verified positions · Updated every 15 min</span>
          </div>
        )}

        {/* Two-Path Launcher */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-white font-bold text-xl mb-2">I Need Pilot Coverage</h2>
            <p className="text-gray-400 text-sm mb-4">
              Post your oversize load details and get connected with verified pilots on standby near your route.
            </p>
            <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-accent text-sm font-bold">
              Coming Soon — Join Waitlist ↓
            </div>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-white font-bold text-xl mb-2">I Want Runs in My AO</h2>
            <p className="text-gray-400 text-sm mb-4">
              Browse available runs that need pilot coverage. Filter by location, dimensions, and time.
            </p>
            <div className="bg-accent/10 border border-accent/20 rounded-xl px-4 py-3 text-accent text-sm font-bold">
              Coming Soon — Join Waitlist ↓
            </div>
          </div>
        </div>

        {/* Nearby Vehicles Mini-Preview */}
        {recentPositions && recentPositions.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Live Vehicle Positions
            </h2>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[500px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">Vehicle</th>
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium">Driver</th>
                      <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium">Speed</th>
                      <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium">HOS Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentPositions.slice(0, 8).map((v) => (
                      <tr key={v.motive_vehicle_id + v.recorded_at} className="border-b border-white/[0.03] hover:bg-white/[0.02]">
                        <td className="text-white px-5 py-3 font-medium">{v.vehicle_number || `#${v.motive_vehicle_id.slice(-4)}`}</td>
                        <td className="text-gray-400 px-5 py-3">{v.driver_name || '—'}</td>
                        <td className="text-gray-400 px-5 py-3 text-right tabular-nums">{v.speed_mph != null ? `${Math.round(v.speed_mph)} mph` : '—'}</td>
                        <td className="px-5 py-3 text-right tabular-nums">
                          {v.hos_hours_remaining != null ? (
                            <span className={v.hos_hours_remaining < 2 ? 'text-red-400 font-bold' : 'text-green-400'}>
                              {v.hos_hours_remaining.toFixed(1)}h
                            </span>
                          ) : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2 bg-white/[0.01] text-[10px] text-gray-600">
                Real-time positions from HC Verified operators · ELD data via Motive
              </div>
            </div>
          </section>
        )}

        {/* Alert Capture */}
        <div className="bg-gradient-to-r from-accent/10 to-transparent border border-accent/20 rounded-2xl p-8 mb-12 text-center">
          <h2 className="text-white font-bold text-2xl mb-3">Get Run Alerts</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-lg mx-auto">
            Be the first to know when runs are posted in your AO. Set up alerts by state, corridor, or service type.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="Enter your email"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder:text-gray-600 focus:outline-none focus:border-accent/50"
            />
            <button className="bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors whitespace-nowrap">
              Join Waitlist
            </button>
          </div>
        </div>

        {/* HC Verified CTA */}
        <div className="mb-12">
          <MotiveReferralCTA variant="banner" />
        </div>

        {/* In the meantime — directory and requirements */}
        <div className="space-y-4 mb-12">
          <h2 className="text-xl font-bold text-white">While You Wait</h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link
              href="/directory"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <span className="text-2xl">🔍</span>
              <h3 className="text-white font-bold text-sm mt-2">Browse Directory</h3>
              <p className="text-gray-500 text-xs mt-1">Find pilots by country and category</p>
            </Link>
            <Link
              href="/escort-requirements"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <span className="text-2xl">📋</span>
              <h3 className="text-white font-bold text-sm mt-2">Check Requirements</h3>
              <p className="text-gray-500 text-xs mt-1">Escort rules for 67+ jurisdictions</p>
            </Link>
            <Link
              href="/claim"
              className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/30 transition-all"
            >
              <span className="text-2xl">✅</span>
              <h3 className="text-white font-bold text-sm mt-2">Claim Your Listing</h3>
              <p className="text-gray-500 text-xs mt-1">Get found by brokers and shippers</p>
            </Link>
          </div>
        </div>

        <HCClaimCorrectVerifyPanel
          claimAction={{ id: 'claim', label: 'Claim Your Listing', href: '/claim', type: 'claim', priority: 'primary' }}
          contextCopy="Claim your profile so you're on the board when runs start posting."
        />

        <HCFaqModule
          items={[
            { question: 'When will the load board launch?', answer: 'The Haul Command load board is in development. Join our waitlist to be notified when it goes live. In the meantime, you can browse the directory and claim your listing to be ready.' },
            { question: 'How does posting a load work?', answer: 'When live, you\'ll enter load dimensions, route, and timing. We\'ll match you with verified pilots on standby who cover your corridor and meet the regulatory requirements for your route.' },
            { question: 'How do pilots find runs?', answer: 'Pilots set their AO, capabilities, and availability. When a run matches their profile, they get an alert with full details and can respond instantly.' },
            { question: 'What is HC Verified?', answer: 'HC Verified pilots have connected their ELD (Electronic Logging Device) through Motive, proving they are a real fleet with live tracking. Verified pilots get priority in run matching and display trust badges on their listings.' },
          ]}
        />

        <div className="mt-8">
          <HCTrustGuardrailsModule />
        </div>
      </main>
    </>
  );
}
