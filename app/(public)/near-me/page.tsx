import type { Metadata } from 'next';
import Link from 'next/link';
import { REGULATIONS } from '@/lib/regulations/global-regulations-db';

export const metadata: Metadata = {
  title: 'Pilot Car & Escort Vehicle Near Me — 120 Countries | Haul Command',
  description: 'Find verified pilot car operators and escort vehicles near you across 120 countries. Search by location, certifications, equipment, and real-time availability.',
  keywords: [
    'pilot car near me',
    'escort vehicle near me',
    'oversize load escort near me',
    'wide load escort near me',
    'heavy haul escort near me',
    'pilot car services near me',
  ],
  alternates: { canonical: '/near-me' },
};

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// Group by tier
function groupByTier() {
  const groups: Record<string, typeof REGULATIONS> = { A: [], B: [], C: [], D: [], E: [] };
  for (const reg of REGULATIONS) {
    const tier = reg.tier || 'E';
    if (!groups[tier]) groups[tier] = [];
    groups[tier].push(reg);
  }
  return groups;
}

const TIER_LABELS: Record<string, string> = {
  A: 'Top Markets',
  B: 'Major Markets',
  C: 'Growing Markets',
  D: 'Emerging Markets',
  E: 'New Markets',
};

export default function NearMeIndex() {
  const groups = groupByTier();

  return (
    <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '2rem 1.5rem 4rem' }}>
      {/* Hero */}
      <header style={{ marginBottom: '3rem', textAlign: 'center' }}>
        <h1
          className="speakable-headline"
          data-speakable="true"
          style={{
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 800,
            letterSpacing: '-0.03em',
            color: '#F9FAFB',
            marginBottom: '1rem',
          }}
        >
          Find Escort Vehicles <span style={{ color: '#D4A843' }}>Near You</span>
        </h1>
        <p
          className="speakable-summary"
          data-speakable="true"
          style={{
            fontSize: '1.125rem',
            color: '#9CA3AF',
            maxWidth: '36rem',
            margin: '0 auto 2rem',
            lineHeight: 1.65,
          }}
        >
          Search verified pilot car operators across 120 countries. GPS-dispatched, insured, certified — the world&apos;s largest oversize load escort directory.
        </p>
        <Link
          href="/directory"
          style={{
            padding: '0.875rem 2.5rem',
            borderRadius: '0.625rem',
            background: 'linear-gradient(135deg, #D4A843, #b8892c)',
            color: '#0B0B0C',
            fontWeight: 700,
            fontSize: '1rem',
            textDecoration: 'none',
            display: 'inline-block',
          }}
        >
          Search All Operators →
        </Link>
      </header>

      {/* Country Grid by Tier */}
      {Object.entries(groups).map(([tier, countries]) => {
        if (countries.length === 0) return null;
        return (
          <section key={tier} style={{ marginBottom: '2.5rem' }}>
            <h2 style={{
              fontSize: '0.6875rem',
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: '0.15em',
              color: '#6B7280',
              marginBottom: '1rem',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              paddingBottom: '0.5rem',
            }}>
              {TIER_LABELS[tier] || `Tier ${tier}`} — {countries.length} Countries
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '0.75rem',
            }}>
              {countries.map(reg => (
                <Link
                  key={reg.countryCode}
                  href={`/near-me/${reg.countryCode.toLowerCase()}`}
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
                    {reg.countryName}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: '#D4A843', fontWeight: 500 }}>
                    {cap(reg.terminology.primary)} near me →
                  </div>
                </Link>
              ))}
            </div>
          </section>
        );
      })}

      {/* Structured Data — BreadcrumbList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BreadcrumbList',
            itemListElement: [
              { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
              { '@type': 'ListItem', position: 2, name: 'Near Me', item: 'https://www.haulcommand.com/near-me' },
            ],
          }),
        }}
      />
    </div>
  );
}
