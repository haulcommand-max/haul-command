import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { COUNTRY_REGISTRY, lookupCountry } from '@/lib/config/country-registry';
import { getLocalTerm } from '@/lib/seo/escort-terminology';
import { getCountryHreflangTags } from '@/lib/seo/hreflang';

// ═══════════════════════════════════════════════════════════════
// /[country]/coming-soon — Waitlist capture for dormant markets
//
// PURPOSE:
//   66 dormant markets (Slate + Copper) now have SEO footprint.
//   This page captures demand _before_ the market launches.
//
//   Signals collected:
//     • Email address → stored in hc_country_waitlist (or Supabase edge fn)
//     • Role (operator / broker / shipper / other)
//     • Implied demand signal → feeds the readiness scoring engine
//
// SEO:
//   Targets: "[country] pilot car directory", "[local term] [country]"
//   These rank because we have no local competition yet.
//   Traffic here = pre-launch lead list + Google awareness.
//
// MARKET MODE TRIGGER:
//   When waitlist_count > 50 → automatic flag in admin for review
//   When admin approves → country mode upgrades: dormant → seed
// ═══════════════════════════════════════════════════════════════

// Only dormant (slate/copper) countries get this page
const DORMANT_COUNTRIES = COUNTRY_REGISTRY.filter(
  c => c.tier === 'slate' || c.tier === 'copper'
);

export async function generateStaticParams() {
  return DORMANT_COUNTRIES.map(c => ({ country: c.code.toLowerCase() }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const cc = country.toUpperCase();
  const config = lookupCountry(cc);
  if (!config || (config.tier !== 'slate' && config.tier !== 'copper')) {
    return { title: 'Coming Soon' };
  }

  const localTerm = getLocalTerm(cc);
  const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return {
    title: `${cap(localTerm)} Directory — ${config.name} | Coming Soon — Haul Command`,
    description: `The ${config.name} ${localTerm} and oversize load escort directory is coming to Haul Command. Join the waitlist to be first listed when we launch — early operators rank highest.`,
    robots: { index: true, follow: true },
    alternates: {
      canonical: `/${country.toLowerCase()}/coming-soon`,
      languages: getCountryHreflangTags(cc),
    },
    openGraph: {
      title: `${config.name} ${cap(localTerm)} Directory — Coming Soon`,
      description: `Be the first ${localTerm} operator listed in ${config.name}.`,
      type: 'website',
    },
  };
}

function cap(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function ComingSoonPage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const cc = country.toUpperCase();
  const config = lookupCountry(cc);

  if (!config || (config.tier !== 'slate' && config.tier !== 'copper')) notFound();

  const localTerm = getLocalTerm(cc);
  const capTerm = cap(localTerm);

  // Nearby live markets for cross-linking (Gold/Blue same region by topMetros[0] heuristic)
  const liveMarkets = COUNTRY_REGISTRY
    .filter(c => c.tier === 'gold' || c.tier === 'blue')
    .slice(0, 6);

  return (
    <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#F3F4F6', fontFamily: 'Inter, system-ui, sans-serif' }}>
      <div style={{ maxWidth: '48rem', margin: '0 auto', padding: '3rem 1.5rem 5rem' }}>

        {/* Breadcrumb */}
        <nav style={{ marginBottom: '2.5rem', fontSize: '0.8125rem', color: '#6B7280', display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href={`/${country.toLowerCase()}`} style={{ color: '#9CA3AF', textDecoration: 'none' }}>{config.name}</Link>
          <span>›</span>
          <span style={{ color: '#D1D5DB' }}>Coming Soon</span>
        </nav>

        {/* Status pill */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.5rem',
          padding: '0.25rem 0.875rem',
          borderRadius: '9999px',
          background: 'rgba(107,114,128,0.1)',
          border: '1px solid rgba(107,114,128,0.2)',
          fontSize: '0.6875rem',
          fontWeight: 800,
          color: '#9CA3AF',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
          marginBottom: '1.75rem',
        }}>
          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#6B7280', display: 'inline-block' }} />
          Launching in {config.name}
        </div>

        {/* Hero */}
        <h1 style={{
          fontSize: 'clamp(1.875rem, 5vw, 3rem)',
          fontWeight: 900,
          letterSpacing: '-0.035em',
          lineHeight: 1.1,
          marginBottom: '1.25rem',
          color: '#F9FAFB',
        }}>
          {capTerm} directory<br />
          <span style={{ color: '#D4A843' }}>{config.name}</span> — coming soon
        </h1>

        <p style={{ fontSize: '1.125rem', lineHeight: 1.7, color: '#9CA3AF', marginBottom: '2.5rem', maxWidth: '38rem' }}>
          We&apos;re building the {config.name} oversize load escort marketplace. Early operators
          get top placement when we launch — and it&apos;s free to claim your profile.
        </p>

        {/* Waitlist form */}
        <div style={{
          padding: '2rem',
          borderRadius: '1rem',
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.08)',
          marginBottom: '2.5rem',
        }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.5rem' }}>
            Join the {config.name} waitlist
          </h2>
          <p style={{ fontSize: '0.875rem', color: '#6B7280', margin: '0 0 1.5rem' }}>
            Get notified when we launch. First 50 operators get verified badge for free.
          </p>

          {/* Form — submits to /api/waitlist */}
          <form
            action="/api/waitlist"
            method="POST"
            style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
          >
            <input type="hidden" name="countryCode" value={cc} />
            <input type="hidden" name="countryName" value={config.name} />
            <input type="hidden" name="tier" value={config.tier} />

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Email *
                </label>
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@company.com"
                  id={`waitlist-email-${cc.toLowerCase()}`}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F3F4F6',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', display: 'block', marginBottom: '0.375rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  I am a...
                </label>
                <select
                  name="role"
                  id={`waitlist-role-${cc.toLowerCase()}`}
                  style={{
                    width: '100%',
                    padding: '0.625rem 0.875rem',
                    borderRadius: '0.5rem',
                    background: 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#F3F4F6',
                    fontSize: '0.9375rem',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                >
                  <option value="" style={{ background: '#1F2937' }}>Select role</option>
                  <option value="operator" style={{ background: '#1F2937' }}>{capTerm} operator / driver</option>
                  <option value="carrier" style={{ background: '#1F2937' }}>Heavy haul carrier</option>
                  <option value="broker" style={{ background: '#1F2937' }}>Logistics broker / dispatcher</option>
                  <option value="company" style={{ background: '#1F2937' }}>Escort company / fleet</option>
                  <option value="shipper" style={{ background: '#1F2937' }}>Shipper / project owner</option>
                  <option value="other" style={{ background: '#1F2937' }}>Other</option>
                </select>
              </div>
            </div>

            <button
              type="submit"
              id={`waitlist-submit-${cc.toLowerCase()}`}
              style={{
                padding: '0.75rem 2rem',
                borderRadius: '0.625rem',
                background: 'linear-gradient(135deg, #D4A843, #b8892c)',
                color: '#0B0B0C',
                fontWeight: 800,
                fontSize: '0.9375rem',
                border: 'none',
                cursor: 'pointer',
                alignSelf: 'flex-start',
                letterSpacing: '-0.01em',
              }}
            >
              🔔 Notify Me at Launch →
            </button>
          </form>
        </div>

        {/* What early operators get */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '1rem' }}>
            Why join early?
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
            {[
              { icon: '🥇', title: 'Top directory placement', desc: 'Early operators rank highest in search results — permanently.' },
              { icon: '✅', title: 'Free verified badge', desc: 'First 50 operators get the verified badge at no cost.' },
              { icon: '🌍', title: 'Global operator network', desc: 'Connect with brokers and carriers across 120 countries.' },
              { icon: '💰', title: 'Revenue from day one', desc: 'Get dispatched the moment we flip the market live.' },
            ].map((item, i) => (
              <div key={i} style={{
                padding: '1.25rem',
                borderRadius: '0.75rem',
                background: 'rgba(212,168,67,0.03)',
                border: '1px solid rgba(212,168,67,0.08)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
                <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.375rem' }}>{item.title}</h3>
                <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0, lineHeight: 1.5 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Cross-link to live markets */}
        <section style={{ marginBottom: '2.5rem' }}>
          <h2 style={{ fontSize: '1rem', fontWeight: 700, color: '#9CA3AF', marginBottom: '0.875rem' }}>
            While you wait — browse our live markets:
          </h2>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {liveMarkets.map(m => (
              <Link
                key={m.code}
                href={`/${m.code.toLowerCase()}`}
                style={{
                  padding: '0.375rem 0.875rem',
                  borderRadius: '9999px',
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: '#D1D5DB',
                  fontSize: '0.8125rem',
                  fontWeight: 500,
                  textDecoration: 'none',
                }}
              >
                {m.name}
              </Link>
            ))}
            <Link
              href="/directory"
              style={{
                padding: '0.375rem 0.875rem',
                borderRadius: '9999px',
                background: 'rgba(212,168,67,0.08)',
                border: '1px solid rgba(212,168,67,0.2)',
                color: '#D4A843',
                fontSize: '0.8125rem',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              All countries →
            </Link>
          </div>
        </section>

        {/* Structured data — LocalBusiness future intent */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'WebPage',
              name: `${capTerm} Directory — ${config.name} | Coming Soon`,
              url: `https://www.haulcommand.com/${country.toLowerCase()}/coming-soon`,
              description: `Haul Command is launching a ${localTerm} and oversize load escort directory for ${config.name}. Join the waitlist for early operator placement.`,
              breadcrumb: {
                '@type': 'BreadcrumbList',
                itemListElement: [
                  { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
                  { '@type': 'ListItem', position: 2, name: config.name, item: `https://www.haulcommand.com/${country.toLowerCase()}` },
                  { '@type': 'ListItem', position: 3, name: 'Coming Soon', item: `https://www.haulcommand.com/${country.toLowerCase()}/coming-soon` },
                ],
              },
            }),
          }}
        />
      </div>
    </div>
  );
}
