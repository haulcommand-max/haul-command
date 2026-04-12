import Link from 'next/link';
import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import RelatedLinks from '@/components/seo/RelatedLinks';

export const metadata = {
  title: 'Corridor Intelligence Data Product â€” Rate Benchmarks & Permit Maps | Haul Command',
  description:
    'Unlock escort rate benchmarks, permit requirement maps, and demand signals across 300+ heavy haul corridors worldwide. Enterprise API and export available.',
};

const TIERS = [
  {
    id: 'corridor-starter',
    name: 'Corridor Starter',
    price: '$49',
    cadence: '/ mo',
    description: 'Single-corridor deep dive for operators and brokers.',
    features: [
      '1 corridor â€” full rate benchmark (min/median/max)',
      'Permit requirement summary',
      'Credential types required',
      'Freshness & confidence state',
      'PDF export',
    ],
    cta: 'Start for $49',
    href: '/checkout?product=corridor-starter',
    highlight: false,
  },
  {
    id: 'corridor-pro',
    name: 'Corridor Pro',
    price: '$199',
    cadence: '/ mo',
    description: 'Multi-corridor coverage for active carriers, brokers, and dispatchers.',
    features: [
      'Up to 25 corridors â€” full rate benchmarks',
      'Cross-border permit maps',
      'Demand signal previews',
      'Credential requirement exports',
      'CSV + PDF export',
      'Priority freshness alerts',
    ],
    cta: 'Start Pro',
    href: '/checkout?product=corridor-pro',
    highlight: true,
  },
  {
    id: 'corridor-enterprise',
    name: 'Enterprise API',
    price: 'Custom',
    cadence: '',
    description: 'Full corridor dataset, API access, and white-label options for TMS and enterprise operators.',
    features: [
      'All 300+ corridors globally',
      'Real-time API (REST + webhook)',
      'Demand signal feeds',
      'Bulk export (CSV, JSON, Parquet)',
      'White-label data surfaces',
      'Custom research on request',
      'SLA + dedicated support',
    ],
    cta: 'Talk to Sales',
    href: '/contact?intent=corridor-enterprise',
    highlight: false,
  },
];

const SAMPLE_CORRIDORS = [
  { name: 'I-10 Los Angeles to Houston', country: 'US', type: 'National Spine', score: 94 },
  { name: 'Port Houston to Dallas', country: 'US', type: 'Port Connector', score: 91 },
  { name: 'Trans-Canada TCH Ontario', country: 'CA', type: 'National Spine', score: 88 },
  { name: 'Riyadh to NEOM Megaproject', country: 'SA', type: 'Industrial', score: 87 },
  { name: 'Port Santos to SÃ£o Paulo', country: 'BR', type: 'Port Connector', score: 84 },
  { name: 'Atacama Santiago to Calama', country: 'CL', type: 'Mining', score: 83 },
  { name: 'Singapore to Johor Bahru XBRD', country: 'SG', type: 'Cross-Border', score: 82 },
  { name: 'Durban to Johannesburg N3', country: 'ZA', type: 'National Spine', score: 80 },
];

const BLURRED_PRICE_ROWS = [
  { label: 'Escort rate (median)', value: '$X.XX / km' },
  { label: 'Escort rate (95th pct)', value: '$X.XX / km' },
  { label: 'Operator rate (median)', value: '$X.XX / km' },
  { label: 'Urgent fill premium', value: '$X.XX / km' },
  { label: 'Permit cost (median)', value: '$X,XXX' },
  { label: 'Route survey rate', value: '$X,XXX / trip' },
];

export default async function CorridorIntelligencePage() {
  const supabase = createServerComponentClient({ cookies });
  const { count } = await supabase
    .from('hc_corridor_public_v1')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'active');

  const totalCorridors = count ?? 309;

  return (
    <main className=" bg-[#0a0d14] text-white">
      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-[#0f1420] to-[#0a0d14] px-4 py-20 text-center">
        <div className="mx-auto max-w-3xl">
          <span className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-amber-400">
            ðŸ“Š Data Products OS
          </span>
          <h1 className="mt-5 text-4xl font-black tracking-tight sm:text-5xl">
            Corridor Intelligence
            <span className="block bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              Data &amp; Rate Benchmarks
            </span>
          </h1>
          <p className="mt-4 text-lg text-white/60">
            The only data product covering escort rates, permit requirements, demand
            signals, and credential maps across {totalCorridors.toLocaleString()}+
            heavy haul corridors in 120 countries.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <Link
              href="#pricing"
              className="rounded-xl bg-amber-500 px-6 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
            >
              View Pricing
            </Link>
            <Link
              href="/corridors"
              className="rounded-xl border border-white/15 px-6 py-3 text-sm font-semibold text-white/80 hover:border-white/30 transition-colors"
            >
              Browse Corridors
            </Link>
          </div>
        </div>
      </section>

      {/* Paywall teaser â€” blurred pricing table */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-bold text-white">Sample: Port of Jebel Ali to Dubai â€” Rate Benchmark</h2>
          <span className="rounded-md border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">Preview</span>
        </div>
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/4">
          {/* Visible header */}
          <div className="grid grid-cols-2 border-b border-white/10 bg-white/5 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white/40">
            <span>Rate Type</span>
            <span className="text-right">Value (USD)</span>
          </div>
          {/* Blurred rows */}
          {BLURRED_PRICE_ROWS.map((row, i) => (
            <div
              key={row.label}
              className={`grid grid-cols-2 px-6 py-3 text-sm ${
                i % 2 === 0 ? 'bg-white/2' : ''
              } ${i >= 2 ? 'blur-sm select-none' : ''}`}
            >
              <span className="text-white/70">{row.label}</span>
              <span className="text-right font-mono font-semibold text-white">
                {i < 2 ? 'â€”' : row.value}
              </span>
            </div>
          ))}
          {/* Paywall overlay */}
          <div className="absolute inset-0 flex flex-col items-center justify-end bg-gradient-to-t from-[#0a0d14] via-[#0a0d14]/80 to-transparent pb-8">
            <p className="mb-4 text-sm font-semibold text-white/70">Unlock full rate benchmarks for this corridor</p>
            <Link
              href="/checkout?product=corridor-starter"
              className="rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-white hover:bg-amber-400 transition-colors"
            >
              Unlock for $49 / mo
            </Link>
          </div>
        </div>

        {/* Coverage list */}
        <div className="mt-12">
          <h2 className="mb-6 text-xl font-black text-white">Sample corridors covered</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {SAMPLE_CORRIDORS.map(c => (
              <div
                key={c.name}
                className="flex items-center gap-3 rounded-xl border border-white/8 bg-white/4 px-4 py-3"
              >
                <span className="shrink-0 rounded-md bg-white/8 px-2 py-0.5 text-xs font-bold text-white/50">
                  {c.country}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-white">{c.name}</p>
                  <p className="text-xs text-white/40">{c.type}</p>
                </div>
                <span className="shrink-0 rounded-full bg-amber-500/20 px-2 py-0.5 text-xs font-bold text-amber-300">
                  {c.score}
                </span>
              </div>
            ))}
          </div>
          <p className="mt-4 text-center text-sm text-white/40">
            + {(totalCorridors - SAMPLE_CORRIDORS.length).toLocaleString()} more corridors across 120 countries
          </p>
        </div>
      </section>

      {/* Pricing tiers */}
      <section id="pricing" className="border-t border-white/8 bg-[#0f1420] px-4 py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="mb-2 text-center text-3xl font-black text-white">Corridor Intelligence Pricing</h2>
          <p className="mb-10 text-center text-sm text-white/50">Cancel anytime. No setup fees. Enterprise custom pricing available.</p>
          <div className="grid gap-6 sm:grid-cols-3">
            {TIERS.map(t => (
              <div
                key={t.id}
                className={`relative flex flex-col rounded-2xl border p-6 ${
                  t.highlight
                    ? 'border-amber-500/50 bg-amber-500/8 ring-1 ring-amber-500/30'
                    : 'border-white/10 bg-white/4'
                }`}
              >
                {t.highlight && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-amber-500 px-4 py-0.5 text-xs font-bold text-white">
                    Most Popular
                  </span>
                )}
                <p className="text-xs font-semibold uppercase tracking-widest text-white/40">{t.name}</p>
                <div className="mt-3 flex items-end gap-1">
                  <span className="text-4xl font-black text-white">{t.price}</span>
                  <span className="mb-1 text-sm text-white/40">{t.cadence}</span>
                </div>
                <p className="mt-2 text-sm text-white/50">{t.description}</p>
                <ul className="mt-5 flex-1 space-y-2">
                  {t.features.map(f => (
                    <li key={f} className="flex items-start gap-2 text-sm text-white/70">
                      <span className="mt-0.5 text-amber-400">âœ“</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link
                  href={t.href}
                  className={`mt-6 rounded-xl py-3 text-center text-sm font-bold transition-colors ${
                    t.highlight
                      ? 'bg-amber-500 text-white hover:bg-amber-400'
                      : 'border border-white/15 text-white hover:border-white/30'
                  }`}
                >
                  {t.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What data you get */}
      <section className="mx-auto max-w-4xl px-4 py-16">
        <h2 className="mb-8 text-2xl font-black text-white">What's inside every corridor report</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { icon: 'ðŸ’°', label: 'Rate Benchmarks', desc: 'Min, median, 95th pct escort and operator rates per corridor' },
            { icon: 'ðŸ“‹', label: 'Permit Maps', desc: 'Which permits are required, who issues them, processing time' },
            { icon: 'ðŸªª', label: 'Credential Requirements', desc: 'Required and preferred credentials per corridor and country' },
            { icon: 'ðŸ“ˆ', label: 'Demand Signals', desc: 'Search volume and commercial value estimates by corridor' },
            { icon: 'ðŸŒ', label: 'Cross-Border Logic', desc: 'Dual-permit requirements and customs documents for border corridors' },
            { icon: 'ðŸ”„', label: 'Freshness State', desc: 'Confidence scores and data freshness rating per requirement' },
          ].map(card => (
            <div key={card.label} className="rounded-xl border border-white/8 bg-white/4 p-5">
              <span className="text-2xl">{card.icon}</span>
              <p className="mt-3 font-semibold text-white">{card.label}</p>
              <p className="mt-1 text-sm text-white/50">{card.desc}</p>
            </div>
          ))}
        </div>

        <div className="mt-12">
          <RelatedLinks pageType="tool" />
        </div>
      </section>
    </main>
  );
}