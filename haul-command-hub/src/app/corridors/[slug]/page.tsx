import Link from 'next/link';
import type { Metadata } from 'next';
import { HCBreadcrumbs } from '@/components/hc/Breadcrumbs';
import { HCLocalIntroCopy } from '@/components/hc/LocalIntroCopy';
import { HCAlertSignupModule } from '@/components/hc/AlertSignupModule';
import { HCSourceFreshnessPanel } from '@/components/hc/SourceFreshnessPanel';
import { HCMethodologyPanel } from '@/components/hc/MethodologyPanel';
import { HCUrgentFillModule } from '@/components/hc/UrgentFillModule';
import { HCNearbyEntitiesModule } from '@/components/hc/NearbyEntitiesModule';
import { HeroBillboard } from '@/components/hc/HeroBillboard';
import { InlineBillboard } from '@/components/hc/InlineBillboard';
import { SidecarSponsor } from '@/components/hc/SidecarSponsor';
import { StickyMobileChipRail } from '@/components/hc/StickyMobileChipRail';
import { getCorridorBySlug, getCorridorOperators } from '@/lib/hc-loaders/corridor';
import { getCreativesForSlot, getCorridorSignals } from '@/lib/ad-engine';
import { getCorridorSignalBadge } from '@/lib/corridor-signals';
import { supabaseServer } from '@/lib/supabase-server';
import type { HCLink } from '@/lib/hc-types';

export const revalidate = 86400;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const c = await getCorridorBySlug(slug);
  const name = c?.name ?? slug;
  const desc = c ? `${c.origin_city}, ${c.origin_state} to ${c.dest_city}, ${c.dest_state}${c.miles ? ` — ${c.miles} miles` : ''}.` : '';
  return {
    title:`${name} — Heavy Haul Corridor Intelligence`,
    description: `Corridor intelligence for ${name}. ${desc} View operators, rates, escort requirements, and market activity.`,
  };
}

export default async function CorridorDetailPage({ params }: Props) {
  const { slug } = await params;
  const corridor = await getCorridorBySlug(slug);

  if (!corridor) {
    return (
      <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen">
        <HCBreadcrumbs crumbs={[{ label: 'Corridors', href: '/corridors' }, { label: slug, isCurrent: true }]} />
        <HCLocalIntroCopy h1={`Corridor: ${slug}`} intro="This corridor page is being built. Sign up below to be notified when data is available." />
        <HCAlertSignupModule context={`corridor ${slug}`} alertType="corridor" contextKey={`corridor:${slug}`} corridorSlug={slug} showPremiumTier />
        <section className="mt-8">
          <Link href="/corridors" className="text-sm text-accent hover:underline font-bold">← Browse All Corridors</Link>
        </section>
      </main>
    );
  }

  // Parallel data loading
  const [operators, signals, heroAds, inlineAds, sidecarAds, chipAds] = await Promise.all([
    getCorridorOperators(slug, 10),
    getCorridorSignals(slug),
    getCreativesForSlot({ slotFamily: 'hero_billboard', pageType: 'corridor_page', corridorSlug: slug, maxCreatives: 6 }),
    getCreativesForSlot({ slotFamily: 'inline_billboard', pageType: 'corridor_page', corridorSlug: slug, maxCreatives: 8 }),
    getCreativesForSlot({ slotFamily: 'sidecar_sponsor', pageType: 'corridor_page', corridorSlug: slug }),
    getCreativesForSlot({ slotFamily: 'sticky_mobile_chip_rail', pageType: 'corridor_page', corridorSlug: slug, maxCreatives: 10 }),
  ]);

  // Try to load rates from hc_rates_public
  let rateData: { rate_low: number | null; rate_mid: number | null; rate_high: number | null; methodology_url: string | null; freshness_timestamp: string | null; change_vs_7d_pct: number | null } | null = null;
  try {
    const sb = supabaseServer();
    const { data } = await sb.from('hc_rates_public').select('rate_low, rate_mid, rate_high, methodology_url, freshness_timestamp, change_vs_7d_pct').eq('surface_key', `corridor:${slug}`).maybeSingle();
    rateData = data;
  } catch { /* table may not be populated */ }

  // Build corridor signal badge
  const signalBadge = signals ? getCorridorSignalBadge({
    corridorSlug: slug,
    operatorCount: signals.operator_count ?? operators.length,
    claimedOperatorCount: signals.claimed_operator_count ?? 0,
    recentActivity7d: signals.recent_activity_count_7d ?? 0,
    recentActivity30d: signals.recent_activity_count_30d ?? 0,
    pageSessions30d: signals.page_sessions_30d ?? 0,
    claimDensity: signals.claim_density ?? 0,
    hardFill: signals.hard_fill ?? false,
    hotCorridor: signals.hot_corridor ?? false,
    thinCorridor: signals.thin_corridor ?? (operators.length < 3),
    sponsorEligible: signals.sponsor_eligible ?? false,
    sponsorFloorUsd: signals.sponsor_floor_usd ?? null,
    rateChangeVs7dPct: signals.rate_change_vs_7d_pct ?? null,
  }) : operators.length < 3 ? { label: 'Coverage Needed', color: 'bg-amber-500/15 text-amber-400 border-amber-500/20', icon: '⚠️' } : null;

  const operatorLinks: HCLink[] = operators.map((op) => ({ label: op.name, href: `/place/${op.slug}` }));
  const routeDesc = `${corridor.origin_city}, ${corridor.origin_state} → ${corridor.dest_city}, ${corridor.dest_state}`;
  const hasRates = rateData && (rateData.rate_low != null || rateData.rate_mid != null);
  const isHardFill = signals?.hard_fill || (operators.length <= 5 && (signals?.recent_activity_count_7d ?? 0) >= 8);
  const now = new Date().toISOString();

  return (
    <main className="max-w-5xl mx-auto px-4 py-8 min-h-screen pb-32 lg:pb-8">
      <HCBreadcrumbs crumbs={[{ label: 'Corridors', href: '/corridors' }, { label: corridor.name, isCurrent: true }]} />

      {/* Hero Billboard (if inventory exists) */}
      <HeroBillboard creatives={heroAds} slotFamily="hero_billboard" pageType="corridor_page" />

      {/* Header */}
      <div className="border-b border-white/5 pb-8 mb-8">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-16 h-16 rounded-2xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-3xl flex-shrink-0">🛣️</div>
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl md:text-4xl font-black text-white tracking-tight leading-tight">{corridor.name}</h1>
            <p className="text-gray-400 text-sm mt-1">{routeDesc}{corridor.miles ? ` · ${corridor.miles} mi` : ''}</p>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {/* Signal badge */}
              {signalBadge && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md border ${signalBadge.color}`}>
                  {signalBadge.icon} {signalBadge.label}
                </span>
              )}
              {operators.length > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-500/10 text-green-400">
                  {operators.length} operator{operators.length > 1 ? 's' : ''}
                </span>
              )}
              {corridor.cls_tier && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/5 text-gray-400">
                  Tier {corridor.cls_tier}
                </span>
              )}
              {rateData?.change_vs_7d_pct != null && Math.abs(rateData.change_vs_7d_pct) >= 15 && (
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${rateData.change_vs_7d_pct > 0 ? 'bg-red-500/10 text-red-400' : 'bg-green-500/10 text-green-400'}`}>
                  📈 Rate {rateData.change_vs_7d_pct > 0 ? '+' : ''}{rateData.change_vs_7d_pct.toFixed(0)}% vs 7d
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="lg:flex gap-10">
        {/* Main Column */}
        <div className="flex-grow min-w-0 space-y-0">
          {/* Navigation Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <Link href={`/corridors/${slug}/operators`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all group">
              <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors">🚛 Operators</h3>
              <p className="text-[10px] text-gray-500 mt-1">{operators.length > 0 ? `${operators.length} cover this corridor` : 'Be first to cover'}</p>
            </Link>
            <Link href={`/corridors/${slug}/rates`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all group">
              <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors">💰 Rates</h3>
              <p className="text-[10px] text-gray-500 mt-1">{hasRates ? `$${rateData!.rate_low?.toLocaleString()} – $${rateData!.rate_high?.toLocaleString()}` : 'Rate intelligence'}</p>
            </Link>
            <Link href={`/corridors/${slug}/requirements`} className="bg-white/[0.03] border border-white/[0.08] rounded-xl p-5 hover:border-accent/30 transition-all group">
              <h3 className="text-sm font-bold text-white group-hover:text-accent transition-colors">📋 Requirements</h3>
              <p className="text-[10px] text-gray-500 mt-1">Escort requirements along route</p>
            </Link>
          </div>

          {/* Urgent Fill Module when hard fill */}
          {(isHardFill || operators.length < 3) && (
            <HCUrgentFillModule count={signals?.recent_activity_count_7d ?? 0} />
          )}

          {/* Rate Intelligence */}
          {hasRates && rateData && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4">Rate Intelligence</h2>
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">Low</p>
                    <p className="text-xl font-bold text-gray-300">${rateData.rate_low?.toLocaleString() ?? '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-accent uppercase tracking-wider mb-1">Mid</p>
                    <p className="text-xl font-bold text-accent">${rateData.rate_mid?.toLocaleString() ?? '—'}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[10px] text-gray-500 uppercase tracking-wider mb-1">High</p>
                    <p className="text-xl font-bold text-gray-300">${rateData.rate_high?.toLocaleString() ?? '—'}</p>
                  </div>
                </div>
                {rateData.change_vs_7d_pct != null && (
                  <div className="text-center">
                    <span className={`text-xs font-bold ${rateData.change_vs_7d_pct > 0 ? 'text-red-400' : rateData.change_vs_7d_pct < 0 ? 'text-green-400' : 'text-gray-500'}`}>
                      {rateData.change_vs_7d_pct > 0 ? '↑' : rateData.change_vs_7d_pct < 0 ? '↓' : '→'} {Math.abs(rateData.change_vs_7d_pct).toFixed(1)}% vs 7 days ago
                    </span>
                  </div>
                )}
                {rateData.freshness_timestamp && (
                  <p className="text-[9px] text-gray-600 text-center mt-2">Last updated: {new Date(rateData.freshness_timestamp).toLocaleDateString()}</p>
                )}
              </div>
              <HCMethodologyPanel
                methodology="Rate ranges are calculated from verified load postings along this corridor, aggregated over a rolling 30-day window. Outliers beyond 2 standard deviations are excluded."
                lastUpdated={rateData.freshness_timestamp ? new Date(rateData.freshness_timestamp).toLocaleDateString() : undefined}
              />
            </section>
          )}

          {/* No Rate Data — alert capture */}
          {!hasRates && (
            <section className="mb-8">
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6 text-center">
                <p className="text-sm text-gray-400 mb-2">Rate data is not yet available for this corridor.</p>
                <p className="text-xs text-gray-600">We&apos;re building rate intelligence from verified market data. No fake numbers.</p>
              </div>
              <div className="mt-4">
                <HCAlertSignupModule
                  context={`${corridor.name} rates`}
                  title="Get Rate Alerts"
                  alertType="rate"
                  contextKey={`rate:corridor:${slug}`}
                  corridorSlug={slug}
                  showPremiumTier
                />
              </div>
            </section>
          )}

          {/* Inline Billboard #1 */}
          {inlineAds.length > 0 && <InlineBillboard creatives={inlineAds.slice(0, 4)} />}

          {/* Operator List */}
          {operators.length > 0 && (
            <section className="mb-8">
              <h2 className="text-lg font-bold text-white mb-4">Operators Covering This Corridor</h2>
              <div className="space-y-3">
                {operators.map((op) => (
                  <Link key={op.id} href={`/place/${op.slug}`} className="block bg-white/[0.02] border border-white/[0.06] rounded-xl p-4 hover:border-accent/20 transition-all">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-white">{op.name}</h3>
                        <p className="text-[10px] text-gray-500 mt-0.5">{[op.city, op.admin1_code].filter(Boolean).join(', ')}</p>
                      </div>
                      {(op as any).phone && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-green-500/10 text-green-400">📞 Contact</span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              <Link href={`/corridors/${slug}/operators`} className="block mt-3 text-sm text-accent hover:underline font-bold">View all operators →</Link>
            </section>
          )}

          {/* Thin market CTA */}
          {operators.length === 0 && (
            <section className="mb-8 bg-accent/[0.04] border border-accent/15 rounded-2xl p-6 text-center">
              <h3 className="text-white font-bold text-lg mb-2">Be the first to cover this corridor</h3>
              <p className="text-sm text-gray-400 mb-4">No operators listed. Claim your spot for priority visibility.</p>
              <Link href="/claim" className="inline-block bg-accent text-black px-6 py-3 rounded-xl font-bold text-sm hover:bg-yellow-500 transition-colors">
                List Your Business →
              </Link>
            </section>
          )}

          {/* Inline Billboard #2 */}
          {inlineAds.length > 4 && <InlineBillboard creatives={inlineAds.slice(4)} />}

          {/* Data Freshness */}
          <HCSourceFreshnessPanel
            freshness={{ lastUpdatedAt: now, updateLabel: 'Real-time from directory', sourceCount: operators.length }}
            sources={['Haul Command Directory', 'Verified Load Postings']}
          />
        </div>

        {/* Sidebar */}
        <aside className="lg:w-80 flex-shrink-0 space-y-6 mt-8 lg:mt-0">
          {/* Sidecar Sponsor */}
          <SidecarSponsor creatives={sidecarAds} />

          {/* Corridor Sponsor CTA */}
          <div className="bg-gradient-to-br from-accent/10 to-transparent border border-accent/20 rounded-2xl p-5">
            <p className="text-accent font-bold text-sm mb-2">⭐ Sponsor This Corridor</p>
            <p className="text-gray-500 text-xs mb-3">Get featured placement for your business on this corridor page. $199/mo.</p>
            <a
              href={`/api/stripe/corridor-sponsor?corridor_slug=${slug}&corridor_name=${encodeURIComponent(corridor.name)}`}
              className="block text-center bg-accent text-black px-4 py-2 rounded-lg text-xs font-bold hover:bg-yellow-500 transition-colors"
            >
              Become Sponsor →
            </a>
          </div>

          {/* Nearby Operators */}
          <HCNearbyEntitiesModule entities={operatorLinks.slice(0, 6)} title="Operators on This Route" />

          {/* Related Links */}
          <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-6">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-3">Explore</h3>
            <div className="space-y-2">
              <Link href={`/requirements/${(corridor.origin_state ?? '').toLowerCase()}`} className="block text-sm text-gray-400 hover:text-accent transition-colors">
                → {corridor.origin_state} escort requirements
              </Link>
              <Link href={`/requirements/${(corridor.dest_state ?? '').toLowerCase()}`} className="block text-sm text-gray-400 hover:text-accent transition-colors">
                → {corridor.dest_state} escort requirements
              </Link>
              <Link href="/loads" className="block text-sm text-gray-400 hover:text-accent transition-colors">→ Post a load</Link>
              <Link href="/corridors" className="block text-sm text-gray-400 hover:text-accent transition-colors">→ Browse all corridors</Link>
              <Link href="/map" className="block text-sm text-gray-400 hover:text-accent transition-colors">→ Map view</Link>
            </div>
          </div>

          {/* Alert Signup with premium tier */}
          <HCAlertSignupModule
            context={corridor.name}
            title="Get Corridor Alerts"
            alertType="corridor"
            contextKey={`corridor:${slug}`}
            corridorSlug={slug}
            showPremiumTier
          />
        </aside>
      </div>

      {/* Sticky Mobile Chip Rail (ads) */}
      <StickyMobileChipRail creatives={chipAds} />
    </main>
  );
}
