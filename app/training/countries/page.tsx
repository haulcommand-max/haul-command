import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Pilot Car Training by Country — 50+ Countries | Haul Command',
  description: 'Find pilot car and escort operator training for your country. State-aware, globally-ready certification pathways in 50+ countries including USA, Canada, Australia, UK, UAE, and more.',
  alternates: { canonical: 'https://www.haulcommand.com/training/countries' },
};

const COUNTRIES = [
  { name: 'United States', slug: 'united-states', region: 'Americas' },
  { name: 'Canada', slug: 'canada', region: 'Americas' },
  { name: 'Mexico', slug: 'mexico', region: 'Americas' },
  { name: 'Brazil', slug: 'brazil', region: 'Americas' },
  { name: 'Australia', slug: 'australia', region: 'Asia-Pacific' },
  { name: 'New Zealand', slug: 'new-zealand', region: 'Asia-Pacific' },
  { name: 'United Kingdom', slug: 'united-kingdom', region: 'Europe' },
  { name: 'Germany', slug: 'germany', region: 'Europe' },
  { name: 'Netherlands', slug: 'netherlands', region: 'Europe' },
  { name: 'France', slug: 'france', region: 'Europe' },
  { name: 'Belgium', slug: 'belgium', region: 'Europe' },
  { name: 'Sweden', slug: 'sweden', region: 'Europe' },
  { name: 'Norway', slug: 'norway', region: 'Europe' },
  { name: 'UAE', slug: 'uae', region: 'Middle East' },
  { name: 'Saudi Arabia', slug: 'saudi-arabia', region: 'Middle East' },
  { name: 'Qatar', slug: 'qatar', region: 'Middle East' },
  { name: 'South Africa', slug: 'south-africa', region: 'Africa' },
  { name: 'India', slug: 'india', region: 'Asia-Pacific' },
  { name: 'Singapore', slug: 'singapore', region: 'Asia-Pacific' },
  { name: 'Thailand', slug: 'thailand', region: 'Asia-Pacific' },
];

const gold = '#D4A844';

const REGIONS = ['Americas', 'Europe', 'Asia-Pacific', 'Middle East', 'Africa'];

export default function CountriesIndexPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
      { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
      { '@type': 'ListItem', position: 3, name: 'All Countries', item: 'https://www.haulcommand.com/training/countries' },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div style={{ minHeight: '100vh', background: '#07090d', color: '#e8e8e8' }}>
        <nav aria-label="Breadcrumb" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
            <span>"º</span>
            <Link href="/training" style={{ color: '#6b7280', textDecoration: 'none' }}>Training</Link>
            <span>"º</span>
            <span style={{ color: gold }}>All Countries</span>
          </div>
        </nav>

        <section style={{ padding: 'clamp(2rem,5vw,4rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#f9fafb' }}>
              Pilot Car Training by Country
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: 15, color: '#9ca3af', lineHeight: 1.7, maxWidth: 620 }}>
              Haul Command Training is available in 50+ countries. Each country page includes localized requirements,
              terminology, compliance notes, and relevant resources for operators in that market.
            </p>
            <Link href="/training/the-escort-driver-regulatory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
              ðŸŽ“ Start Training — Free
            </Link>
          </div>
        </section>

        {REGIONS.map(region => {
          const regionCountries = COUNTRIES.filter(c => c.region === region);
          if (!regionCountries.length) return null;
          return (
            <section key={region} style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
              <div style={{ maxWidth: 1100, margin: '0 auto' }}>
                <h2 style={{ margin: '0 0 14px', fontSize: 16, fontWeight: 800, color: '#d1d5db' }}>{region}</h2>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {regionCountries.map(c => (
                    <Link key={c.slug} href={`/training/region/${c.slug}`}
                      style={{ padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.2)', color: gold, textDecoration: 'none' }}>
                      {c.name}
                    </Link>
                  ))}
                </div>
              </div>
            </section>
          );
        })}

        <section style={{ padding: 'clamp(1.5rem,2.5vw,2rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['All Training Modules', '/training'],
              ['Escort Requirements', '/escort-requirements'],
              ['Find Operators', '/directory'],
              ['Verify a Badge', '/training/verify'],
            ].map(([label, href]) => (
              <Link key={href} href={href} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af', textDecoration: 'none' }}>
                {label}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}