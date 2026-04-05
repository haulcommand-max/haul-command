import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Suspense } from 'react';
import CorridorLeaderboard from '@/components/corridors/CorridorLeaderboard';

export const metadata = {
  title: 'Haul Command — The Global Heavy Haul Intelligence OS',
  description:
    'Find escort operators, check corridor permits, verify providers, and book heavy haul services across 120 countries.',
};

export default async function HomePage() {
  const supabase = createServerComponentClient({ cookies });

  // Pull live stats
  const [{ count: corridorCount }, { count: operatorCount }] = await Promise.all([
    supabase.from('hc_corridor_public_v1').select('*', { count: 'exact', head: true }).eq('status', 'active'),
    supabase.from('hc_available_now').select('*', { count: 'exact', head: true }),
  ]);

  const liveOperators = operatorCount ?? 0;
  const totalCorridors = corridorCount ?? 309;

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-white/8 px-4 py-24 text-center">
        {/* Ambient gradient */}
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_40%_at_50%_-20%,rgba(251,191,36,0.12),transparent)]" />

        <div className="relative mx-auto max-w-4xl">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5 text-xs font-semibold text-white/60">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
            </span>
            {liveOperators > 0 ? `${liveOperators} operators available now` : '120 countries covered'}
          </div>

          <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl">
            The Global
            <span className="block bg-gradient-to-r from-amber-400 via-orange-400 to-amber-500 bg-clip-text text-transparent">
              Heavy Haul OS
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-white/55">
            Find verified escort operators, check corridor permits, benchmark rates,
            and book heavy haul services across {totalCorridors.toLocaleString()}+ routes in 120 countries.
          </p>

          {/* Primary CTAs */}
          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link
              href="/available-now"
              className="inline-flex items-center gap-2 rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-black hover:bg-amber-400 transition-colors"
            >
              <span className="h-2 w-2 rounded-full bg-black/40" />
              Find Available Operators
            </Link>
            <Link
              href="/route-check"
              className="rounded-xl border border-white/15 px-7 py-3.5 text-base font-semibold text-white hover:border-white/30 transition-colors"
            >
              Check a Route
            </Link>
          </div>

          {/* Quick-link pills */}
          <div className="mt-8 flex flex-wrap justify-center gap-2">
            {[
              { href: '/corridors', label: '🛣 Corridors' },
              { href: '/glossary', label: '📚 Glossary' },
              { href: '/escort-requirements', label: '📋 Escort Rules' },
              { href: '/data-products/corridor-intelligence', label: '📊 Rate Data' },
              { href: '/advertise', label: '📢 Advertise' },
            ].map(p => (
              <Link
                key={p.href}
                href={p.href}
                className="rounded-full border border-white/10 bg-white/4 px-3.5 py-1.5 text-xs font-medium text-white/60 hover:border-white/20 hover:text-white transition-colors"
              >
                {p.label}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* KPI strip */}
      <section className="border-b border-white/8 bg-white/2">
        <div className="mx-auto grid max-w-5xl grid-cols-2 divide-x divide-white/8 sm:grid-cols-4">
          {[
            { label: 'Countries', value: '120' },
            { label: 'Corridors', value: totalCorridors.toLocaleString() },
            { label: 'Live Operators', value: liveOperators > 0 ? liveOperators.toLocaleString() : '—' },
            { label: 'Credential Types', value: '60+' },
          ].map(kpi => (
            <div key={kpi.label} className="px-6 py-5 text-center">
              <p className="text-2xl font-black text-white">{kpi.value}</p>
              <p className="mt-0.5 text-xs text-white/35">{kpi.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Corridor leaderboard strip */}
      <section className="mx-auto max-w-5xl px-4 py-14">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Intelligence OS</p>
            <h2 className="mt-1 text-2xl font-black text-white">Top Ranked Corridors</h2>
          </div>
          <Link
            href="/corridors"
            className="text-sm font-semibold text-white/40 hover:text-white transition-colors"
          >
            View all {totalCorridors.toLocaleString()} →
          </Link>
        </div>
        <Suspense fallback={
          <div className="space-y-3">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
            ))}
          </div>
        }>
          <CorridorLeaderboard limit={8} showSponsorSlot={false} />
        </Suspense>
        <div className="mt-6 text-center">
          <Link
            href="/corridors"
            className="rounded-xl border border-white/10 px-6 py-2.5 text-sm font-semibold text-white/50 hover:border-amber-500/30 hover:text-amber-400 transition-colors"
          >
            See full corridor leaderboard →
          </Link>
        </div>
      </section>

      {/* Role CTA split */}
      <section className="border-t border-white/8 bg-[#0f1420] px-4 py-14">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-8 text-center text-2xl font-black text-white">Who is Haul Command for?</h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              {
                icon: '🚛',
                role: 'Operators & Escorts',
                desc: 'Broadcast availability, get load matches, build your trust score, earn more.',
                cta: 'Broadcast availability',
                href: '/available-now/broadcast',
              },
              {
                icon: '📋',
                role: 'Brokers & Dispatchers',
                desc: 'Find verified capacity fast, verify providers, post loads, and track compliance.',
                cta: 'Find capacity now',
                href: '/available-now',
              },
              {
                icon: '🌐',
                role: 'Shippers & Planners',
                desc: 'Check corridor requirements, benchmark rates, and plan compliant heavy haul moves.',
                cta: 'Plan a route',
                href: '/route-check',
              },
            ].map(r => (
              <div key={r.role} className="rounded-2xl border border-white/8 bg-white/4 p-6">
                <span className="text-3xl">{r.icon}</span>
                <h3 className="mt-3 font-bold text-white">{r.role}</h3>
                <p className="mt-1 text-sm text-white/50">{r.desc}</p>
                <Link
                  href={r.href}
                  className="mt-5 inline-flex rounded-xl bg-white/8 px-4 py-2 text-sm font-semibold text-white hover:bg-white/15 transition-colors"
                >
                  {r.cta} →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AdGrid sponsor call-to-action */}
      <section className="border-t border-white/8 px-4 py-10">
        <div className="mx-auto max-w-3xl rounded-2xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">AdGrid</p>
          <h2 className="mt-2 text-xl font-black text-white">Reach heavy haul professionals where they make decisions</h2>
          <p className="mt-2 text-sm text-white/50">Sponsor corridors, country hubs, tools, and leaderboards. Self-serve, geo-aware, role-targeted.</p>
          <Link
            href="/advertise"
            className="mt-5 inline-flex rounded-xl border border-amber-500/30 bg-amber-500/10 px-6 py-2.5 text-sm font-bold text-amber-300 hover:bg-amber-500/20 transition-colors"
          >
            Get started with AdGrid →
          </Link>
        </div>
      </section>
    </main>
  );
}
