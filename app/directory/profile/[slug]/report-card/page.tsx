import type { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';

// ═══════════════════════════════════════════════════════════════
// PUBLIC REPORT CARD — /directory/profile/:slug/report-card
//
// SEO-indexed, public-facing trust and performance proof page.
// Pulls from hc_trust_profiles + hc_global_operators.
// Designed for brokers, shippers, and AI answer engines.
// ═══════════════════════════════════════════════════════════════

export const dynamic = 'force-dynamic';

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const supabase = createClient();
  const { data: op } = await supabase
    .from('hc_global_operators')
    .select('name, city, admin1_code, country_code')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  const name = op?.name || slug.replace(/-/g, ' ');
  const location = [op?.city, op?.admin1_code].filter(Boolean).join(', ');

  return {
    title: `${name} Report Card — Performance & Trust | Haul Command`,
    description: `View ${name}'s verified performance record${location ? ` in ${location}` : ''}: jobs completed, response time, trust score, and verification status across 30/90/180/365-day windows.`,
    alternates: { canonical: `https://haulcommand.com/directory/profile/${slug}/report-card` },
    openGraph: {
      title: `${name} — Trust & Performance Report Card`,
      description: `Verified performance data for ${name}. Trust score, completion rate, and response metrics on Haul Command.`,
      type: 'profile',
    },
  };
}

export default async function PublicReportCardPage({ params }: Props) {
  const { slug } = await params;
  const supabase = createClient();

  // ── Find operator ─────────────────────────────────────────────
  const { data: op } = await supabase
    .from('hc_global_operators')
    .select('id, name, slug, city, admin1_code, country_code, role_primary, user_id, is_claimed, confidence_score')
    .or(`slug.eq.${slug},id.eq.${slug}`)
    .maybeSingle();

  if (!op) notFound();

  // ── Load trust profile (period stats) ────────────────────────
  const { data: tp } = await supabase
    .from('hc_trust_profiles')
    .select(`
      trust_score, identity_verified, insurance_verified, license_verified,
      background_checked, claimed, badges, review_count, review_avg,
      avg_response_min, verified_jobs_count, verified_km_total,
      active_since, last_active_at,
      jobs_30d, jobs_90d, jobs_180d, jobs_365d,
      km_30d, km_90d, km_180d, km_365d,
      avg_rating_30d, avg_rating_90d, avg_rating_180d, avg_rating_365d,
      reviews_30d, reviews_90d, reviews_180d, reviews_365d,
      avg_response_min_30d, avg_response_min_90d,
      avg_response_min_180d, avg_response_min_365d,
      period_stats_refreshed_at, score_computed_at
    `)
    .eq('user_id', op.user_id)
    .maybeSingle();

  const name = op.name || slug.replace(/-/g, ' ');
  const location = [op.city, op.admin1_code].filter(Boolean).join(', ');
  const countryFlag = op.country_code === 'CA' ? '🇨🇦' : op.country_code === 'US' ? '🇺🇸' : '🌍';
  const trustScore = tp?.trust_score ?? op.confidence_score ?? 0;
  const trustPct = Math.min(Math.round(trustScore * 100), 100);

  const PERIODS = [
    { key: '30d', label: '30 Days' },
    { key: '90d', label: '90 Days' },
    { key: '180d', label: '180 Days' },
    { key: '365d', label: '1 Year' },
  ] as const;

  // JSON-LD for AI search / snippet capture
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ProfilePage',
    mainEntity: {
      '@type': 'LocalBusiness',
      name,
      address: {
        '@type': 'PostalAddress',
        addressLocality: op.city,
        addressRegion: op.admin1_code,
        addressCountry: op.country_code,
      },
      aggregateRating: tp?.review_avg ? {
        '@type': 'AggregateRating',
        ratingValue: tp.review_avg,
        reviewCount: tp.review_count ?? 0,
      } : undefined,
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="min-h-screen bg-black text-white">
        {/* ── Hero ── */}
        <section className="pt-28 pb-12 px-4" style={{ background: 'linear-gradient(180deg, rgba(245,158,11,0.08) 0%, transparent 100%)' }}>
          <div className="max-w-4xl mx-auto">
            <Link
              href={`/directory/profile/${op.slug || op.id}`}
              className="text-xs text-amber-500 font-bold hover:underline mb-4 inline-block"
            >
              ← Back to Profile
            </Link>

            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <h1 className="text-3xl md:text-4xl font-black tracking-tight">
                  {name}
                </h1>
                <p className="text-slate-400 text-sm mt-1">
                  {countryFlag} {location || op.country_code} · {op.role_primary || 'Operator'}
                </p>
              </div>

              {/* Trust Score Badge */}
              <div className="shrink-0 text-center">
                <div
                  className="w-20 h-20 rounded-full border-4 flex items-center justify-center text-2xl font-black"
                  style={{
                    borderColor: trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#ef4444',
                    color: trustPct >= 80 ? '#10b981' : trustPct >= 50 ? '#f59e0b' : '#ef4444',
                  }}
                >
                  {trustPct}
                </div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">Trust Score</p>
              </div>
            </div>
          </div>
        </section>

        <div className="max-w-4xl mx-auto px-4 pb-16 space-y-8">

          {/* ── Verification Badges ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Verification Status</h2>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Identity', ok: tp?.identity_verified },
                { label: 'Insurance', ok: tp?.insurance_verified },
                { label: 'License', ok: tp?.license_verified },
                { label: 'Background', ok: tp?.background_checked },
                { label: 'Claimed', ok: tp?.claimed || op.is_claimed },
              ].map(b => (
                <span
                  key={b.label}
                  className={`text-xs font-bold px-3 py-1.5 rounded-full border ${
                    b.ok
                      ? 'bg-emerald-400/10 border-emerald-400/30 text-emerald-400'
                      : 'bg-slate-900 border-slate-800 text-slate-600'
                  }`}
                >
                  {b.ok ? '✓' : '○'} {b.label}
                </span>
              ))}
            </div>
          </section>

          {/* ── Period Performance Grid ── */}
          {tp ? (
            <section>
              <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Performance by Period</h2>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="text-left py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">Metric</th>
                      {PERIODS.map(p => (
                        <th key={p.key} className="text-center py-3 px-4 text-[10px] font-bold uppercase tracking-widest text-slate-500">
                          {p.label}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { label: '✅ Jobs Completed', field: 'jobs', fmt: (v: number | null) => v != null ? v.toLocaleString() : '—' },
                      { label: '🛣️ Km Covered', field: 'km', fmt: (v: number | null) => v != null ? `${(v / 1000).toFixed(1)}K` : '—' },
                      { label: '⭐ Avg Rating', field: 'avg_rating', fmt: (v: number | null) => v != null ? `${v.toFixed(2)}★` : '—' },
                      { label: '📝 Reviews', field: 'reviews', fmt: (v: number | null) => v != null ? v.toLocaleString() : '—' },
                      { label: '⚡ Response', field: 'avg_response_min', fmt: (v: number | null) => v != null ? `${v}m` : '—' },
                    ].map(row => (
                      <tr key={row.label} className="border-b border-slate-800/50 hover:bg-slate-900/50">
                        <td className="py-3 px-4 text-slate-300 font-bold">{row.label}</td>
                        {PERIODS.map(p => {
                          const key = `${row.field}_${p.key}` as keyof typeof tp;
                          const val = tp[key] as number | null;
                          return (
                            <td key={p.key} className="text-center py-3 px-4 font-mono text-white">
                              {row.fmt(val)}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {tp.period_stats_refreshed_at && (
                <p className="text-[10px] text-slate-600 mt-2">
                  Data refreshed: {new Date(tp.period_stats_refreshed_at).toLocaleDateString()}
                </p>
              )}
            </section>
          ) : (
            <section className="rounded-2xl border border-slate-800 bg-slate-900/50 p-10 text-center">
              <p className="text-3xl mb-3">📊</p>
              <p className="font-bold text-slate-300 mb-1">Performance data building</p>
              <p className="text-sm text-slate-500">
                This operator&apos;s report card will populate as verified jobs are completed on Haul Command.
              </p>
            </section>
          )}

          {/* ── All-Time Record ── */}
          <section>
            <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">All-Time Network Record</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: 'Verified Jobs', val: tp?.verified_jobs_count ?? '—', color: 'text-emerald-400' },
                { label: 'Total Distance', val: tp?.verified_km_total ? `${(tp.verified_km_total / 1000).toFixed(0)}K km` : '—', color: 'text-blue-400' },
                { label: 'Avg Rating', val: tp?.review_avg ? `${tp.review_avg.toFixed(2)}★` : '—', color: 'text-amber-400' },
                { label: 'Reviews', val: tp?.review_count ?? '—', color: 'text-purple-400' },
              ].map(k => (
                <div key={k.label} className="bg-slate-900 border border-slate-800 rounded-xl p-4">
                  <p className={`text-2xl font-black ${k.color}`}>{k.val}</p>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mt-1">{k.label}</p>
                </div>
              ))}
            </div>
          </section>

          {/* ── Active Since ── */}
          {tp?.active_since && (
            <section className="flex items-center gap-3 text-sm text-slate-400">
              <span>📅 Active since {new Date(tp.active_since).toLocaleDateString()}</span>
              {tp.last_active_at && (
                <>
                  <span className="text-slate-700">|</span>
                  <span>Last active {new Date(tp.last_active_at).toLocaleDateString()}</span>
                </>
              )}
            </section>
          )}

          {/* ── CTA Block ── */}
          <section className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <p className="font-bold text-amber-400 text-lg">Need this operator?</p>
                <p className="text-sm text-slate-400 mt-1">
                  Request a quote, check availability, or view their full profile.
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <Link
                  href={`/directory/profile/${op.slug || op.id}`}
                  className="px-5 py-2.5 bg-slate-800 text-white text-xs font-black rounded-lg hover:bg-slate-700 transition-colors"
                >
                  View Profile
                </Link>
                <Link
                  href={`/available-now?country=${op.country_code}&region=${op.admin1_code ?? ''}`}
                  className="px-5 py-2.5 bg-amber-500 text-white text-xs font-black rounded-lg hover:bg-amber-400 transition-colors"
                >
                  Check Availability →
                </Link>
              </div>
            </div>
          </section>

          {/* ── Breadcrumb / internal links ── */}
          <nav className="flex flex-wrap gap-2 text-xs text-slate-600">
            <Link href="/directory" className="hover:text-slate-400">Directory</Link>
            <span>/</span>
            <Link href={`/directory/profile/${op.slug || op.id}`} className="hover:text-slate-400">{name}</Link>
            <span>/</span>
            <span className="text-slate-400">Report Card</span>
          </nav>
        </div>
      </div>
    </>
  );
}
