import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { REGULATIONS, getRegulation } from '@/lib/regulations/global-regulations-db';
import { lookupCountry } from '@/lib/config/country-registry';
import MarketModeCTA from '@/components/market/MarketModeCTA';

// ═══════════════════════════════════════════════════════════════
// /near-me/[country] — "pilot car near me" local SEO pages
//
// These pages target high-intent, geo-qualified search queries:
//   "pilot car near me" / "escort vehicle near me" / "load escort near me"
//
// Each country page uses the local terminology from global-regulations-db
// and links to directory, regulations, and tools.
// ═══════════════════════════════════════════════════════════════

export async function generateStaticParams() {
  return REGULATIONS.map(r => ({
    country: r.countryCode.toLowerCase(),
  }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ country: string }>;
}): Promise<Metadata> {
  const { country } = await params;
  const reg = getRegulation(country.toUpperCase());
  if (!reg) return { title: 'Not Found' };

  const term = reg.terminology.primary;
  const cap = term.charAt(0).toUpperCase() + term.slice(1);

  return {
    title: `${cap} Near Me — ${reg.countryName} | Haul Command`,
    description: `Find verified ${term} operators near you in ${reg.countryName}. Instant availability, reviews, GPS-dispatched — the #1 ${term} directory for oversize loads.`,
    keywords: [
      `${term} near me`,
      `${term} near me ${reg.countryName}`,
      `escort vehicle near me`,
      `pilot car near me`,
      `oversize load escort ${reg.countryName}`,
      `${reg.terminology.secondary?.[0] || term} near me`,
      `heavy haul escort ${reg.countryName}`,
    ],
    alternates: {
      canonical: `/near-me/${country.toLowerCase()}`,
    },
    openGraph: {
      title: `${cap} Near Me — ${reg.countryName}`,
      description: `Find verified ${term} operators near you in ${reg.countryName}. GPS-dispatched, insured, certified.`,
      type: 'website',
    },
  };
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default async function NearMePage({
  params,
}: {
  params: Promise<{ country: string }>;
}) {
  const { country } = await params;
  const reg = getRegulation(country.toUpperCase());
  if (!reg) notFound();

  const term = reg.terminology.primary;
  const capTerm = cap(term);
  const countryConfig = lookupCountry(reg.countryCode);

  // Nearby countries for cross-linking
  const nearbyCountries = REGULATIONS
    .filter(r => r.countryCode !== reg.countryCode && r.tier === reg.tier)
    .slice(0, 6);

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Breadcrumb */}
      <nav style={{ marginBottom: '1.5rem', fontSize: '0.8125rem', color: '#6B7280' }}>
        <Link href="/" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Home</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <Link href="/near-me" style={{ color: '#9CA3AF', textDecoration: 'none' }}>Near Me</Link>
        <span style={{ margin: '0 0.5rem' }}>›</span>
        <span style={{ color: '#D1D5DB' }}>{reg.countryName}</span>
      </nav>

      {/* Hero */}
      <section style={{ marginBottom: '3rem' }}>
        <h1
          className="speakable-headline"
          data-speakable="true"
          style={{
            fontSize: 'clamp(1.75rem, 4vw, 2.75rem)',
            fontWeight: 800,
            letterSpacing: '-0.025em',
            lineHeight: 1.15,
            color: '#F9FAFB',
            marginBottom: '1rem',
          }}
        >
          {capTerm} Near Me — {reg.countryName}
        </h1>
        <p
          className="speakable-summary"
          data-speakable="true"
          style={{
            fontSize: '1.125rem',
            lineHeight: 1.7,
            color: '#D1D5DB',
            maxWidth: '42rem',
            marginBottom: '2rem',
          }}
        >
          {reg.voiceAnswer}
        </p>

        {/* Primary CTA */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
          <Link
            href={`/directory?country=${reg.countryCode}`}
            style={{
              padding: '0.875rem 2rem',
              borderRadius: '0.625rem',
              background: 'linear-gradient(135deg, #D4A843, #b8892c)',
              color: '#0B0B0C',
              fontWeight: 700,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            Find {capTerm} Operators →
          </Link>
          <Link
            href={`/regulations/${country.toLowerCase()}`}
            style={{
              padding: '0.875rem 2rem',
              borderRadius: '0.625rem',
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
              color: '#D1D5DB',
              fontWeight: 600,
              fontSize: '1rem',
              textDecoration: 'none',
            }}
          >
            View Regulations
          </Link>
        </div>
      </section>

      {/* Why section */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '1.25rem' }}>
          Why Use Haul Command to Find a {capTerm}?
        </h2>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '1rem',
        }}>
          {[
            { icon: '🔍', title: 'Instant Search', desc: `Search operators by location, certification, and equipment type across ${reg.countryName}` },
            { icon: '✅', title: 'Verified Profiles', desc: 'Every operator is verified with insurance, certifications, and real customer reviews' },
            { icon: '📡', title: 'GPS Dispatch', desc: 'Real-time availability and location tracking for rapid dispatch' },
            { icon: '🛡️', title: 'Insured & Certified', desc: `All operators meet ${reg.countryName} regulatory requirements` },
            { icon: '⭐', title: 'Reviews & Ratings', desc: 'Read reviews from real brokers and heavy haulers' },
            { icon: '💰', title: 'Fair Pricing', desc: 'Transparent market-rate intelligence for every corridor' },
          ].map((item, i) => (
            <div key={i} style={{
              padding: '1.25rem',
              borderRadius: '0.75rem',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}>
              <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>{item.icon}</div>
              <h3 style={{ fontSize: '0.9375rem', fontWeight: 700, color: '#F3F4F6', margin: '0 0 0.375rem' }}>
                {item.title}
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#9CA3AF', margin: 0, lineHeight: 1.5 }}>
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Local Terminology */}
      <section style={{ marginBottom: '3rem' }}>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '1rem' }}>
          Local Terminology in {reg.countryName}
        </h2>
        <div style={{
          padding: '1.5rem',
          borderRadius: '0.75rem',
          background: 'rgba(212,168,67,0.04)',
          border: '1px solid rgba(212,168,67,0.12)',
        }}>
          <p style={{ fontSize: '1rem', fontWeight: 600, color: '#F3F4F6', margin: '0 0 0.5rem' }}>
            Primary: <span style={{ color: '#D4A843' }}>{capTerm}</span>
          </p>
          {reg.terminology.secondary && reg.terminology.secondary.length > 0 && (
            <p style={{ fontSize: '0.875rem', color: '#9CA3AF', margin: '0 0 0.5rem' }}>
              Also known as: {reg.terminology.secondary.map(s => cap(s)).join(', ')}
            </p>
          )}
          <p style={{ fontSize: '0.8125rem', color: '#6B7280', margin: 0 }}>
            Language: {reg.terminology.language}
          </p>
        </div>
      </section>

      {/* Regulations Quick Reference */}
      {reg.escortThresholds.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '1rem' }}>
            When Do You Need a {capTerm}?
          </h2>
          <div style={{
            overflowX: 'auto',
            borderRadius: '0.75rem',
            border: '1px solid rgba(255,255,255,0.06)',
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Condition</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'center', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Escorts Required</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.6875rem', fontWeight: 700, color: '#6B7280', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Type</th>
                </tr>
              </thead>
              <tbody>
                {reg.escortThresholds.slice(0, 5).map((t, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: '#D1D5DB' }}>{t.condition}</td>
                    <td style={{ padding: '0.75rem 1rem', textAlign: 'center', fontWeight: 700, color: '#D4A843' }}>{t.escortsRequired}</td>
                    <td style={{ padding: '0.75rem 1rem', fontSize: '0.8125rem', color: '#9CA3AF', textTransform: 'capitalize' }}>{t.escortType.replace(/_/g, ' ')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: '0.75rem' }}>
            <Link
              href={`/regulations/${country.toLowerCase()}`}
              style={{ fontSize: '0.8125rem', color: '#D4A843', textDecoration: 'none', fontWeight: 600 }}
            >
              View full {reg.countryName} regulations →
            </Link>
          </div>
        </section>
      )}

      {/* Nearby Countries */}
      {nearbyCountries.length > 0 && (
        <section style={{ marginBottom: '3rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#F3F4F6', marginBottom: '1rem' }}>
            Also Search Nearby Countries
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '0.75rem',
          }}>
            {nearbyCountries.map(nr => (
              <Link
                key={nr.countryCode}
                href={`/near-me/${nr.countryCode.toLowerCase()}`}
                style={{
                  display: 'block',
                  padding: '1rem 1.25rem',
                  borderRadius: '0.75rem',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{ fontSize: '0.9375rem', fontWeight: 600, color: '#F3F4F6', marginBottom: '0.25rem' }}>
                  {nr.countryName}
                </div>
                <div style={{ fontSize: '0.75rem', color: '#6B7280' }}>
                  {cap(nr.terminology.primary)} near me
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Bottom CTA — Market-mode aware */}
      <MarketModeCTA
        countryCode={reg.countryCode}
        countryName={reg.countryName}
        localTerm={term}
      />

      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'WebPage',
            name: `${capTerm} Near Me — ${reg.countryName}`,
            url: `https://www.haulcommand.com/near-me/${country.toLowerCase()}`,
            description: `Find verified ${term} operators near you in ${reg.countryName}.`,
            speakable: {
              '@type': 'SpeakableSpecification',
              cssSelector: ['.speakable-headline', '.speakable-summary'],
            },
            mainEntity: {
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: `How do I find a ${term} near me in ${reg.countryName}?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: `Use Haul Command's directory to search for verified ${term} operators in ${reg.countryName}. Filter by location, certification, equipment, and availability.`,
                  },
                },
                {
                  '@type': 'Question',
                  name: `Do I need a ${term} for oversize loads in ${reg.countryName}?`,
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: reg.voiceAnswer,
                  },
                },
              ],
            },
          }),
        }}
      />
    </div>
  );
}
