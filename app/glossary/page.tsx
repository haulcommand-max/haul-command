import type { Metadata } from 'next';
import Link from 'next/link';
import RelatedLinks from '@/components/seo/RelatedLinks';

export const revalidate = 86400;

export const metadata: Metadata = {
  title: 'Heavy Haul Glossary — Oversize Load Terms & Definitions | Haul Command',
  description:
    'The complete glossary of heavy haul, oversize load, and pilot car terminology. Definitions for pilot car, superload, oversize permit, escort vehicle, and 100+ heavy transport terms.',
  keywords: [
    'heavy haul glossary', 'oversize load terms', 'pilot car definition',
    'superload definition', 'oversize permit glossary', 'escort vehicle definition',
    'heavy haul terminology', 'wide load terms', 'overweight permit definition',
  ],
  alternates: { canonical: 'https://haulcommand.com/glossary' },
  openGraph: {
    title: 'Heavy Haul Glossary | Haul Command',
    description: 'Definitions for pilot car, superload, escort vehicle, oversize permit, and 100+ heavy transport terms.',
    url: 'https://haulcommand.com/glossary',
  },
};

const GLOSSARY_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Heavy Haul Glossary | Haul Command',
      url: 'https://haulcommand.com/glossary',
      description: 'The complete reference for heavy haul, oversize load, and pilot car terminology.',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Glossary', item: 'https://haulcommand.com/glossary' },
        ],
      },
    },
    {
      '@type': 'DefinedTermSet',
      name: 'Heavy Haul Transport Glossary',
      url: 'https://haulcommand.com/glossary',
      description: 'Authoritative definitions for heavy haul logistics, oversize load permits, and escort vehicle operations.',
    },
  ],
};

const TERMS = [
  { slug: 'pilot-car', term: 'Pilot Car', short: 'A vehicle that accompanies an oversize or overweight load to warn motorists and guide the transport safely through each jurisdiction.' },
  { slug: 'oversize-load', term: 'Oversize Load', short: 'Any load that exceeds the legal width, height, length, or weight limits for public roads without special permits.' },
  { slug: 'superload', term: 'Superload', short: 'An extremely heavy or large load that requires special engineering analysis, police escort, and multi-agency permitting.' },
  { slug: 'escort-vehicle', term: 'Escort Vehicle', short: 'A vehicle that accompanies an oversize load to provide warning and safety — also called a pilot car or chase car.' },
  { slug: 'oversize-permit', term: 'Oversize Permit', short: 'A state-issued authorization allowing a vehicle or load to exceed standard width, height, length, or weight limits on public roads.' },
  { slug: 'height-pole', term: 'Height Pole', short: 'A measuring device mounted on the lead pilot car that detects overhead obstructions before the oversize load passes beneath them.' },
  { slug: 'chase-car', term: 'Chase Car', short: 'A rear escort vehicle that follows behind an oversize load to warn approaching traffic and assist with lane management.' },
  { slug: 'pevo', term: 'PEVO Certification', short: 'Pilot/Escort Vehicle Operator certification — a nationally recognized credential verifying knowledge of escort procedures and state regulations.' },
  { slug: 'overweight-permit', term: 'Overweight Permit', short: 'Authorization to operate a vehicle exceeding the standard gross vehicle weight limit (typically 80,000 lbs on US interstates).' },
  { slug: 'gross-vehicle-weight', term: 'Gross Vehicle Weight (GVW)', short: 'The total weight of a vehicle including its load, fuel, driver, and all equipment.' },
  { slug: 'bridge-formula', term: 'Bridge Formula', short: 'A federal formula that limits the weight placed on any single axle or group of axles to prevent bridge damage.' },
  { slug: 'route-survey', term: 'Route Survey', short: 'A pre-move inspection of the planned transport route to identify obstructions, weight limits, clearance issues, and permit requirements.' },
  { slug: 'divisible-load', term: 'Divisible Load', short: 'A load that can be broken into smaller pieces without damage. Divisible loads are generally not eligible for oversize permits.' },
  { slug: 'non-divisible-load', term: 'Non-Divisible Load', short: 'A load that cannot be reduced in size without destroying its integrity — the primary basis for oversize permit eligibility.' },
  { slug: 'single-trip-permit', term: 'Single Trip Permit', short: 'An oversize or overweight permit authorizing one specific move along a defined route within a set time window.' },
  { slug: 'annual-permit', term: 'Annual Permit', short: 'A blanket permit allowing repeated oversize or overweight movements throughout a state for one year without per-trip applications.' },
  { slug: 'corridor', term: 'Corridor', short: 'A defined heavy haul transport route between two points, characterized by specific permit, escort, and infrastructure requirements.' },
  { slug: 'lowboy', term: 'Lowboy', short: 'A trailer with an extremely low deck height designed to transport tall equipment such as cranes, bulldozers, and construction machinery.' },
  { slug: 'flatbed', term: 'Flatbed', short: 'An open-deck trailer without sides or a roof, used to transport oversized cargo that cannot fit in a standard enclosed trailer.' },
  { slug: 'rgn', term: 'RGN (Removable Gooseneck)', short: 'A trailer type with a detachable front that lowers to the ground, allowing heavy equipment to drive directly onto the trailer.' },
];

const ALPHA = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

export default function GlossaryPage() {
  const byLetter: Record<string, typeof TERMS> = {};
  for (const t of TERMS) {
    const l = t.term[0].toUpperCase();
    if (!byLetter[l]) byLetter[l] = [];
    byLetter[l].push(t);
  }
  const letters = ALPHA.filter(l => byLetter[l]);
  const gold = '#D4A844';

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(GLOSSARY_SCHEMA) }} />

      <main style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb' }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <span style={{ color: gold }}>Glossary</span>
        </nav>

        {/* Hero */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 20px 2rem', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 16 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>{TERMS.length}+ Terms Defined</span>
          </div>
          <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem,5vw,3rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.03em', color: '#f9fafb' }}>
            Heavy Haul <span style={{ color: gold }}>Glossary</span>
          </h1>
          <p style={{ margin: '0 0 24px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 600 }}>
            The authoritative reference for heavy haul transport, oversize load permitting, and pilot car operations around the world.
          </p>

          {/* Quick alphabet nav */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {letters.map(l => (
              <a key={l} href={`#${l}`} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 13, fontWeight: 700, background: 'rgba(212,168,68,0.08)', border: '1px solid rgba(212,168,68,0.2)', color: gold, textDecoration: 'none' }}>{l}</a>
            ))}
          </div>
        </section>

        {/* Tool CTA strip */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '1.5rem 20px' }}>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/tools/escort-calculator" style={{ padding: '10px 20px', borderRadius: 10, background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', color: gold, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>Escort Calculator</Link>
            <Link href="/tools/permit-checker" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Permit Checker</Link>
            <Link href="/escort-requirements" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>State Requirements</Link>
            <Link href="/directory" style={{ padding: '10px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>Find Operators</Link>
          </div>
        </section>

        {/* Terms by letter */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 3rem' }}>
          {letters.map(letter => (
            <div key={letter} id={letter} style={{ marginBottom: '2.5rem' }}>
              <div style={{ fontSize: 28, fontWeight: 900, color: gold, borderBottom: '1px solid rgba(212,168,68,0.15)', paddingBottom: 8, marginBottom: 16 }}>{letter}</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 12 }}>
                {byLetter[letter].map(t => (
                  <Link key={t.slug} href={`/glossary/${t.slug}`} style={{ display: 'block', padding: '16px 18px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none', transition: 'border-color 0.15s' }}>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', marginBottom: 6 }}>{t.term}</div>
                    <div style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>{t.short}</div>
                    <div style={{ fontSize: 11, color: gold, fontWeight: 700, marginTop: 10 }}>Read full definition</div>
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </section>

        {/* SEO Internal Links — glossary flows equity to tools, escort-requirements, directory, corridors */}
        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 4rem' }}>
          <RelatedLinks
            pageType="glossary"
            heading="Related heavy haul tools and resources"
          />
        </div>

      </main>
    </>
  );
}
