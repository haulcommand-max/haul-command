import { Metadata } from 'next';
import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import SaveButton from '@/components/capture/SaveButton';
import { analyzeRoute, type RouteIntelligenceResult } from '@/lib/routes/route-intelligence-engine';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { PostLoadCTA, OperatorsNeededCTA } from '@/components/seo/ConversionCTAs';
import { SnippetInjector } from '@/components/seo/SnippetInjector';
import { CitySponsorshipCTA } from '@/components/monetization/CitySponsorshipCTA';
import SocialProofBanner from '@/components/social/SocialProofBanner';
import { AdGridWeatherBanner } from '@/components/ads/AdGridWeatherBanner';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { SponsorCard, DataProductTeaser } from '@/components/monetization/SponsorCard';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';
import { SchemaOrchestrator } from '@/components/seo/SchemaOrchestrator';
import { UrgentMarketSponsor } from '@/components/ads/UrgentMarketSponsor';
import RelatedLinks from '@/components/seo/RelatedLinks';

interface Props {
  params: Promise<{ slug: string }>;
}

// ─── Data layer ───────────────────────────────────────────────────────────────
// Primary source: hc_corridor_public_v1 (new Corridor OS schema)
// Fallback source: legacy `corridors` table (old origin_state/destination_state shape)
// This dual-source strategy lets both old and new slugs resolve without 404s.

async function getCorridorData(slug: string) {
  const supabase = createClient();

  // 1. Try new Corridor OS view first
  const { data: hcCorridor } = await supabase
    .from('hc_corridor_public_v1')
    .select('*')
    .eq('slug', slug)
    .single();

  if (hcCorridor) {
    return { source: 'hc' as const, corridor: hcCorridor };
  }

  // 2. Fallback: legacy corridors table (old slug shape: "TX-FL")
  const [origin, destination] = slug.split('-');
  if (!origin || !destination) return null;

  const { data: legacy } = await supabase
    .from('corridors')
    .select('*, intel_content, intel_generated_at')
    .eq('origin_state', origin.toUpperCase())
    .eq('destination_state', destination.toUpperCase())
    .single();

  if (!legacy) return null;
  return { source: 'legacy' as const, corridor: legacy };
}

function extractDisplayNames(source: 'hc' | 'legacy', corridor: Record<string, unknown>) {
  if (source === 'hc') {
    const originName = (corridor.origin_city_name as string) ||
      (corridor.origin_region_code as string) ||
      (corridor.origin_country_code as string) || 'Origin';
    const destName = (corridor.destination_city_name as string) ||
      (corridor.destination_region_code as string) ||
      (corridor.destination_country_code as string) || 'Destination';
    return {
      originLabel: originName,
      destLabel: destName,
      fullName: (corridor.name as string) || `${originName} to ${destName}`,
      shortName: (corridor.short_name as string) || `${originName}–${destName}`,
      originState: (corridor.origin_region_code as string) || (corridor.origin_country_code as string) || '',
      destState: (corridor.destination_region_code as string) || (corridor.destination_country_code as string) || '',
      distanceMiles: (corridor.distance_miles as number) || 0,
      operatorCount: (corridor.requirement_count as number) || 0,
      loadCount: 0,
      escortRateMedian: (corridor.escort_rate_median as number) || null,
      operatorRateMedian: (corridor.operator_rate_median as number) || null,
      urgentFillPremium: (corridor.urgent_fill_premium as number) || null,
      permitCount: (corridor.permit_count as number) || 0,
      escortCount: (corridor.escort_count as number) || 0,
      credentialCount: (corridor.credential_count as number) || 0,
      requiredCredentialCount: (corridor.required_credential_count as number) || 0,
      corridorScore: (corridor.corridor_score as number) || 0,
      scarcityScore: (corridor.scarcity_score as number) || 0,
      urgencyScore: (corridor.urgency_score as number) || 0,
      commercialValue: (corridor.commercial_value_estimate as number) || 0,
      intelContent: null as string | null,
    };
  }
  // Legacy shape
  return {
    originLabel: corridor.origin_state as string,
    destLabel: corridor.destination_state as string,
    fullName: `${corridor.origin_state} to ${corridor.destination_state} Escort Corridor`,
    shortName: `${corridor.origin_state}–${corridor.destination_state}`,
    originState: corridor.origin_state as string,
    destState: corridor.destination_state as string,
    distanceMiles: 0,
    operatorCount: (corridor.operator_count as number) || 0,
    loadCount: (corridor.load_count as number) || 0,
    escortRateMedian: null,
    operatorRateMedian: null,
    urgentFillPremium: null,
    permitCount: 0,
    escortCount: 0,
    credentialCount: 0,
    requiredCredentialCount: 0,
    corridorScore: 0,
    scarcityScore: 0,
    urgencyScore: 0,
    commercialValue: 0,
    intelContent: (corridor.intel_content as string) || null,
  };
}

// ─── Metadata ─────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const result = await getCorridorData(slug);
  if (!result) return { title: 'Corridor Intel — Haul Command' };
  const d = extractDisplayNames(result.source, result.corridor as Record<string, unknown>);
  return {
    title: `${d.fullName} — Heavy Haul Escort & Permit Guide | Haul Command`,
    description: `Escort requirements, permit costs, operator coverage, and real rate data for the ${d.fullName}. Updated regularly.`,
    keywords: [
      `${d.originLabel} to ${d.destLabel} escort`,
      `${d.shortName} oversize permit`,
      `heavy haul ${d.shortName}`,
      `pilot car ${d.originLabel}`,
    ],
    alternates: { canonical: `https://haulcommand.com/corridors/${slug}` },
    openGraph: {
      title: `${d.fullName} — Haul Command`,
      description: `Escort, permit, and operator intelligence for the ${d.fullName}.`,
      url: `https://haulcommand.com/corridors/${slug}`,
    },
  };
}

// ─── Page ─────────────────────────────────────────────────────────────────────
export default async function CorridorIntelPage({ params }: Props) {
  const supabase = createClient();
  const { slug } = await params;

  const result = await getCorridorData(slug);
  if (!result) notFound();

  const { source, corridor } = result;
  const d = extractDisplayNames(source, corridor as Record<string, unknown>);

  // Nearby operators (works for both sources)
  const originCode = d.originState?.slice(-2) || '';
  const destCode = d.destState?.slice(-2) || '';
  const { data: operators } = await supabase
    .from('listings')
    .select('id, full_name, state, city, rating, review_count, claimed, services')
    .or(`state.eq.${originCode},state.eq.${destCode}`)
    .eq('active', true)
    .order('rating', { ascending: false })
    .limit(6);

  const routeIntel = analyzeRoute(
    d.originState || 'US',
    d.destState || 'US',
    [d.originState, d.destState].filter(Boolean),
    { widthM: 4.0, heightM: 4.5, lengthM: 25, weightT: 50, description: 'Standard oversize load' },
  );

  const riskColors: Record<string, string> = {
    A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#ef4444', F: '#dc2626',
  };

  const gold = '#D4A844';
  const isHcSource = source === 'hc';

  // Schema
  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Service',
        name: `${d.fullName} — Heavy Haul Escort Service`,
        description: `Escort vehicle and permit guide for the ${d.fullName}.`,
        provider: { '@type': 'Organization', name: 'Haul Command', url: 'https://haulcommand.com' },
        areaServed: { '@type': 'Place', name: d.fullName },
        url: `https://haulcommand.com/corridors/${slug}`,
      },
      {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Corridors', item: 'https://haulcommand.com/corridors' },
          { '@type': 'ListItem', position: 3, name: d.fullName, item: `https://haulcommand.com/corridors/${slug}` },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <AdGridWeatherBanner alert={null} />

      {/* Header */}
      <section className="py-12 px-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <a href="/corridors" className="text-xs text-gray-600 hover:text-amber-400">Corridors</a>
            <span className="text-gray-800">/</span>
            <span className="text-xs text-gray-400">{d.fullName}</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold">
              {d.fullName}
            </h1>
            <SaveButton
              entityType="corridor"
              entityId={slug}
              entityLabel={d.fullName}
              variant="pill"
            />
          </div>
          <p className="text-gray-400">Heavy haul escort intelligence, permit requirements, and operator availability</p>

          {/* Key stats strip */}
          <div className="flex flex-wrap gap-6 mt-5 text-sm">
            {d.distanceMiles > 0 && (
              <div><span className="font-bold" style={{ color: gold }}>{d.distanceMiles.toLocaleString()}</span><span className="text-gray-600 ml-1">miles</span></div>
            )}
            {d.loadCount > 0 && (
              <div><span className="font-bold" style={{ color: gold }}>{d.loadCount}</span><span className="text-gray-600 ml-1">loads posted</span></div>
            )}
            {d.operatorCount > 0 && (
              <div><span className="font-bold" style={{ color: gold }}>{d.operatorCount}</span><span className="text-gray-600 ml-1">regulations filed</span></div>
            )}
            {d.permitCount > 0 && (
              <div><span className="font-bold" style={{ color: gold }}>{d.permitCount}</span><span className="text-gray-600 ml-1">permit requirements</span></div>
            )}
            {d.credentialCount > 0 && (
              <div><span className="font-bold" style={{ color: gold }}>{d.credentialCount}</span><span className="text-gray-600 ml-1">credentials tracked</span></div>
            )}
            <div>
              <span className="font-bold" style={{ color: riskColors[routeIntel.riskGrade] }}>Grade {routeIntel.riskGrade}</span>
              <span className="text-gray-600 ml-1">risk</span>
            </div>
          </div>

          {/* Live rate strip — only shows if DB has pricing data */}
          {isHcSource && (d.escortRateMedian || d.operatorRateMedian) && (
            <div className="mt-4 flex flex-wrap gap-3">
              {d.escortRateMedian && (
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(212,168,68,0.08)', border: '1px solid rgba(212,168,68,0.2)', color: gold }}>
                  Escort median: ${d.escortRateMedian.toFixed(2)}/mi
                </div>
              )}
              {d.operatorRateMedian && (
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(212,168,68,0.08)', border: '1px solid rgba(212,168,68,0.2)', color: gold }}>
                  Operator median: ${d.operatorRateMedian.toFixed(2)}/mi
                </div>
              )}
              {d.urgentFillPremium && (
                <div className="px-3 py-1.5 rounded-lg text-xs font-bold" style={{ background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}>
                  Urgent fill premium: +${d.urgentFillPremium.toFixed(2)}/mi
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* AI Answer Block */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <StaticAnswerBlock
          question={`What are the escort requirements for the ${d.fullName}?`}
          answer={`The ${d.fullName} requires ${routeIntel.totalEscortsNeeded} escort vehicle(s) for standard oversize loads. Estimated total cost is $${(routeIntel.estimatedTotalPermitCost + routeIntel.estimatedTotalEscortCost).toLocaleString()} including permits and escorts. Risk grade: ${routeIntel.riskGrade}.${d.escortRateMedian ? ` Current escort median rate: $${d.escortRateMedian.toFixed(2)}/mile.` : ''}`}
          confidence="verified_but_review_due"
          ctaLabel="Get a Quote for This Route"
          ctaUrl={`/route-check?origin=${encodeURIComponent(d.originLabel)}&dest=${encodeURIComponent(d.destLabel)}&corridor=${slug}`}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main intel */}
          <div className="md:col-span-2">

            {/* Route Intelligence Panel */}
            <div className="mb-8 p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">Route Intelligence</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-white">{routeIntel.totalDistanceKm.toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">km total</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-white">{routeIntel.totalEscortsNeeded}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">escorts needed</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black text-amber-400">${(routeIntel.estimatedTotalPermitCost + routeIntel.estimatedTotalEscortCost).toLocaleString()}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">est. total cost</div>
                </div>
                <div className="text-center p-3 bg-white/5 rounded-xl">
                  <div className="text-2xl font-black" style={{ color: riskColors[routeIntel.riskGrade] }}>{routeIntel.riskGrade}</div>
                  <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">risk grade</div>
                </div>
              </div>

              {routeIntel.segments.map((seg) => (
                <div key={seg.segmentId} className="mb-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{seg.jurisdiction} Segment</span>
                    <span className="text-[10px] font-bold text-gray-500">{seg.distanceKm} km · {seg.estimatedHours.toFixed(1)}h</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{seg.escortRequirement.reason}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {seg.escortRequirement.escortsNeeded} escort(s) — {seg.escortRequirement.escortType}
                    </span>
                    {seg.permitRequired && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Permit: ~${seg.permitEstimatedCost}
                      </span>
                    )}
                    {seg.travelRestrictions.map((r, ri) => (
                      <span key={ri} className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        r.severity === 'blocking' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>{r.description}</span>
                    ))}
                  </div>
                </div>
              ))}

              {routeIntel.criticalWarnings.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/5 border border-red-500/15 rounded-lg">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Critical Warnings</div>
                  {routeIntel.criticalWarnings.map((w, i) => <div key={i} className="text-xs text-gray-400 mb-1">{w}</div>)}
                </div>
              )}
              <div className="mt-4 p-3 bg-green-500/5 border border-green-500/15 rounded-lg">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Recommendations</div>
                {routeIntel.recommendations.map((r, i) => <div key={i} className="text-xs text-gray-400 mb-1">{r}</div>)}
              </div>
            </div>

            {/* Corridor OS: requirements panel (new source only) */}
            {isHcSource && (d.permitCount > 0 || d.escortCount > 0) && (
              <div className="mb-8 p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
                <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-3">Filed Requirements</h2>
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="text-xl font-black" style={{ color: gold }}>{d.permitCount}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Permit Rules</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="text-xl font-black" style={{ color: gold }}>{d.escortCount}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Escort Rules</div>
                  </div>
                  <div className="p-3 bg-white/5 rounded-xl">
                    <div className="text-xl font-black" style={{ color: gold }}>{d.requiredCredentialCount}</div>
                    <div className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">Required Credentials</div>
                  </div>
                </div>
              </div>
            )}

            {/* Legacy intel content */}
            {d.intelContent && (
              <div className="prose prose-invert prose-sm max-w-none prose-headings:text-white prose-headings:font-bold prose-p:text-gray-400 prose-p:leading-relaxed prose-strong:text-white prose-a:text-amber-400 mb-8">
                <div dangerouslySetInnerHTML={{ __html:
                  d.intelContent
                    .replace(/^## /gm, '<h2>')
                    .replace(/\n/g, '</h2>\n')
                    .replace(/###/g, '<h3>')
                  || d.intelContent
                }} />
              </div>
            )}

            {/* Route Check CTA */}
            <div className="mt-4 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="font-bold text-white mb-1">Have a specific question about this corridor?</p>
              <p className="text-sm text-gray-400 mb-3">Use the free Route Check tool for instant AI answers on permits, escorts, and curfews.</p>
              <a
                href={`/route-check?origin=${encodeURIComponent(d.originLabel)}&dest=${encodeURIComponent(d.destLabel)}&corridor=${slug}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl inline-block transition-colors"
              >
                Check This Corridor
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm mb-3">Escort Operators on This Corridor</h2>
              {operators?.length ? (
                <div className="space-y-2">
                  {operators.map(op => (
                    <a key={op.id} href={`/directory/${op.id}`} className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors">
                      <div>
                        <p className="text-xs font-medium text-white">{op.full_name}</p>
                        <p className="text-xs text-gray-600">{op.city}, {op.state}</p>
                      </div>
                      {op.rating && <span className="text-xs text-amber-400">★ {op.rating}</span>}
                    </a>
                  ))}
                  <a href={`/directory?state=${originCode}`} className="block text-center text-xs text-amber-400 hover:underline mt-2">
                    View all {d.originLabel} operators
                  </a>
                </div>
              ) : (
                <a href="/directory" className="text-xs text-amber-400 hover:underline">Browse escort operator directory</a>
              )}
            </div>

            <PostLoadCTA corridorName={d.fullName} variant="card" />
            <OperatorsNeededCTA
              surfaceName={slug}
              operatorsNeeded={Math.max(5, 20 - (d.operatorCount || 0))}
            />
            <AdGridSlot zone="corridor_sidebar" />
            <DataProductTeaser
              title="Corridor Intelligence Feed"
              description={`${d.fullName} demand, supply, and rate data`}
              previewData={[
                `Permit rules tracked: ${d.permitCount || '-'}`,
                `Escort rules: ${d.escortCount || '-'}`,
                `Avg escort rate: ${d.escortRateMedian ? `$${d.escortRateMedian.toFixed(2)}/mi` : '(unlocked)'}`,
                `Required creds: ${d.requiredCredentialCount || '-'}`,
              ]}
              price="$29/mo"
              productSlug="corridor-snapshot"
              locked={true}
            />
            <SponsorCard zone="corridor" geo={slug} role="sponsor" intent="acquire_corridor" />
            <SocialProofBanner />
            <div className="max-w-4xl mx-auto"><AdGridSlot zone="corridor_sponsor" /></div>
            <DataTeaserStrip geo={d.fullName} />
            <UrgentMarketSponsor
              marketKey={`us-${d.originLabel?.toLowerCase().replace(/\s+/g, '-')}-${d.destLabel?.toLowerCase().replace(/\s+/g, '-')}`}
              geo={d.fullName}
            />
            <SnippetInjector
              blocks={['definition', 'faq', 'cost_range']}
              term="pilot car"
              geo={d.fullName}
              country="US"
            />
          </div>
        </div>

        {/* SEO Internal Links */}
        <RelatedLinks
          pageType="corridor"
          heading={`Related resources for the ${d.fullName}`}
          className="mt-10"
        />
      </div>
    </div>
  );
}
