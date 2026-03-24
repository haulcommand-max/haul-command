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

  // Pull recent load board observations (real data)
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const [positionsResult, observationsResult, corridorsResult, volumeResult] = await Promise.all([
    // Live vehicles from Motive
    sb.from('motive_vehicle_positions')
      .select('motive_vehicle_id, provider_id, lat, lng, heading, speed_mph, hos_hours_remaining, driver_name, vehicle_number, recorded_at')
      .gte('recorded_at', new Date(Date.now() - 60 * 60 * 1000).toISOString())
      .order('recorded_at', { ascending: false })
      .limit(20),
    // Recent load observations
    sb.from('lb_observations')
      .select('id, observed_date, origin_city, origin_admin_division, destination_city, destination_admin_division, country_code, service_type, urgency, quoted_amount, quoted_currency, corridor_key, parsed_name_or_company')
      .gte('observed_date', thirtyDaysAgo)
      .eq('board_activity_flag', true)
      .gte('parse_confidence', 0.4)
      .order('observed_date', { ascending: false })
      .limit(25),
    // Active load board corridors
    sb.from('lb_corridors')
      .select('corridor_key, origin_admin_division, destination_admin_division, observation_count, actor_count, avg_price, corridor_strength')
      .order('observation_count', { ascending: false })
      .limit(12),
    // Daily volume aggregates
    sb.from('lb_daily_volume')
      .select('date, total_obs, urgent_count, price_obs_count')
      .gte('date', thirtyDaysAgo)
      .order('date', { ascending: false })
      .limit(30),
  ]);

  const recentPositions = positionsResult.data ?? [];
  const observations = observationsResult.data ?? [];
  const corridors = corridorsResult.data ?? [];
  const dailyVolume = volumeResult.data ?? [];

  const liveVehicleCount = recentPositions.length;
  const hasLoadData = observations.length > 0;
  const totalObs30d = dailyVolume.reduce((sum, d) => sum + (d.total_obs || 0), 0);
  const urgentObs30d = dailyVolume.reduce((sum, d) => sum + (d.urgent_count || 0), 0);

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
          state={hasLoadData ? 'live' : 'planned'}
          countryName="Load Board"
          message={hasLoadData
            ? `${totalObs30d.toLocaleString()} observations in the last 30 days. Live board intelligence active.`
            : 'The Haul Command load board is building data depth. Sign up for alerts below.'}
        />

        <header className="mt-8 mb-8">
          <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Heavy Haul <span className="text-accent">Load Board</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-2xl">
            Post oversize and heavy haul loads for pilot coverage, or find available runs in your AO.
            {hasLoadData ? ' Real observations from active load boards across North America.' : ' Connect with verified pilots on standby.'}
          </p>
        </header>

        {/* ─── Stats Bar ─── */}
        {hasLoadData && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
            {[
              { label: '30-Day Observations', value: totalObs30d.toLocaleString(), icon: '📊' },
              { label: 'Active Corridors', value: corridors.length.toString(), icon: '🛣️' },
              { label: 'Urgent Posts', value: urgentObs30d.toLocaleString(), icon: '🚨' },
              { label: 'Live Vehicles', value: liveVehicleCount.toString(), icon: '📡' },
            ].map(s => (
              <div key={s.label} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 text-center">
                <div className="text-xl mb-1">{s.icon}</div>
                <div className="text-accent font-black text-2xl tabular-nums">{s.value}</div>
                <div className="text-gray-500 text-[10px]">{s.label}</div>
              </div>
            ))}
          </div>
        )}

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
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center hover:border-accent/20 transition-all">
            <div className="text-4xl mb-4">📦</div>
            <h2 className="text-white font-bold text-xl mb-2">I Need Pilot Coverage</h2>
            <p className="text-gray-400 text-sm mb-4">
              Post your oversize load details and get connected with verified pilots on standby near your route.
            </p>
            <Link
              href="/inbox"
              className="inline-block bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors"
            >
              Post a Load →
            </Link>
          </div>
          <div className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 text-center hover:border-accent/20 transition-all">
            <div className="text-4xl mb-4">🔍</div>
            <h2 className="text-white font-bold text-xl mb-2">I Want Runs in My AO</h2>
            <p className="text-gray-400 text-sm mb-4">
              Browse available runs that need pilot coverage. Filter by location, dimensions, and time.
            </p>
            <Link
              href="/schedules/operator"
              className="inline-block bg-white/[0.08] text-white px-6 py-3 rounded-xl font-bold text-sm hover:bg-white/[0.15] transition-colors border border-white/[0.1]"
            >
              Find Runs →
            </Link>
          </div>
        </div>

        {/* ─── Recent Load Board Activity ─── */}
        {hasLoadData && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              Recent Board Activity
              <span className="text-[10px] bg-white/5 text-gray-500 px-2 py-0.5 rounded font-mono ml-2">
                {observations.length} recent
              </span>
            </h2>
            <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[700px]">
                  <thead>
                    <tr className="border-b border-white/5">
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Route</th>
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Type</th>
                      <th className="text-left text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Urgency</th>
                      <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Rate</th>
                      <th className="text-right text-gray-500 text-xs px-5 py-3 font-medium uppercase tracking-wider">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {observations.map((obs) => (
                      <tr key={obs.id} className="border-b border-white/[0.03] hover:bg-white/[0.02] transition-colors">
                        <td className="text-white px-5 py-3 font-medium">
                          <div>{obs.origin_city || obs.origin_admin_division || '—'}</div>
                          <div className="text-gray-500 text-xs">→ {obs.destination_city || obs.destination_admin_division || '—'}</div>
                        </td>
                        <td className="px-5 py-3">
                          <span className="text-xs bg-white/[0.06] text-gray-300 px-2 py-0.5 rounded capitalize">
                            {obs.service_type?.replace(/_/g, ' ') || 'escort'}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`text-xs px-2 py-0.5 rounded font-medium ${
                            obs.urgency === 'urgent' || obs.urgency === 'asap'
                              ? 'bg-red-500/10 text-red-400'
                              : obs.urgency === 'scheduled'
                              ? 'bg-blue-500/10 text-blue-400'
                              : 'bg-white/[0.04] text-gray-500'
                          }`}>
                            {obs.urgency?.replace(/_/g, ' ') || '—'}
                          </span>
                        </td>
                        <td className="text-right px-5 py-3 tabular-nums">
                          {obs.quoted_amount ? (
                            <span className="text-accent font-bold">${Number(obs.quoted_amount).toLocaleString()}</span>
                          ) : (
                            <span className="text-gray-600">—</span>
                          )}
                        </td>
                        <td className="text-right text-gray-500 px-5 py-3 text-xs tabular-nums">
                          {obs.observed_date || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="px-5 py-2 bg-white/[0.01] text-[10px] text-gray-600 flex items-center justify-between">
                <span>Parsed from public load board postings · Confidence ≥ 40% · Pricing where available</span>
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              </div>
            </div>
          </section>
        )}

        {/* ─── Top Corridors from Load Board ─── */}
        {corridors.length > 0 && (
          <section className="mb-12">
            <h2 className="text-xl font-bold text-white mb-4">Top Corridors by Volume</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {corridors.map((c) => (
                <div key={c.corridor_key} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-5 hover:border-accent/20 transition-all">
                  <div className="text-white font-bold text-sm mb-1">
                    {c.origin_admin_division} → {c.destination_admin_division}
                  </div>
                  <div className="flex items-center gap-4 mt-2">
                    <div className="text-[10px] text-gray-500">
                      <span className="text-accent font-bold">{c.observation_count}</span> observations
                    </div>
                    <div className="text-[10px] text-gray-500">
                      <span className="text-white font-bold">{c.actor_count}</span> actors
                    </div>
                    {c.avg_price && (
                      <div className="text-[10px] text-gray-500">
                        avg <span className="text-accent font-bold">${Number(c.avg_price).toFixed(0)}</span>
                      </div>
                    )}
                  </div>
                  <div className="mt-2 h-1 bg-white/[0.04] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-accent/50 rounded-full"
                      style={{ width: `${Math.min(100, (c.corridor_strength ?? 0) * 100)}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Nearby Vehicles Mini-Preview */}
        {recentPositions.length > 0 && (
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
              Get Alerts
            </button>
          </div>
        </div>

        {/* Specialty Project Load Types */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Specialty Project Load Types</h2>
            <span className="text-xs bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-2 py-0.5 rounded-full font-bold">New 2025</span>
          </div>
          <p className="text-gray-500 text-sm mb-5">High-value load categories now bookable as named projects — giga-factory builds, offshore wind, AV loads, and precision equipment moves.</p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '🏭', name: 'Giga-Factory Build', desc: 'Presses, furnaces, reactors — multi-load project tracking', badge: 'LIVE', badgeClass: 'bg-accent/10 text-accent' },
              { icon: '🌊', name: 'Offshore Wind', desc: 'Monopiles, tower sections, nacelles — wind farm logistics', badge: 'LIVE', badgeClass: 'bg-blue-500/10 text-blue-400' },
              { icon: '🤖', name: 'AV Escort', desc: 'Human escort for autonomous heavy haul vehicles', badge: 'AV-CERT', badgeClass: 'bg-cyan-500/10 text-cyan-400' },
              { icon: '🔬', name: 'Precision Equipment', desc: 'EUV machines, semiconductor fab equipment, 5-axis mills', badge: 'PREMIUM', badgeClass: 'bg-purple-500/10 text-purple-400' },
            ].map(t => (
              <div key={t.name} className="bg-white/[0.03] border border-white/[0.06] rounded-xl p-4 hover:border-white/[0.15] transition-all">
                <div className="text-2xl mb-2">{t.icon}</div>
                <div className="flex items-center gap-1.5 mb-1">
                  <span className="text-white font-bold text-xs">{t.name}</span>
                  <span className={`text-[8px] font-black px-1.5 py-0.5 rounded ${t.badgeClass}`}>{t.badge}</span>
                </div>
                <p className="text-gray-600 text-[10px] leading-relaxed">{t.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Revenue Stream Strip */}
        <section className="mb-12">
          <h2 className="text-lg font-bold text-white mb-4">More from Haul Command</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { icon: '⛽', label: 'Fuel Card', sub: 'Rebates on every gallon', href: '/fuel-card' },
              { icon: '📊', label: 'Carbon Reports', sub: 'Scope 3 ESG documentation', href: '/carbon' },
              { icon: '🛡️', label: 'Dispute Resolution', sub: 'GPS-certified incident reports', href: '/dispute' },
              { icon: '🛍️', label: 'Equipment Exchange', sub: 'Buy/sell verified gear', href: '/exchange' },
            ].map(s => (
              <Link key={s.label} href={s.href} className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/20 transition-all group">
                <div className="text-2xl mb-1.5">{s.icon}</div>
                <div className="text-white text-xs font-bold group-hover:text-accent transition-colors">{s.label}</div>
                <div className="text-gray-600 text-[10px]">{s.sub}</div>
              </Link>
            ))}
          </div>
        </section>

        {/* HC Verified CTA */}
        <div className="mb-12">
          <MotiveReferralCTA variant="banner" />
        </div>

        {/* Standing Orders CTA */}
        <section className="mb-12">
          <div className="bg-gradient-to-r from-blue-500/10 to-transparent border border-blue-500/20 rounded-2xl p-6 sm:p-10 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-white font-black text-xl sm:text-2xl tracking-tighter mb-1">
                Recurring <span className="text-blue-400">Loads</span>?
              </h3>
              <p className="text-gray-400 text-sm">
                Set up Standing Orders — pre-funded recurring escort coverage with guaranteed operators.
              </p>
            </div>
            <Link
              href="/schedules/create"
              className="bg-blue-500 text-white px-8 py-3 rounded-xl font-bold text-sm hover:bg-blue-400 transition-colors flex-shrink-0"
            >
              Create Standing Order →
            </Link>
          </div>
        </section>

        <HCClaimCorrectVerifyPanel
          claimAction={{ id: 'claim', label: 'Claim Your Listing', href: '/claim', type: 'claim', priority: 'primary' }}
          contextCopy="Claim your profile so you're on the board when runs start posting."
        />

        <HCFaqModule
          items={[
            { question: 'What load board data does Haul Command track?', answer: 'We parse and analyze public load board postings for oversize, heavy haul, and escort service requests. Each observation includes route, service type, urgency, and pricing when available. Data is sourced from multiple boards and refreshed every 15 minutes.' },
            { question: 'How does posting a load work?', answer: 'Enter load dimensions, route, and timing. We match you with verified pilots on standby who cover your corridor and meet the regulatory requirements for your route. Offers are handled via our secure messaging system with built-in escrow.' },
            { question: 'How do pilots find runs?', answer: 'Pilots set their AO, capabilities, and availability. When a run matches their profile, they get an alert with full details and can respond instantly. Standing order operators get guaranteed recurring runs.' },
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
