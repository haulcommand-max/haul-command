import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { Shield, MapPin, Star, ArrowRight, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { notFound } from 'next/navigation';
import { stateFullName, countryFullName } from '@/lib/geo/state-names';

// ═══════════════════════════════════════════════════════════════
// /directory/[country]/[slug] — City-level directory page
// SEO-optimized local landing page with operator listings,
// trust signals, sponsor zones, and local proof.
// Designed for "pilot car [city]" and "escort service [city]" intent.
// ═══════════════════════════════════════════════════════════════

interface PageProps {
  params: Promise<{ country: string; slug: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { country, slug } = await params;
  const cityName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const countryUpper = country.toUpperCase();

  return generatePageMetadata({
    title: `Pilot Car & Escort Services in ${cityName} | Haul Command`,
    description: `Find verified pilot car operators and oversize load escort services in ${cityName}, ${countryUpper}. Real-time availability, trust scores, and instant dispatch matching.`,
    canonicalPath: `/directory/${country}/${slug}`,
  });
}

export default async function CityDirectoryPage({ params }: PageProps) {
  const { country, slug } = await params;
  // Guard: if params resolution fails for any reason, 404 cleanly
  if (!country || !slug) { notFound(); }
  const countryUpper = country.toUpperCase();

  const supabase = createClient();

  // ── OPERATOR-FIRST RESOLUTION ─────────────────────────────────
  // P0 FIX: Check if this slug matches an operator before treating
  // it as a city name. Without this, URLs like
  // /directory/ak/lopez-contracting-nc-pilot-driver render as
  // "Pilot Car Services in Lopez Contracting Nc Pilot Driver"
  // with 0 operators — destroying trust.
  // ──────────────────────────────────────────────────────────────
  try {
    const { data: operatorMatch } = await supabase
      .from('hc_global_operators')
      .select('id, slug')
      .eq('slug', slug)
      .limit(1)
      .maybeSingle();

    if (operatorMatch) {
      // Redirect to the proper dossier page
      const { redirect } = await import('next/navigation');
      redirect(`/directory/dossier/${operatorMatch.id}`);
    }
  } catch (e) {
    // Slug doesn't match an operator — fall through to city behavior
  }

  const cityName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  // Fetch operators in this city
  const { data: operators, count: totalCount } = await supabase
    .from('hc_global_operators')
    .select('id, name, slug, city, admin1_code, country_code, confidence_score, is_verified, is_claimed, entity_type, phone_normalized', { count: 'exact' })
    .ilike('city', cityName)
    .eq('country_code', countryUpper)
    .order('confidence_score', { ascending: false })
    .limit(24)
    .then(r => r)
    .catch(() => ({ data: null, count: null })) as any;

  const ops = operators ?? [];
  const opCount = totalCount ?? ops.length;

  // If absolutely no operators found, still render the page (SEO value)
  // but show a CTA instead of just 404

  // JSON-LD
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: `Pilot Car Operators in ${cityName}`,
    description: `Verified escort vehicle operators in ${cityName}, ${countryUpper}`,
    numberOfItems: opCount,
    itemListElement: ops.slice(0, 10).map((op: any, i: number) => ({
      '@type': 'ListItem',
      position: i + 1,
      item: {
        '@type': 'LocalBusiness',
        name: op.name,
        address: { '@type': 'PostalAddress', addressLocality: op.city, addressRegion: op.admin1_code || countryUpper, addressCountry: countryUpper },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProofStrip variant="bar" />

      <main style={{ minHeight: '100vh', background: '#F9FAFB', color: '#111827' }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid #E5E7EB', background: '#ffffff' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#6B7280', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/directory" style={{ color: '#4B5563', textDecoration: 'none' }}>Directory</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <Link href={`/directory/${country}`} style={{ color: '#4B5563', textDecoration: 'none' }}>{countryUpper}</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#C6923A' }}>{cityName}</span>
            </nav>

            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#111827', letterSpacing: '-0.02em' }}>
              Pilot Car Services in <span style={{ color: '#C6923A' }}>{cityName}</span>
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: '#4B5563', lineHeight: 1.6, maxWidth: 600 }}>
              {opCount > 0
                ? `${opCount} verified escort operators serving the ${cityName} area. Trust scores, real-time availability, and instant dispatch.`
                : `Looking for pilot car operators in ${cityName}? Be the first to claim your listing.`}
            </p>

            {/* Stats strip */}
            {opCount > 0 && (
              <div style={{ display: 'flex', gap: 20, marginTop: 20, flexWrap: 'wrap' }}>
                {[
                  { icon: Users, val: opCount, label: 'Operators' },
                  { icon: Shield, val: ops.filter((o: any) => o.verification_status === 'verified').length, label: 'Verified' },
                  { icon: Star, val: ops[0]?.rating_avg ? `${Number(ops[0].rating_avg).toFixed(1)}★` : '—', label: 'Top Rated' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <s.icon style={{ width: 14, height: 14, color: '#C6923A' }} />
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#111827' }}>{s.val}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr', gap: 24 }} className="md:!grid-cols-[1fr_320px]">

          {/* Operator grid */}
          <div>
            {ops.length === 0 ? (
              <div style={{ background: '#FFFBEB', border: '1px solid #FEF08A', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <MapPin style={{ width: 32, height: 32, color: '#C6923A', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 20, fontWeight: 900, color: '#111827', marginBottom: 8 }}>Market Open: {cityName}</h2>
                <p style={{ fontSize: 14, color: '#4B5563', marginBottom: 24 }}>There are currently no verified pilot car operators listed in this territory. Secure the top spot before your competitors do.</p>
                <Link href={`/claim?market=${slug}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 10, padding: '14px 28px',
                  borderRadius: 12, background: '#F1A91B',
                  color: '#111827', fontSize: 15, fontWeight: 900, textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(250, 204, 21, 0.4)'
                }}>
                  Claim the {cityName} Market <ArrowRight style={{ width: 16, height: 16 }} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {ops.map((op: any) => (
                  <div key={op.id} style={{
                    background: '#ffffff', border: '1px solid #E5E7EB',
                    borderRadius: 12, padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
                    boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#0056B3', margin: 0, lineHeight: 1.3 }}>
                          {op.company_name || 'Operator'}
                        </h3>
                        {/* <FreshnessBadge lastSeenAt={op.last_seen_at || new Date().toISOString()} /> */}
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

                    <div style={{ fontSize: 12, color: '#4B5563', fontWeight: 500 }}>
                      <MapPin style={{ width: 12, height: 12, display: 'inline', marginRight: 4, color: '#6B7280' }} />
                      {[op.city, stateFullName(op.admin1_code)].filter(Boolean).join(', ')}
                    </div>

                    {[] && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(Array.isArray([]) ? [] : []).slice(0, 3).map((eq: string) => (
                          <span key={eq} style={{ fontSize: 10, padding: '3px 8px', borderRadius: 100, background: '#F3F4F6', color: '#374151', border: '1px solid #E5E7EB' }}>
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto', paddingTop: 8 }}>
                      <Link href={`/report-card/${op.id}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: '#ffffff', border: '1px solid #D1D5DB',
                        color: '#374151', fontSize: 12, fontWeight: 700, textDecoration: 'none',
                      }}>
                        View Profile
                      </Link>
                      <Link href="/available-now" style={{
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
                <h3 style={{ fontSize: 16, fontWeight: 800, color: '#86198F', marginBottom: 4 }}>Operate in {cityName}?</h3>
                <p style={{ fontSize: 13, color: '#A21CAF', margin: 0 }}>Claim your free listing and appear in local Pilot Car searches.</p>
              </div>
              <Link href="/claim" style={{
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
            <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                {cityName} Area Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { href: '/escort-requirements', label: 'State Escort Requirements', icon: '⚖️' },
                  { href: '/corridors', label: 'Find Active Corridors', icon: '🗺️' },
                  { href: '/tools/escort-calculator', label: 'Rate Calculator', icon: '🧮' },
                  { href: '/available-now', label: 'Who Is Available Now?', icon: '📡' },
                  { href: `/directory/${country}`, label: `Browse All ${countryUpper}`, icon: '🔍' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                    borderRadius: 8, fontSize: 13, color: '#4B5563', textDecoration: 'none',
                    transition: 'all 0.15s', background: '#F9FAFB'
                  }} className="hover:bg-gray-100">
                    <span>{l.icon}</span> <span style={{ fontWeight: 600 }}>{l.label}</span>
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ Section for local SEO */}
            <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16 }}>
                FAQ
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[
                  { q: `How many pilot car operators serve ${cityName}?`, a: opCount > 0 ? `There are currently ${opCount} verified operators listed in the ${cityName} area.` : `We are actively growing our ${cityName} network. Claim your listing to be the first.` },
                  { q: `How do I book an escort in ${cityName}?`, a: opCount > 0 ? `Browse verified operators listed above, check their availability status, and dispatch directly through the platform.` : `Once operators are verified in ${cityName}, you'll be able to view availability and dispatch directly. Use our Escort Calculator for instant rate estimates in the meantime.` },
                  { q: `What does a pilot car cost in ${cityName}?`, a: `Rates vary by route, load dimensions, and escort requirements. Use our Escort Calculator for instant estimates based on your specific haul.` },
                ].map((faq, i) => (
                  <div key={i}>
                    <h4 style={{ fontSize: 13, fontWeight: 800, color: '#111827', marginBottom: 4 }}>{faq.q}</h4>
                    <p style={{ fontSize: 12, color: '#6B7280', lineHeight: 1.5, margin: 0 }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Data Product Teaser: Market Pulse */}
            <div style={{ background: '#ffffff', border: '1px solid #E5E7EB', borderRadius: 12, padding: 20, boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#111827', textTransform: 'uppercase', letterSpacing: 1 }}>
                  Market Pulse
                </h3>
                <span className="bg-[#FEF9C3] text-[#854D0E] text-[10px] uppercase font-bold px-2 py-0.5 rounded border border-[#FDE047]">
                  PRO
                </span>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280', marginBottom: 16 }}>Live rate data and high-demand corridors for the {cityName} region.</p>
              
              <div style={{ filter: 'blur(4px)', opacity: 0.6, userSelect: 'none', pointerEvents: 'none', display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Avg Rate/Mile</span>
                  <span style={{ fontSize: 12, color: '#059669', fontWeight: 800 }}>$1.85 - $2.10</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E5E7EB', paddingBottom: 8 }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Load Volume (30d)</span>
                  <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 800 }}>142 Loads</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 12, fontWeight: 700, color: '#111827' }}>Top Corridor</span>
                  <span style={{ fontSize: 12, color: '#4B5563', fontWeight: 800 }}>→ Houston, TX</span>
                </div>
              </div>

              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(to top, rgba(255,255,255,1), rgba(255,255,255,0.4))' }}>
                <Link href={`/pricing?intent=market-pulse&region=${slug}`} style={{
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
              { href: '/directory', icon: '🔍', title: 'Full Directory', desc: 'All verified operators', primary: true, color: '#0a66c2' },
              { href: '/claim', icon: '✓', title: 'Claim Listing', desc: 'Free for operators', primary: true, color: '#86198F' },
              { href: '/available-now', icon: '📡', title: 'Available Now', desc: 'Live operator feed' },
              { href: '/corridors', icon: '🗺️', title: 'Corridors', desc: 'Route intelligence' },
              { href: '/escort-requirements', icon: '⚖️', title: 'Requirements', desc: 'State escort rules' },
              { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC training program' },
            ]}
          />
        </div>
      </main>
    </>
  );
}
