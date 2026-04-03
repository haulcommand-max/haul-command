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

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const supabase = createClient();
  const { slug } = await params;
  const [origin, destination] = slug.split('-');
  const { data: corridor } = await supabase
    .from('corridors')
    .select('origin_state, destination_state, load_count, operator_count, intel_content')
    .eq('origin_state', origin?.toUpperCase())
    .eq('destination_state', destination?.toUpperCase())
    .single();

  if (!corridor) return { title: 'Corridor Intel — Haul Command' };

  return {
    title: `${corridor.origin_state} to ${corridor.destination_state} Escort Corridor Intel | Haul Command`,
    description: `Heavy haul escort intelligence for the ${corridor.origin_state}→${corridor.destination_state} corridor. Permit requirements, escort regulations, operator density, and real traffic data.`,
  };
}

export default async function CorridorIntelPage({ params }: Props) {
  const supabase = createClient();
  const { slug } = await params;
  const [origin, destination] = slug.split('-');

  if (!origin || !destination) notFound();

  const { data: corridor } = await supabase
    .from('corridors')
    .select('*, intel_content, intel_generated_at')
    .eq('origin_state', origin.toUpperCase())
    .eq('destination_state', destination.toUpperCase())
    .single();

  if (!corridor) notFound();

  // Nearby operators
  const { data: operators } = await supabase
    .from('listings')
    .select('id, full_name, state, city, rating, review_count, claimed, services')
    .or(`state.eq.${origin.toUpperCase()},state.eq.${destination.toUpperCase()}`)
    .eq('active', true)
    .order('rating', { ascending: false })
    .limit(6);

  // ── Route Intelligence Engine Computation ──────────────────────────
  const routeIntel = analyzeRoute(
    corridor.origin_state,
    corridor.destination_state,
    [corridor.origin_state, corridor.destination_state].filter(Boolean),
    { widthM: 4.0, heightM: 4.5, lengthM: 25, weightT: 50, description: 'Standard oversize load' },
  );

  const riskColors: Record<string, string> = {
    A: '#22c55e', B: '#84cc16', C: '#f59e0b', D: '#ef4444', F: '#dc2626',
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Schema Orchestrator — Corridor: Service + Dataset + Breadcrumb rich results */}
      <SchemaOrchestrator
        type="Corridor"
        data={{
          origin: corridor.origin_state,
          destination: corridor.destination_state,
          url: `https://haulcommand.com/corridors/${slug}`,
          operatorCount: corridor.operator_count,
          breadcrumbs: [
            { name: 'Home', url: 'https://haulcommand.com' },
            { name: 'Corridors', url: 'https://haulcommand.com/corridors' },
            { name: `${corridor.origin_state} to ${corridor.destination_state}`, url: `https://haulcommand.com/corridors/${slug}` },
          ],
        }}
      />
      {/* Weather Alert Banner — contextual corridor intelligence */}
      <AdGridWeatherBanner alert={null} />

      {/* Header */}
      <section className="py-12 px-4 border-b border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-2 mb-4">
            <a href="/corridors" className="text-xs text-gray-600 hover:text-amber-400">Corridors</a>
            <span className="text-gray-800">/</span>
            <span className="text-xs text-gray-400">{corridor.origin_state} → {corridor.destination_state}</span>
          </div>
          <div className="flex items-center gap-4 mb-3">
            <h1 className="text-3xl md:text-4xl font-bold">
              {corridor.origin_state} → {corridor.destination_state} Escort Corridor
            </h1>
            <SaveButton entityType="corridor" entityId={slug} entityLabel={`${corridor.origin_state} to ${corridor.destination_state}`} variant="pill" />
          </div>
          <p className="text-gray-400">
            Heavy haul escort intelligence, permit requirements, and operator availability
          </p>
          <div className="flex gap-6 mt-4 text-sm">
            <div>
              <span className="text-amber-400 font-bold">{corridor.load_count ?? 0}</span>
              <span className="text-gray-600 ml-1">loads posted</span>
            </div>
            <div>
              <span className="text-amber-400 font-bold">{corridor.operator_count ?? 0}</span>
              <span className="text-gray-600 ml-1">active escorts</span>
            </div>
            <div>
              <span style={{ color: riskColors[routeIntel.riskGrade] }} className="font-bold">Grade {routeIntel.riskGrade}</span>
              <span className="text-gray-600 ml-1">risk</span>
            </div>
          </div>
        </div>
      </section>

      {/* AI Answer Block — citation-ready for search engines */}
      <div className="max-w-4xl mx-auto px-4 pt-6">
        <StaticAnswerBlock
          question={`What are the escort requirements for the ${corridor.origin_state} to ${corridor.destination_state} corridor?`}
          answer={`The ${corridor.origin_state} to ${corridor.destination_state} corridor requires ${routeIntel.totalEscortsNeeded} escort vehicle(s) for standard oversize loads. Estimated total cost is $${(routeIntel.estimatedTotalPermitCost + routeIntel.estimatedTotalEscortCost).toLocaleString()} including permits and escorts. Risk grade: ${routeIntel.riskGrade}.`}
          confidence="verified_but_review_due"
          ctaLabel="Get a Quote for This Route"
          ctaUrl={`/route-check?q=${encodeURIComponent(`Oversize load from ${corridor.origin_state} to ${corridor.destination_state}`)}`}
        />
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main intel */}
          <div className="md:col-span-2">
            {/* ── ROUTE INTELLIGENCE PANEL ─────────────────────────── */}
            <div className="mb-8 p-5 bg-white/[0.03] border border-white/10 rounded-2xl">
              <h2 className="text-sm font-bold text-amber-400 uppercase tracking-widest mb-4">
                ⚡ Route Intelligence (Computed)
              </h2>
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

              {/* Segment Details */}
              {routeIntel.segments.map((seg, i) => (
                <div key={seg.segmentId} className="mb-3 p-3 bg-white/[0.02] border border-white/5 rounded-lg">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold text-white">{seg.jurisdiction} Segment</span>
                    <span className="text-[10px] font-bold text-gray-500">{seg.distanceKm} km · {seg.estimatedHours.toFixed(1)}h</span>
                  </div>
                  <div className="text-xs text-gray-400 mb-1">{seg.escortRequirement.reason}</div>
                  <div className="flex gap-2 flex-wrap">
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      {seg.escortRequirement.escortsNeeded} escort(s) · {seg.escortRequirement.escortType}
                    </span>
                    {seg.permitRequired && (
                      <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
                        Permit: ~${seg.permitEstimatedCost}
                      </span>
                    )}
                    {seg.travelRestrictions.map((r, ri) => (
                      <span key={ri} className={`text-[9px] font-bold px-2 py-0.5 rounded ${
                        r.severity === 'blocking' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                      }`}>
                        {r.description}
                      </span>
                    ))}
                  </div>
                </div>
              ))}

              {/* Warnings + Recommendations */}
              {routeIntel.criticalWarnings.length > 0 && (
                <div className="mt-4 p-3 bg-red-500/5 border border-red-500/15 rounded-lg">
                  <div className="text-[10px] font-bold text-red-400 uppercase tracking-wider mb-2">Critical Warnings</div>
                  {routeIntel.criticalWarnings.map((w, i) => (
                    <div key={i} className="text-xs text-gray-400 mb-1">{w}</div>
                  ))}
                </div>
              )}
              <div className="mt-4 p-3 bg-green-500/5 border border-green-500/15 rounded-lg">
                <div className="text-[10px] font-bold text-green-400 uppercase tracking-wider mb-2">Recommendations</div>
                {routeIntel.recommendations.map((r, i) => (
                  <div key={i} className="text-xs text-gray-400 mb-1">✓ {r}</div>
                ))}
              </div>
            </div>

            {corridor.intel_content ? (
              <div className="prose prose-invert prose-sm max-w-none
                prose-headings:text-white prose-headings:font-bold
                prose-p:text-gray-400 prose-p:leading-relaxed
                prose-strong:text-white prose-a:text-amber-400">
                <div dangerouslySetInnerHTML={{ __html:
                  corridor.intel_content
                    .replace(/^## /gm, '<h2>')
                    .replace(/\n/g, '</h2>\n')
                    .replace(/###/g, '<h3>')
                    || corridor.intel_content
                }} />
              </div>
            ) : (
              <div className="p-6 bg-white/5 border border-white/10 rounded-2xl text-center">
                <p className="text-gray-400">Corridor intel is being generated. Check back soon.</p>
                <a href="/route-check" className="text-amber-400 text-sm hover:underline mt-2 inline-block">
                  Use Route Check for instant answers →
                </a>
              </div>
            )}

            {/* Route Check CTA */}
            <div className="mt-8 p-5 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
              <p className="font-bold text-white mb-1">Have a specific question about this corridor?</p>
              <p className="text-sm text-gray-400 mb-3">Use the free Route Check tool for instant AI answers on permits, escorts, and curfews.</p>
              <a
                href={`/route-check?q=${encodeURIComponent(`Oversize load regulations from ${corridor.origin_state} to ${corridor.destination_state}`)}&state=${origin.toUpperCase()}`}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm rounded-xl inline-block transition-colors"
              >
                Check This Corridor →
              </a>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Find operators */}
            <div className="p-4 bg-white/5 border border-white/10 rounded-2xl">
              <h2 className="font-bold text-sm mb-3">Escort Operators on This Corridor</h2>
              {operators?.length ? (
                <div className="space-y-2">
                  {operators.map(op => (
                    <a
                      key={op.id}
                      href={`/directory/${op.id}`}
                      className="flex items-center justify-between p-2 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      <div>
                        <p className="text-xs font-medium text-white">{op.full_name}</p>
                        <p className="text-xs text-gray-600">{op.city}, {op.state}</p>
                      </div>
                      {op.rating && (
                        <span className="text-xs text-amber-400">★ {op.rating}</span>
                      )}
                    </a>
                  ))}
                  <a
                    href={`/directory?state=${origin.toUpperCase()}`}
                    className="block text-center text-xs text-amber-400 hover:underline mt-2"
                  >
                    View all {corridor.origin_state} operators →
                  </a>
                </div>
              ) : (
                <a href="/directory" className="text-xs text-amber-400 hover:underline">
                  Browse escort operator directory →
                </a>
              )}
            </div>

            {/* Post a load — Conversion CTA */}
            <PostLoadCTA corridorName={`${corridor.origin_state} → ${corridor.destination_state}`} variant="card" />

            {/* Operators needed — Conversion CTA */}
            <OperatorsNeededCTA
              surfaceName={`${corridor.origin_state}→${corridor.destination_state}`}
              operatorsNeeded={Math.max(5, 20 - (corridor.operator_count || 0))}
            />

            {/* AdGrid — Corridor Sidebar */}
            <AdGridSlot zone="corridor_sidebar" />

            {/* Data Product Teaser — Corridor Intelligence */}
            <DataProductTeaser
              title="Corridor Intelligence Feed"
              description={`${corridor.origin_state}→${corridor.destination_state} demand, supply, and rate data`}
              previewData={[
                `Operators active: ${corridor.operator_count || '—'}`,
                `Loads posted (24h): ${corridor.load_count || '—'}`,
                `Avg rate per mile: ••••`,
              ]}
              price="$29/mo"
              productSlug="corridor-snapshot"
              locked={true}
            />

            {/* Corridor Sponsorship — geo-targeted */}
            <SponsorCard zone="corridor" geo={slug} role="sponsor" intent="acquire_corridor" />

            {/* Social Proof Banner */}
            <SocialProofBanner />

            {/* Corridor Sponsor Slot — dedicated corridor_sponsor zone */}
            <div className="max-w-4xl mx-auto">
              <AdGridSlot zone="corridor_sponsor" />
            </div>

            {/* Data Teaser Strip — corridor intelligence teasers */}
            <DataTeaserStrip geo={`${corridor.origin_state} to ${corridor.destination_state}`} />

            {/* UrgentMarketSponsor — corridor-level market mode CTA */}
            {/* marketKey is per-corridor so shortage/rescue modes fire at corridor granularity */}
            <UrgentMarketSponsor
              marketKey={`us-${corridor.origin_state?.toLowerCase()}-${corridor.destination_state?.toLowerCase()}`}
              geo={`${corridor.origin_state} → ${corridor.destination_state}`}
            />

            {/* Snippet Injector — featured snippet capture */}
            <SnippetInjector
              blocks={['definition', 'faq', 'cost_range']}
              term="pilot car"
              geo={`${corridor.origin_state} to ${corridor.destination_state}`}
              country="US"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
