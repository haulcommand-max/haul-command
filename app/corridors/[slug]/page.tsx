import React from 'react';
import { notFound } from 'next/navigation';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { PageSeoContractJsonLd } from '@/components/seo/PageSeoContractJsonLd';
import {
  buildCorridorSeoJsonLd,
  getCorridorSeoPageBySlug,
  type CorridorSeoPageModel,
} from '@/lib/corridors/corridor-seo-page';
import {
  getPageSeoContract,
  metadataFromDbPageSeoContract,
} from '@/lib/seo/page-seo-contract-db';
import { MapPin, TrendingUp, Truck, ChevronRight, Shield, DollarSign, FileText } from 'lucide-react';

interface PageProps { params: Promise<{ slug: string }>; }

function createCorridorPageClient() {
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
  }

  return createClient();
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const canonicalPath = `/corridors/${slug}`;
  const contract = await getPageSeoContract(canonicalPath);
  if (contract) return metadataFromDbPageSeoContract(contract, canonicalPath);

  const supabase = createCorridorPageClient();
  const { data } = await supabase.from('hc_corridors').select('name,start_state,end_state,country_code').eq('corridor_key', slug).maybeSingle();
  if (!data) {
    const seoPage = await getCorridorSeoPageBySlug(supabase as any, slug);
    if (seoPage) {
      return generatePageMetadata({
        title: seoPage.title.replace(/\s+\|\s+Haul Command$/i, ''),
        description: seoPage.description,
        canonicalPath: seoPage.canonicalPath,
        countryCode: seoPage.countryCode,
        noIndex: !seoPage.shouldIndex,
        hreflang: false,
      });
    }
  }

  const name = data?.name || slug.split('-').map((w: string) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return generatePageMetadata({
    title: `${name} Heavy Haul Corridor — Escort Requirements & Rates`,
    description: `Live pilot car supply, permit requirements, and rate benchmarks for the ${name} heavy haul corridor. Find verified escort operators and post loads.`,
    canonicalPath,
  });
}

function CorridorSeoSeedPage({ page }: { page: CorridorSeoPageModel }) {
  const jsonLd = buildCorridorSeoJsonLd(page);

  return (
    <main className="hc-page-shell hc-surface-site-dark pb-20">
      <PageSeoContractJsonLd path={page.canonicalPath} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <div className="bg-[#0B0F14] text-white border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#C6923A]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/corridors" className="hover:text-[#C6923A]">Corridors</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400 truncate">{page.originLabel} to {page.destinationLabel}</span>
        </div>
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border border-[#C6923A]/30 bg-[#C6923A]/10 text-[#f6d36f]">
              <FileText className="w-3 h-3" /> {page.sourceConfidenceLabel}
            </span>
            <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-medium rounded-full">
              {page.shouldIndex ? 'Indexable' : 'Noindex until content is verified'}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{page.h1}</h1>
          <p className="max-w-3xl text-gray-300 text-base leading-7">{page.description}</p>
          <div className="mt-6 flex flex-wrap items-center gap-6 text-gray-400 text-sm">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#C6923A]" />{page.originLabel} to {page.destinationLabel}</span>
            <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" />{page.serviceLabel}</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-[#C6923A]" />{page.countryCode}</span>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          <section className="hc-surface-glass-panel rounded-2xl p-6">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C6923A] mb-2">Direct answer</p>
            <h2 className="text-2xl font-black text-white mb-3">Route support is being assembled for this corridor pair.</h2>
            <p className="text-gray-300 leading-7">
              Haul Command has a canonical SEO row for this corridor-service route, but it is still marked as
              {page.published ? ' published with limited content' : ' unpublished'} and does not yet contain source-backed content blocks.
              The page stays useful by routing brokers, carriers, escorts, and advertisers to actions that capture demand without inventing rates,
              operator counts, permit rules, or verified local coverage.
            </p>
          </section>

          <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              { label: 'Origin', value: page.originLabel },
              { label: 'Destination', value: page.destinationLabel },
              { label: 'Source state', value: page.publishStatus },
            ].map((item) => (
              <div key={item.label} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{item.label}</p>
                <p className="text-lg font-black text-gray-900">{item.value}</p>
              </div>
            ))}
          </section>

          <section className="hc-surface-glass-panel rounded-2xl p-6">
            <h2 className="text-xl font-black text-white mb-3">Source confidence</h2>
            <p className="text-gray-300 leading-7">{page.sourceConfidenceDetail}</p>
            <ul className="mt-4 space-y-2 text-sm text-gray-300">
              <li className="flex gap-2"><Shield className="w-4 h-4 text-[#C6923A] shrink-0 mt-0.5" /> No route-specific pricing is shown until supported by real observations.</li>
              <li className="flex gap-2"><Shield className="w-4 h-4 text-[#C6923A] shrink-0 mt-0.5" /> No operator or escort supply is claimed without directory records or verification signals.</li>
              <li className="flex gap-2"><Shield className="w-4 h-4 text-[#C6923A] shrink-0 mt-0.5" /> Permit and escort requirements link to source-backed requirement pages instead of being guessed here.</li>
            </ul>
          </section>
        </div>

        <aside className="lg:col-span-4 space-y-5">
          <div className="bg-[#0B0F14] text-white rounded-2xl p-5 sticky top-20 border border-white/10">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C6923A] mb-1">Need this lane covered?</p>
            <p className="text-sm text-gray-300 mb-4">Post demand or claim supply for {page.originLabel} to {page.destinationLabel}.</p>
            <Link href={`/loads/post?corridor=${page.slug}`} className="block w-full text-center px-4 py-2.5 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold text-sm rounded-lg mb-2 transition-colors">
              Post a Load
            </Link>
            <Link href={`/directory?where=${encodeURIComponent(`${page.originLabel} to ${page.destinationLabel}`)}`} className="block w-full text-center px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm rounded-lg transition-colors">
              Find Route Support
            </Link>
          </div>

          <AdGridSlot zone="corridor_sponsor" />

          <div className="hc-surface-glass-panel rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3 text-sm">Related Resources</h3>
            <div className="space-y-2">
              {[
                { href: '/escort-requirements', label: 'Escort Requirements' },
                { href: '/tools/permit-cost-calculator', label: 'Permit Calculator' },
                { href: '/directory', label: 'Find Support Records' },
                { href: '/claim', label: 'Claim Profile' },
                { href: '/advertise/buy', label: 'Sponsor This Corridor' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center justify-between text-sm text-gray-300 hover:text-[#C6923A] py-1 transition-colors">
                  <span>{label}</span><ChevronRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </aside>
      </div>

      <NoDeadEndBlock
        heading="Next route action"
        moves={[
          { href: '/directory', icon: 'FIND', title: 'Find Support Records', desc: 'Search claimable and verified route support', primary: true, color: '#D4A844' },
          { href: '/loads/post', icon: 'LOAD', title: 'Post a Load', desc: 'Create real corridor demand' },
          { href: '/claim', icon: 'OK', title: 'Claim Supply', desc: 'Add service areas and proof' },
          { href: '/escort-requirements', icon: 'LAW', title: 'Check Rules', desc: 'Source-backed escort requirements' },
          { href: '/advertise/buy?zone=corridor_sponsor', icon: 'AD', title: 'Sponsor Corridor', desc: 'Labeled AdGrid placement' },
        ]}
        style={{ maxWidth: 1152, marginTop: 32 }}
      />
    </main>
  );
}

export default async function CorridorPage({ params }: PageProps) {
  const { slug } = await params;
  const supabase = createCorridorPageClient();

  const { data: corridor } = await supabase
    .from('hc_corridors')
    .select('id, name, corridor_key, start_state, end_state, start_city, end_city, country_code, miles, demand_score, operator_count, load_count_30d, escort_demand_level, oversize_frequency, corridor_type, avg_rate_per_mile_cents, risk_tier')
    .eq('corridor_key', slug)
    .maybeSingle();

  if (!corridor) {
    const seoPage = await getCorridorSeoPageBySlug(supabase as any, slug);
    if (seoPage) return <CorridorSeoSeedPage page={seoPage} />;
    notFound();
  }

  const name = corridor.name;
  const origin = [corridor.start_city, corridor.start_state].filter(Boolean).join(', ') || corridor.start_state || 'Origin';
  const dest = [corridor.end_city, corridor.end_state].filter(Boolean).join(', ') || corridor.end_state || 'Destination';
  const demandScore = Number(corridor.demand_score ?? 0);
  const demandLabel = demandScore >= 70 ? 'High Demand' : demandScore >= 50 ? 'Moderate Demand' : 'Standard';
  const demandColor = demandScore >= 70 ? 'text-emerald-600 bg-emerald-50 border-emerald-200' : demandScore >= 50 ? 'text-amber-600 bg-amber-50 border-amber-200' : 'text-gray-600 bg-gray-50 border-gray-200';
  const ratePerMile = corridor.avg_rate_per_mile_cents ? `$${(corridor.avg_rate_per_mile_cents / 100).toFixed(2)}/mi` : 'Market Rate';

  // Related corridors (same country)
  const { data: related } = await supabase
    .from('hc_corridors')
    .select('corridor_key, name, start_state, end_state, demand_score')
    .eq('country_code', corridor.country_code)
    .neq('id', corridor.id)
    .order('demand_score', { ascending: false })
    .limit(6);

  // Operators in the start state
  const { data: operators } = await supabase
    .from('hc_global_operators')
    .select('id, name, slug, city, admin1_code, confidence_score, is_verified, is_claimed, entity_type')
    .eq('admin1_code', corridor.start_state || 'TX')
    .order('confidence_score', { ascending: false })
    .limit(6);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Escort Operators on ${name} Corridor`,
    description: `Verified pilot car and escort vehicle operators for the ${name} heavy haul corridor.`,
    url: `https://www.haulcommand.com/corridors/${slug}`,
    numberOfItems: operators?.length || 0,
  };

  return (
    <main className="hc-page-shell hc-surface-site-dark pb-20">
      <PageSeoContractJsonLd path={`/corridors/${slug}`} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Header */}
      <div className="bg-[#0B0F14] text-white border-b border-white/[0.06]">
        <div className="max-w-6xl mx-auto px-4 pt-6 pb-2 flex items-center gap-1.5 text-xs text-gray-500">
          <Link href="/" className="hover:text-[#C6923A]">Home</Link>
          <ChevronRight className="w-3 h-3" />
          <Link href="/corridors" className="hover:text-[#C6923A]">Corridors</Link>
          <ChevronRight className="w-3 h-3" />
          <span className="text-gray-400 truncate">{name}</span>
        </div>
        <div className="max-w-6xl mx-auto px-4 pt-4 pb-10">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs font-bold uppercase tracking-widest rounded-full border ${demandColor}`}>
              <TrendingUp className="w-3 h-3" /> {demandLabel}
            </span>
            {corridor.escort_demand_level && (
              <span className="px-3 py-1 bg-white/5 border border-white/10 text-gray-300 text-xs font-medium rounded-full">
                {corridor.escort_demand_level} escort demand
              </span>
            )}
          </div>
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">{name}</h1>
          <div className="flex flex-wrap items-center gap-6 text-gray-400 text-sm">
            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-[#C6923A]" />{origin} → {dest}</span>
            {corridor.miles && <span className="flex items-center gap-1.5"><Truck className="w-4 h-4" />{corridor.miles} miles</span>}
            {corridor.avg_rate_per_mile_cents && <span className="flex items-center gap-1.5"><DollarSign className="w-4 h-4 text-[#C6923A]" />{ratePerMile} avg</span>}
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* Main */}
        <div className="lg:col-span-8 space-y-8">

          {/* Stats Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Demand Score', value: String(demandScore), unit: '/ 100', color: demandScore >= 70 ? '#22C55E' : demandScore >= 50 ? '#F59E0B' : '#6B7280' },
              { label: 'Route Length', value: corridor.miles ? String(corridor.miles) : '—', unit: 'miles' },
              { label: 'Est. Rate', value: corridor.avg_rate_per_mile_cents ? `$${(corridor.avg_rate_per_mile_cents / 100).toFixed(2)}` : 'Market', unit: 'per mile' },
              { label: 'Risk Tier', value: corridor.risk_tier || 'Standard', unit: '' },
            ].map((s, i) => (
              <div key={i} className="p-4 bg-gray-50 border border-gray-200 rounded-xl">
                <p className="text-xs text-gray-500 uppercase tracking-widest mb-1">{s.label}</p>
                <p className="text-2xl font-black" style={{ color: s.color || '#111827' }}>{s.value}</p>
                {s.unit && <p className="text-xs text-gray-400">{s.unit}</p>}
              </div>
            ))}
          </div>

          {/* Operators */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-black text-white">Escort Operators Near {corridor.start_state}</h2>
              <Link href={`/directory/us/${(corridor.start_state || 'tx').toLowerCase()}`} className="text-sm font-semibold text-[#C6923A] hover:underline">
                See all →
              </Link>
            </div>
            {(operators?.length ?? 0) > 0 ? (
              <div className="space-y-3">
                {operators!.map((op: any) => (
                  <Link key={op.id} href={`/directory/dossier/${op.slug || op.id}`} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[#0B0F14] flex items-center justify-center shrink-0">
                        <Truck className="w-5 h-5 text-[#C6923A]" />
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 group-hover:text-[#C6923A] text-sm">{op.name}</p>
                        <p className="text-xs text-gray-500">{op.city ? `${op.city}, ` : ''}{op.admin1_code}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      {op.is_verified && <Shield className="w-4 h-4 text-emerald-500" />}
                      {!op.is_claimed && <span className="text-[10px] text-amber-500 font-bold bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">Unclaimed</span>}
                      <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-[#F1A91B]" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-10 bg-gray-50 rounded-xl border border-gray-200">
                <p className="text-gray-500 mb-3">No operators indexed for this corridor yet.</p>
                <Link href="/claim" className="text-[#C6923A] font-bold text-sm hover:underline">Claim your listing to appear here →</Link>
              </div>
            )}
          </div>

          {/* Related Corridors */}
          {(related?.length ?? 0) > 0 && (
            <div>
              <h2 className="text-xl font-black text-white mb-4">Related Corridors</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {related!.filter((r: any) => r.corridor_key).map((r: any) => (
                  <Link key={r.id} href={`/corridors/${r.corridor_key}`} className="flex items-center justify-between p-4 bg-gray-50 hover:bg-[#F1A91B]/5 border border-gray-200 hover:border-[#F1A91B]/30 rounded-xl transition-all group">
                    <div>
                      <p className="font-bold text-sm text-gray-800 group-hover:text-[#C6923A]">{r.name}</p>
                      <p className="text-xs text-gray-500">{r.start_state} → {r.end_state}</p>
                    </div>
                    <span className="text-xs font-bold px-2 py-0.5 bg-gray-200 rounded text-gray-600">{Number(r.demand_score || 0)}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4 space-y-5">
          {/* CTA */}
          <div className="bg-[#0B0F14] text-white rounded-2xl p-5 sticky top-20">
            <p className="text-xs font-bold uppercase tracking-widest text-[#C6923A] mb-1">Sponsor This Corridor</p>
            <p className="text-sm text-gray-300 mb-4">Reach every broker and operator searching the {name} corridor.</p>
            <Link href={`/advertise/buy?zone=corridor_sponsor&corridor=${slug}`} className="block w-full text-center px-4 py-2.5 bg-[#F1A91B] hover:bg-[#D4951A] text-black font-bold text-sm rounded-lg mb-2 transition-colors">
              Sponsor This Corridor — $199/mo
            </Link>
            <Link href="/loads/post" className="block w-full text-center px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold text-sm rounded-lg transition-colors">
              Post a Load
            </Link>
          </div>

          {/* AdGrid slot */}
          <AdGridSlot zone="corridor_sponsor" />

          {/* Quick Links */}
          <div className="hc-surface-glass-panel rounded-2xl p-5">
            <h3 className="font-bold text-white mb-3 text-sm">Related Resources</h3>
            <div className="space-y-2">
              {[
                { href: '/escort-requirements', label: 'Escort Requirements' },
                { href: '/rates', label: 'Rate Index' },
                { href: '/tools/permit-cost-calculator', label: 'Permit Calculator' },
                { href: '/loads', label: 'Load Board' },
                { href: '/training', label: 'Get Certified' },
                { href: '/glossary', label: 'Glossary' },
                { href: '/available-now', label: 'Available Now' },
                { href: '/claim', label: 'Claim Profile' },
                { href: '/advertise/buy', label: 'Sponsor This Corridor' },
              ].map(({ href, label }) => (
                <Link key={href} href={href} className="flex items-center justify-between text-sm text-gray-300 hover:text-[#C6923A] py-1 transition-colors">
                  <span>{label}</span><ChevronRight className="w-4 h-4" />
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
