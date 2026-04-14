import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { generatePageMetadata } from '@/lib/seo/metadataFactory';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { Shield, MapPin, Star, ArrowRight, ChevronRight, Users, TrendingUp } from 'lucide-react';
import { notFound } from 'next/navigation';

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
  const cityName = slug.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  const countryUpper = country.toUpperCase();

  const supabase = createClient();

  // Fetch operators in this city
  const { data: operators, count: totalCount } = await supabase
    .from('hc_global_operators')
    .select('id, company_name, city, state_code, trust_score, verification_status, equipment_types, rating_avg, review_count, primary_service_area', { count: 'exact' })
    .ilike('city', cityName)
    .eq('country_code', countryUpper)
    .order('trust_score', { ascending: false })
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
        name: op.company_name,
        address: { '@type': 'PostalAddress', addressLocality: op.city, addressRegion: op.state_code, addressCountry: countryUpper },
      },
    })),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProofStrip variant="bar" />

      <main style={{ minHeight: '100vh', background: '#050608', color: '#e5e7eb' }}>

        {/* Header */}
        <div style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', background: '#0a0d14' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem 2.5rem' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <Link href={`/directory/${country}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{countryUpper}</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#C6923A' }}>{cityName}</span>
            </nav>

            <h1 style={{ margin: '0 0 8px', fontSize: 'clamp(1.8rem, 4vw, 2.8rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.02em' }}>
              Pilot Car Services in <span style={{ color: '#C6923A' }}>{cityName}</span>
            </h1>
            <p style={{ margin: 0, fontSize: 15, color: '#94a3b8', lineHeight: 1.6, maxWidth: 600 }}>
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
                    <span style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb' }}>{s.val}</span>
                    <span style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '2rem 1.5rem', display: 'grid', gridTemplateColumns: '1fr 320px', gap: 24 }}>

          {/* Operator grid */}
          <div>
            {ops.length === 0 ? (
              <div style={{ background: 'rgba(198,146,58,0.06)', border: '1px solid rgba(198,146,58,0.2)', borderRadius: 16, padding: 40, textAlign: 'center' }}>
                <MapPin style={{ width: 32, height: 32, color: '#C6923A', margin: '0 auto 12px' }} />
                <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', marginBottom: 8 }}>No operators listed in {cityName} yet</h2>
                <p style={{ fontSize: 13, color: '#94a3b8', marginBottom: 20 }}>Be the first verified escort operator in this market.</p>
                <Link href="/claim" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px',
                  borderRadius: 12, background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                  color: '#000', fontSize: 13, fontWeight: 900, textDecoration: 'none',
                }}>
                  Claim Free Listing <ArrowRight style={{ width: 14, height: 14 }} />
                </Link>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
                {ops.map((op: any) => (
                  <div key={op.id} style={{
                    background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                    borderRadius: 16, padding: 20, display: 'flex', flexDirection: 'column', gap: 8,
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', margin: 0, lineHeight: 1.3 }}>
                          {op.company_name || 'Operator'}
                        </h3>
                        <FreshnessBadge lastSeenAt={op.last_seen_at || new Date().toISOString()} />
                      </div>
                      {op.trust_score && (
                        <span style={{
                          fontSize: 11, fontWeight: 900, padding: '2px 8px', borderRadius: 8,
                          background: op.trust_score >= 80 ? 'rgba(34,197,94,0.1)' : op.trust_score >= 50 ? 'rgba(234,179,8,0.1)' : 'rgba(239,68,68,0.1)',
                          color: op.trust_score >= 80 ? '#22c55e' : op.trust_score >= 50 ? '#eab308' : '#ef4444',
                        }}>
                          {op.trust_score}
                        </span>
                      )}
                    </div>

                    <div style={{ fontSize: 11, color: '#64748b' }}>
                      {[op.city, op.state_code].filter(Boolean).join(', ')}
                    </div>

                    {op.equipment_types && (
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                        {(Array.isArray(op.equipment_types) ? op.equipment_types : []).slice(0, 3).map((eq: string) => (
                          <span key={eq} style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.04)', color: '#94a3b8' }}>
                            {eq}
                          </span>
                        ))}
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 8, marginTop: 'auto' }}>
                      <Link href={`/report-card/${op.id}`} style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.2)',
                        color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none',
                      }}>
                        Report Card
                      </Link>
                      <Link href="/available-now" style={{
                        flex: 1, textAlign: 'center', padding: '8px', borderRadius: 8,
                        background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
                        color: '#94a3b8', fontSize: 11, fontWeight: 700, textDecoration: 'none',
                      }}>
                        Check Availability
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Claim CTA for operators */}
            <div style={{ marginTop: 24, background: 'rgba(34,197,94,0.04)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 14, padding: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb', marginBottom: 4 }}>Operate in {cityName}?</h3>
                <p style={{ fontSize: 12, color: '#94a3b8', margin: 0 }}>Claim your free listing and appear in local searches.</p>
              </div>
              <Link href="/claim" style={{
                padding: '10px 20px', borderRadius: 10, background: '#22c55e',
                color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap',
              }}>
                Claim Free →
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <AdGridSlot zone={`city_${slug}_sponsor`} />

            {/* Local context */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                {cityName} Quick Links
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {[
                  { href: '/escort-requirements', label: 'Escort Requirements by State', icon: '⚖️' },
                  { href: '/corridors', label: 'Active Corridors', icon: '🗺️' },
                  { href: '/tools/escort-calculator', label: 'Escort Rate Calculator', icon: '🧮' },
                  { href: '/available-now', label: 'Available Now Feed', icon: '📡' },
                  { href: `/directory/${country}`, label: `All ${countryUpper} Operators`, icon: '🔍' },
                ].map(l => (
                  <Link key={l.href} href={l.href} style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '8px 10px',
                    borderRadius: 8, fontSize: 12, color: '#94a3b8', textDecoration: 'none',
                    transition: 'all 0.15s',
                  }}>
                    <span>{l.icon}</span> {l.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* FAQ Section for local SEO */}
            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 14, padding: 20 }}>
              <h3 style={{ fontSize: 12, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 12 }}>
                FAQ
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { q: `How many pilot car operators serve ${cityName}?`, a: opCount > 0 ? `There are currently ${opCount} verified operators listed in the ${cityName} area.` : `We are actively growing our ${cityName} network. Claim your listing to be the first.` },
                  { q: `How do I book an escort in ${cityName}?`, a: opCount > 0 ? `Browse verified operators listed above, check their availability status, and dispatch directly through the platform.` : `Once operators are verified in ${cityName}, you'll be able to view availability and dispatch directly. Use our Escort Calculator for instant rate estimates in the meantime.` },
                  { q: `What does a pilot car cost in ${cityName}?`, a: `Rates vary by route, load dimensions, and escort requirements. Use our Escort Calculator for instant estimates based on your specific haul.` },
                ].map(faq => (
                  <div key={faq.q}>
                    <h4 style={{ fontSize: 12, fontWeight: 700, color: '#d1d5db', marginBottom: 4 }}>{faq.q}</h4>
                    <p style={{ fontSize: 11, color: '#64748b', lineHeight: 1.5, margin: 0 }}>{faq.a}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* No Dead End */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem 3rem' }}>
          <NoDeadEndBlock
            heading={`Looking for More in ${cityName}?`}
            moves={[
              { href: '/directory', icon: '🔍', title: 'Full Directory', desc: 'All verified operators', primary: true, color: '#C6923A' },
              { href: '/claim', icon: '✓', title: 'Claim Listing', desc: 'Free for operators', primary: true, color: '#22C55E' },
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
