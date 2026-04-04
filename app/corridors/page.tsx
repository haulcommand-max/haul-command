import { Suspense } from 'react';
import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import Link from 'next/link';
import CorridorLeaderboard from '@/components/corridors/CorridorLeaderboard';
import { RelatedLinks } from '@/components/seo/RelatedLinks';

export const metadata = {
  title: 'Heavy Haul Corridor Intelligence — Ranked Routes Worldwide | Haul Command',
  description:
    'Browse the highest-value heavy haul corridors across 120 countries. Compare escort requirements, pricing, and permit rules by route.',
};

const FILTER_TYPES = [
  { label: 'All', value: '' },
  { label: 'National Spines', value: 'country_spine' },
  { label: 'Port Connectors', value: 'port_connector' },
  { label: 'Industrial', value: 'industrial_connector' },
  { label: 'Cross-Border', value: 'border_connector' },
];

export default async function CorridorsIndexPage({
  searchParams,
}: {
  searchParams: { type?: string; country?: string };
}) {
  const supabase = createServerComponentClient({ cookies });

  // Top-line KPIs from view
  const { data: stats } = await supabase
    .from('hc_corridor_public_v1')
    .select('corridor_type, composite_score, commercial_value_estimate')
    .eq('status', 'active');

  const totalCorridors = stats?.length ?? 0;
  const avgScore =
    totalCorridors > 0
      ? Math.round(
          (stats ?? []).reduce((s, r) => s + (r.composite_score ?? 0), 0) / totalCorridors
        )
      : 0;
  const totalCommercialValue = (stats ?? []).reduce(
    (s, r) => s + (r.commercial_value_estimate ?? 0),
    0
  );

  const activeType = searchParams.type ?? '';
  const activeCountry = searchParams.country ?? '';

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-[#0f1420] to-[#0a0d14] px-4 py-16 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
            🛣 Corridor Intelligence OS
          </span>
          <h1 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
            Global Heavy Haul
            <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Corridor Rankings
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/60">
            Ranked escort routes, permit requirements, and pricing intelligence
            across {totalCorridors.toLocaleString()}+ corridors in 120 countries.
          </p>

          {/* KPI strip */}
          <div className="mt-10 grid grid-cols-3 gap-4">
            {[
              { label: 'Active Corridors', value: totalCorridors.toLocaleString() },
              { label: 'Avg. Intelligence Score', value: avgScore.toString() },
              {
                label: 'Est. Market Value',
                value:
                  '$' +
                  (totalCommercialValue / 1_000_000).toFixed(0) + 'M+',
              },
            ].map(kpi => (
              <div
                key={kpi.label}
                className="rounded-xl border border-white/10 bg-white/5 p-4"
              >
                <p className="text-2xl font-black text-white">{kpi.value}</p>
                <p className="mt-1 text-xs text-white/40">{kpi.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Body */}
      <section className="mx-auto max-w-5xl px-4 py-12">
        {/* Filter bar */}
        <div className="mb-6 flex flex-wrap gap-2">
          {FILTER_TYPES.map(f => (
            <Link
              key={f.value}
              href={`/corridors${f.value ? `?type=${f.value}` : ''}`}
              className={`rounded-full border px-4 py-1.5 text-sm font-medium transition-colors ${
                activeType === f.value
                  ? 'border-amber-500/60 bg-amber-500/20 text-amber-300'
                  : 'border-white/10 bg-white/5 text-white/50 hover:border-white/20 hover:text-white'
              }`}
            >
              {f.label}
            </Link>
          ))}
        </div>

        {/* Leaderboard */}
        <Suspense
          fallback={
            <div className="space-y-3">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="h-16 rounded-xl bg-white/5 animate-pulse" />
              ))}
            </div>
          }
        >
          <CorridorLeaderboard
            limit={50}
            corridorType={activeType || undefined}
            countryCode={activeCountry || undefined}
            showSponsorSlot
          />
        </Suspense>

        {/* Data product CTA */}
        <div className="mt-12 rounded-2xl border border-amber-500/25 bg-gradient-to-br from-amber-500/10 to-orange-500/5 p-8">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Corridor Intelligence Pro</p>
              <h2 className="mt-1 text-xl font-black text-white">Full pricing data, permit maps &amp; demand signals</h2>
              <p className="mt-1 text-sm text-white/50">Unlock rate benchmarks, demand heatmaps, and corridor requirement exports for any route.</p>
            </div>
            <Link
              href="/data-products/corridor-intelligence"
              className="shrink-0 rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
            >
              Unlock Data →
            </Link>
          </div>
        </div>

        {/* SEO equity */}
        <div className="mt-12">
          <RelatedLinks pageType="corridor" />
        </div>
      </section>
    </main>
  );
}
