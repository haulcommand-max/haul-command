import { createServerComponentClient } from '@/lib/supabase/server-auth';
import { cookies } from 'next/headers';
import { notFound } from 'next/navigation';
import RelatedLinks from '@/components/seo/RelatedLinks';
import { CorridorSponsorBanner } from '@/components/corridors/CorridorSponsorBanner';
import { loadCorridorSponsor } from '@/lib/adgrid/corridor-sponsor-loader';
import { CorridorHeatmap } from '@/components/corridors/CorridorHeatmap';

interface Props {
  params: { slug: string };
}

export async function generateMetadata({ params }: Props) {
  const supabase = createServerComponentClient({ cookies });
  const { data } = await supabase
    .from('hc_corridor_public_v1')
    .select('name,short_name,origin_city_name,destination_city_name,country_code')
    .eq('slug', params.slug)
    .maybeSingle();
  if (!data) return {};
  return {
    title: `${data.name} — Heavy Haul Escort & Permit Guide | Haul Command`,
    description: `Escort requirements, permit rules, and operator intelligence for the ${data.name}.`,
  };
}

export default async function CorridorSlugPage({ params }: Props) {
  const supabase = createServerComponentClient({ cookies });
  const { data: { session } } = await supabase.auth.getSession();
  const isPro = !!session; // Prototype logic: logged in = Pro

  const { data: corridor } = await supabase
    .from('hc_corridor_public_v1')
    .select('*')
    .eq('slug', params.slug)
    .maybeSingle();

  if (!corridor) notFound();

  // Load AdGrid sponsor (graceful null if none booked)
  const sponsor = await loadCorridorSponsor(params.slug);

  // Load demand signals (Heatmap Data)
  const { data: signals } = await supabase
    .from('hc_corridor_demand_signals')
    .select('signal_data, composite_score, recorded_at')
    .eq('corridor_id', corridor.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  // Load requirements
  const { data: reqs } = await supabase
    .from('hc_corridor_requirements')
    .select('requirement_type,jurisdiction_level,jurisdiction_code,title,summary,confidence_score,freshness_score')
    .eq('corridor_id', corridor.id)
    .order('requirement_type');

  // Load pricing
  const { data: pricing } = await supabase
    .from('hc_corridor_pricing_obs')
    .select('observation_type,currency_code,amount_min,amount_median,amount_max,price_unit,confidence_score')
    .eq('corridor_id', corridor.id)
    .order('observation_type');

  // Load credential types required
  const { data: creds } = await supabase
    .from('hc_corridor_credentials')
    .select('required,preferred,credential_type:hc_credential_types(slug,name,short_name,country_code,credential_family,issuing_authority)')
    .eq('corridor_id', corridor.id);

  const isFlagship = corridor.tier === 'flagship' || (corridor.composite_score ?? 0) >= 85;

  return (
    <main className="min-h-screen bg-[#0a0d14] text-white">
      {/* Hero */}
      <section className="border-b border-white/8 bg-gradient-to-b from-[#0f1420] to-[#0a0d14] px-4 py-14">
        <div className="mx-auto max-w-4xl">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <span className="text-sm text-white/40">
              {corridor.origin_country_code} → {corridor.destination_country_code}
            </span>
            {isFlagship && (
              <span className="rounded-full border border-amber-500/40 bg-amber-500/15 px-2 py-0.5 text-xs font-semibold text-amber-400">
                🔥 Flagship Corridor
              </span>
            )}
            {corridor.is_cross_border && (
              <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-xs font-semibold text-blue-300">
                ✈ Cross-Border
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">{corridor.name}</h1>
          {corridor.origin_city_name && corridor.destination_city_name && (
            <p className="mt-2 text-lg text-white/50">
              {corridor.origin_city_name} &rarr; {corridor.destination_city_name}
              {corridor.distance_km ? ` · ${corridor.distance_km.toLocaleString()} km` : ''}
            </p>
          )}

          {/* KPI strip */}
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: 'Intelligence Score', value: corridor.composite_score != null ? Math.round(corridor.composite_score) : '—' },
              { label: 'Distance', value: corridor.distance_km ? `${corridor.distance_km.toLocaleString()} km` : '—' },
              { label: 'Est. Market Value', value: corridor.commercial_value_estimate ? '$' + (corridor.commercial_value_estimate / 1_000_000).toFixed(1) + 'M' : '—' },
              { label: 'Currency', value: corridor.currency_code ?? 'USD' },
            ].map(k => (
              <div key={k.label} className="rounded-xl border border-white/8 bg-white/4 px-4 py-3">
                <p className="text-xl font-black text-white">{k.value}</p>
                <p className="mt-0.5 text-xs text-white/40">{k.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-4xl space-y-8 px-4 py-12">
        {/* AdGrid sponsor banner — truth-first, falls back to house ad */}
        <CorridorSponsorBanner
          corridorSlug={params.slug}
          corridorName={corridor.short_name ?? corridor.name}
          countryCode={corridor.country_code}
          tier={corridor.tier}
          compositeScore={corridor.composite_score}
          sponsorAd={sponsor}
        />

        {/* Live Demand Heatmap */}
        <CorridorHeatmap 
          corridorName={corridor.short_name ?? corridor.name} 
          signals={signals || undefined} 
          isPro={isPro} 
        />

        {/* Permit & Escort Requirements */}
        {reqs && reqs.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-black text-white">Permit & Escort Requirements</h2>
            <div className="space-y-3">
              {reqs.map((r, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-5">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-md bg-white/8 px-2 py-0.5 text-xs font-semibold uppercase tracking-wide text-white/50">
                      {r.requirement_type}
                    </span>
                    <span className="text-xs text-white/30">{r.jurisdiction_code}</span>
                    {r.confidence_score && (
                      <span className={`ml-auto rounded-md px-2 py-0.5 text-xs font-semibold ${
                        r.confidence_score >= 80 ? 'bg-green-500/15 text-green-400' :
                        r.confidence_score >= 60 ? 'bg-amber-500/15 text-amber-400' :
                        'bg-red-500/15 text-red-400'
                      }`}>
                        {r.confidence_score >= 80 ? 'High confidence' :
                         r.confidence_score >= 60 ? 'Partially verified' : 'Needs review'}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-white">{r.title}</p>
                  <p className="mt-1 text-sm text-white/60">{r.summary}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Rate Benchmarks */}
        {pricing && pricing.length > 0 && (
          <section>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-black text-white">Rate Benchmarks</h2>
              <a href="/data-products/corridor-intelligence" className="text-sm text-amber-400 hover:underline">
                Unlock full data →
              </a>
            </div>
            <div className="overflow-hidden rounded-xl border border-white/8">
              <div className="grid grid-cols-5 border-b border-white/8 bg-white/5 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white/30">
                <span className="col-span-2">Rate Type</span>
                <span className="text-right">Min</span>
                <span className="text-right">Median</span>
                <span className="text-right">Max</span>
              </div>
              {pricing.map((p, i) => (
                <div key={i} className={`grid grid-cols-5 px-4 py-3 text-sm ${
                  i % 2 === 0 ? '' : 'bg-white/2'
                }`}>
                  <span className="col-span-2 text-white/70 capitalize">
                    {p.observation_type.replace(/_/g, ' ')} ({p.price_unit})
                  </span>
                  <span className="text-right font-mono text-white/50">
                    {p.currency_code} {p.amount_min?.toFixed(2)}
                  </span>
                  <span className="text-right font-mono font-semibold text-white">
                    {p.currency_code} {p.amount_median?.toFixed(2)}
                  </span>
                  <span className="text-right font-mono text-white/50">
                    {p.currency_code} {p.amount_max?.toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
            <p className="mt-2 text-right text-xs text-white/30">
              Confidence: seeded estimates — <a href="/data-products/corridor-intelligence" className="text-amber-400 hover:underline">verify with full dataset</a>
            </p>
          </section>
        )}

        {/* Credentials */}
        {creds && creds.length > 0 && (
          <section>
            <h2 className="mb-4 text-xl font-black text-white">Required Credentials</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {(creds as any[]).map((c, i) => (
                <div key={i} className="rounded-xl border border-white/8 bg-white/4 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <p className="font-semibold text-white text-sm">{c.credential_type?.name}</p>
                    <span className={`shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold ${
                      c.required ? 'bg-red-500/15 text-red-400' : 'bg-white/8 text-white/40'
                    }`}>
                      {c.required ? 'Required' : 'Preferred'}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-white/40">
                    {c.credential_type?.issuing_authority} · {c.credential_type?.credential_family}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Data product upsell */}
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/5 p-6">
          <p className="text-xs font-semibold uppercase tracking-widest text-amber-400">Corridor Intelligence Pro</p>
          <p className="mt-1 text-base font-bold text-white">Get full rate benchmarks, permit maps & demand signals</p>
          <p className="mt-1 text-sm text-white/50">Unlock verified pricing data and demand-signal exports for this corridor.</p>
          <a
            href="/data-products/corridor-intelligence"
            className="mt-4 inline-flex rounded-xl bg-amber-500 px-6 py-2.5 text-sm font-bold text-black hover:bg-amber-400 transition-colors"
          >
            Unlock Intelligence Data →
          </a>
        </div>

        {/* SEO equity */}
        <RelatedLinks pageType="corridor" context={{ corridor: params.slug }} />
      </div>
    </main>
  );
}
