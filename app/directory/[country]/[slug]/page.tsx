import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { contractToMetadata } from '@/lib/seo/page-seo-contract';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { JsonLd } from '@/components/seo/JsonLd';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { Shield, MapPin, ArrowRight, ChevronRight, Users } from 'lucide-react';
import { notFound, redirect } from 'next/navigation';
import { stateFullName } from '@/lib/geo/state-names';
import { DirectoryBackgroundShell } from '@/components/directory/DirectoryBackgroundShell';
import {
  buildDirectoryMarketFilterPlan,
  type DirectoryMarketFilterPlan,
  type DirectorySurfaceView,
} from '@/lib/directory/server-query';
import { buildDirectoryMarketSeoContract } from '@/lib/directory/presentation';
import { buildFAQPageJsonLd } from '@/lib/seo/jsonld';

// ═══════════════════════════════════════════════════════════════
// /directory/[country]/[slug] — City-level directory page
// SEO-optimized local landing page with operator listings,
// trust signals, sponsor zones, and local proof.
// Designed for "pilot car [city]" and "escort service [city]" intent.
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ country: string; slug: string }>;
}

function displayName(op: any) {
  return op.company_name || op.company || op.name || op.display_name || 'Indexed support record';
}

function recordId(op: any) {
  return op.contact_id || op.canonical_entity_id || op.id;
}

function isVerifiedRecord(op: any) {
  const status = String(op.verification_status || '').toLowerCase();
  return Boolean(op.is_verified || status.includes('verified') || status.includes('confirmed'));
}

function isClaimedRecord(op: any) {
  const status = String(op.claim_status || '').toLowerCase();
  return Boolean(op.is_claimed || status === 'claimed' || status === 'approved');
}

function cityClaimHref(country: string, slug: string, listing?: string) {
  const search = new URLSearchParams({
    country,
    market: slug,
    intent: listing ? 'listing-claim' : 'city-market-claim',
    source: 'directory-city',
  });
  if (listing) search.set('listing', listing);
  return `/claim?${search.toString()}`;
}

function rankDirectoryRecord(record: any) {
  return Number(record.rank_score ?? record.confidence_score ?? record.directory_quality_score ?? 0);
}

async function countDirectoryMarketRecords(
  supabase: ReturnType<typeof createClient>,
  plan: DirectoryMarketFilterPlan,
  countryUpper: string,
) {
  const counts = await Promise.all(
    plan.surfaceViews.map(async (surfaceView: DirectorySurfaceView) => {
      const { count, error } = await supabase
        .from(surfaceView)
        .select('*', { count: 'exact', head: true })
        .eq('country_code', countryUpper)
        .or(plan.locationOrFilter);

      if (error) {
        console.warn(`[directory-city] Count query failed for ${surfaceView}:`, error.message);
        return 0;
      }

      return count ?? 0;
    }),
  );

  return counts.reduce((sum, count) => sum + count, 0);
}

async function fetchDirectoryMarketRecords(
  supabase: ReturnType<typeof createClient>,
  plan: DirectoryMarketFilterPlan,
  countryUpper: string,
) {
  const perSurfaceLimit = Math.max(8, Math.ceil(plan.limit / Math.max(plan.surfaceViews.length, 1)));

  const surfaceResults = await Promise.all(
    plan.surfaceViews.map(async (surfaceView: DirectorySurfaceView) => {
      let query = supabase
        .from(surfaceView)
        .select('*', { count: 'exact' })
        .eq('country_code', countryUpper)
        .or(plan.locationOrFilter);

      for (const order of plan.order) {
        query = query.order(order.column, {
          ascending: order.ascending,
          nullsFirst: false,
        });
      }

      const { data, count, error } = await query.limit(perSurfaceLimit);

      if (error) {
        console.warn(`[directory-city] Surface query failed for ${surfaceView}:`, error.message);
        return { records: [], count: 0 };
      }

      return {
        records: (data ?? []).map((record: any) => ({
          ...record,
          source_view: record.source_view || surfaceView,
          contact_id: record.contact_id || record.canonical_entity_id || record.id,
        })),
        count: count ?? data?.length ?? 0,
      };
    }),
  );

  return {
    records: surfaceResults
      .flatMap((result) => result.records)
      .sort((a: any, b: any) => rankDirectoryRecord(b) - rankDirectoryRecord(a))
      .slice(0, plan.limit),
    totalCount: surfaceResults.reduce((sum, result) => sum + result.count, 0),
  };
}

export async function generateMetadata({ params }: PageProps) {
  const { country, slug } = await params;
  const plan = buildDirectoryMarketFilterPlan({ country, slug });
  const countryUpper = plan.countryCode ?? country.toUpperCase();
  const marketName = plan.marketName;
  const supabase = createClient();
  const count = await countDirectoryMarketRecords(supabase, plan, countryUpper);

  return contractToMetadata(buildDirectoryMarketSeoContract({
    countryCode: countryUpper,
    marketName,
    slug,
    recordCount: count,
    noIndexWhenEmpty: plan.noIndexWhenEmpty,
    marketKind: plan.scope.type === 'region' ? 'region' : plan.scope.type === 'metro' ? 'metro' : 'city',
  }));
}

export default async function CityDirectoryPage({ params }: PageProps) {
  const { country, slug } = await params;
  // Guard: if params resolution fails for any reason, 404 cleanly
  if (!country || !slug) { notFound(); }
  const plan = buildDirectoryMarketFilterPlan({ country, slug });
  const countryUpper = plan.countryCode ?? country.toUpperCase();

  const supabase = createClient();

  // ── OPERATOR-FIRST RESOLUTION ─────────────────────────────────
  // P0 FIX: Check if this slug matches an operator before treating
  // it as a city name. Without this, URLs like
  // /directory/ak/lopez-contracting-nc-pilot-driver render as
  // "Pilot Car Services in Lopez Contracting Nc Pilot Driver"
  // with 0 operators — destroying trust.
  // ──────────────────────────────────────────────────────────────
  let operatorMatch: any = null;
  try {
    const { data } = await supabase
      .from('v_directory_operators')
      .select('*')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();
    operatorMatch = data;

  } catch (e) {
    // Slug doesn't match an operator — fall through to city behavior
  }

  if (operatorMatch) {
    redirect(`/directory/dossier/${recordId(operatorMatch)}`);
  }

  const cityName = plan.marketName;
  const marketKind = plan.scope.type === 'region' ? 'region' : plan.scope.type === 'metro' ? 'metro' : 'city';

  // Fetch public directory records in this market through the directory surface facade.
  const { records: ops, totalCount } = await fetchDirectoryMarketRecords(supabase, plan, countryUpper);
  const opCount = totalCount || ops.length;

  // If absolutely no operators found, still render the page (SEO value)
  // but show a CTA instead of just 404

  const visibleFaqs = [
    { question: `How many pilot car support records serve ${cityName}?`, answer: opCount > 0 ? `There are currently ${opCount} support records listed in the ${cityName} area. Each record should be judged by its claim, proof, contact, and freshness state.` : `We are actively growing our ${cityName} network. Claim or submit a support record to help build the market.` },
    { question: `How do I book an escort in ${cityName}?`, answer: opCount > 0 ? `Browse the support records listed above, check proof state and availability where present, and build a support packet before dispatching.` : `Once more support records are claimed and improved in ${cityName}, you will be able to compare stronger options. Use our Escort Calculator for estimates in the meantime.` },
    { question: `What does a pilot car cost in ${cityName}?`, answer: `Rates vary by route, load dimensions, and escort requirements. Use our Escort Calculator for instant estimates based on your specific haul.` },
  ];

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pilot car and heavy haul support records in ${cityName}`,
    description: `Claimable and proof-state directory records in the ${cityName} ${marketKind}, ${countryUpper}`,
    numberOfItems: opCount,
    itemListElement: ops.slice(0, 10).map((op: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: displayName(op),
        address: { '@type': 'PostalAddress', addressLocality: op.city_inferred || op.city, addressRegion: op.state_inferred || op.admin1_code || countryUpper, addressCountry: countryUpper },
      },
    })),
  };
  const faqJsonLd = buildFAQPageJsonLd({
    url: `https://www.haulcommand.com/directory/${country}/${slug}`,
    faqs: visibleFaqs.map((faq) => ({ ...faq, visible: true })),
  });

  return (
    <>
      <JsonLd data={faqJsonLd ? [jsonLd, faqJsonLd] : jsonLd} />
      <ProofStrip variant="bar" />

      <DirectoryBackgroundShell>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #E5E7EB', background: 'var(--hc-graphite)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6b7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/directory" style={{ color: '#9ca3af', textDecoration: 'none' }}>Directory</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <Link href={`/directory/${country}`} style={{ color: '#9ca3af', textDecoration: 'none' }}>{countryUpper}</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#C6923A' }}>{cityName}</span>
            </nav>

            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.02em' }}>
              Pilot Car Services in <span style={{ color: '#C6923A' }}>{cityName}</span>
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: '#9ca3af', lineHeight: 1.6, maxWidth: 600 }}>
              {opCount > 0
                ? `${opCount} indexed support records serving the ${cityName} area. Compare proof state, claim status, contact paths, and support actions before dispatch.`
                : `Looking for pilot car operators in ${cityName}? Submit or claim a support record so the market can mature without fake supply.`}
            </p>

            {/* Stats strip */}
            {opCount > 0 && (
              <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                {[
                  { icon: Users, val: opCount, label: 'Records' },
                  { icon: Shield, val: ops.filter(isVerifiedRecord).length, label: 'Proofed' },
                  { icon: Shield, val: ops.filter(isClaimedRecord).length, label: 'Claimed' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <s.icon style={{ width: 14, height: 14, color: '#C6923A' }} />
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb' }}>{s.val}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6b7280', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md:!grid-cols-[1fr_320px]">

          {/* Support record grid */}
          <div>
            {ops.length === 0 ? (
              <div style={{ background: '#FFFBEB', border: '1px solid #FEF08A', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <MapPin style={{ width: 32, height: 32, color: '#C6923A', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb', marginBottom: 8 }}>Market Open: {cityName}</h2>
                <p style={{ fontSize: 14, color: '#9ca3af', marginBottom: 24 }}>There are currently no source-backed support records listed in this territory. Claim or submit a listing to open the market with real proof.</p>
                <Link href={cityClaimHref(countryUpper, slug)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 12, background: '#F1A91B',
                  color: '#f9fafb', fontSize: 15, fontWeight: 900, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4)'
                }}>
                  Claim the {cityName} Market <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {ops.map((op: any) => (
                  <div key={recordId(op)} style={{
                    background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0056B3', margin: 0, lineHeight: 1.3 }}>
                          {displayName(op)}
                        </h3>
                      </div>
                      {op.confidence_score && (
                        <span style={{
                          fontSize: 11, fontWeight: 900, padding: '4px 8px', borderRadius: 8,
                          background: op.confidence_score >= 80 ? '#F0FDF4' : op.confidence_score >= 50 ? '#FEF9C3' : '#FEF2F2',
                          color: op.confidence_score >= 80 ? '#15803D' : op.confidence_score >= 50 ? '#854D0E' : '#991B1B',
                          border: `1px solid ${op.confidence_score >= 80 ? '#BBF7D0' : op.confidence_score >= 50 ? '#FEF08A' : '#FECACA'}`,
                        }}>
                          {op.confidence_score}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 500 }}>
                      <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4, color: '#6b7280' }} />
                      {[op.city_inferred || op.city, stateFullName(op.state_inferred || op.admin1_code || op.state)].filter(Boolean).join(', ')}
                    </div>

                    {[] && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(Array.isArray([]) ? [] : []).slice(0, 3).map((eq: string) => (
                          <span key={eq} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, background: '#F3F4F6', color: '#374151', border: '1px solid rgba(255,255,255,0.06)' }}>
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                      <Link href={`/directory/dossier/${recordId(op)}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: 'var(--hc-graphite)', border: '1px solid #D1D5DB',
                        color: '#374151', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      }}>
                        View Profile
                      </Link>
                      <Link href={`/loads/post?intent=city-support&country=${countryUpper}&market=${encodeURIComponent(slug)}&listing=${encodeURIComponent(recordId(op))}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: '#0a66c2', border: '1px solid #004182',
                        color: '#ffffff', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      }}>
                        Contact
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Claim CTA for operators */}
            <div style={{ marginTop: 24, background: '#FDF4FF', border: '1px solid #F0ABFC', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#86198F', marginBottom: 4 }}>Support {cityName}?</h3>
                <p style={{ fontSize: 13, color: '#A21CAF', margin: 0 }}>Claim your free listing and appear in local heavy haul support searches.</p>
              </div>
              <Link href={cityClaimHref(countryUpper, slug)} style={{
                padding: '10px 20px', borderRadius: 8, background: '#86198F',
                color: '#ffffff', fontSize: 13, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Claim Free
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AdGridSlot zone={`city_${slug}_sponsor`} />

            {/* Local context */}
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                {cityName} Area Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: `/regulations/${country.toLowerCase()}`, label: 'Country Requirements', icon: '01' },
                  { href: `/corridors?country=${countryUpper}`, label: 'Find Source-Backed Corridors', icon: '02' },
                  { href: `/tools?country=${countryUpper}`, label: 'Heavy Haul Tools', icon: '03' },
                  { href: `/loads/post?country=${countryUpper}&market=${encodeURIComponent(slug)}&intent=city-support`, label: 'Build Support Packet', icon: '04' },
                  { href: `/directory/${country}`, label: `Browse All ${countryUpper}`, icon: '05' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, fontSize: 13, color: '#9ca3af', textDecoration: 'none',
                    transition: 'all 0.15s', background: '#F9FAFB'
                  }} className="hover:bg-gray-100">
                    <span>{l.icon}</span> <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ Section for local SEO */}
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                FAQ
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {visibleFaqs.map((faq, i) => (
                  <div key={i}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>{faq.question}</h4>
                    <p style={{ fontSize: 12, color: '#6b7280', lineHeight: 1.5, margin: 0 }}>{faq.answer}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Product Teaser: Market Pulse */}
            <div style={{ background: 'var(--hc-graphite)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Market Pulse
                </h3>
                <span className="bg-[#FEF9C3] text-[#854D0E] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#FDE047]">
                  PRO
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6b7280', marginBottom: 16 }}>Rate bands, route demand, and corridor sponsor inventory unlock after source-backed market signals are attached.</p>
              
              <div style={{ opacity: 0.72, userSelect: 'none', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                {['Rate observations', 'Support density', 'Top corridor signals'].map((label) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#f9fafb' }}>{label}</span>
                    <span style={{ fontSize: 12, color: '#9ca3af', fontWeight: 800 }}>Source review</span>
                  </div>
                ))}
              </div>

              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0.4))' }}>
                <Link href={`/pricing?intent=market-pulse&country=${countryUpper}&region=${encodeURIComponent(slug)}`} style={{
                  background: '#C6923A', color: '#ffffff', padding: '10px 20px', borderRadius: 8,
                  fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 0.5,
                  textDecoration: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)'
                }} className="hover:bg-[#B45309] transition-colors">
                  Unlock Pro Data
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* No Dead End */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
          <NoDeadEndBlock
            heading={`Looking for More in ${cityName}?`}
            moves={[
              { href: '/directory', icon: '🔍', title: 'Full Directory', desc: 'Search all support records', primary: true, color: '#0a66c2' },
              { href: '/claim', icon: '✓', title: 'Claim / Fix Profile', desc: 'Improve a claimable record', primary: true, color: '#86198F' },
              { href: '/available-now', icon: '📡', title: 'Available Now', desc: 'Live operator feed' },
              { href: '/corridors', icon: '🗺️', title: 'Corridors', desc: 'Route intelligence' },
              { href: '/escort-requirements', icon: '⚖️', title: 'Requirements', desc: 'State escort rules' },
              { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC training program' },
            ]}
          />
        </div>
      </DirectoryBackgroundShell>
    </>
  );
}
