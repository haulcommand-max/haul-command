import type { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ country: string }>;
}

const COUNTRY_META: Record<string, { name: string; terminology: string[]; notes: string }> = {
  'united-states': { name: 'United States', terminology: ['pilot car', 'escort vehicle', 'PEVO', 'overdimensional'], notes: '12 states require mandatory pilot car certification. HC Certified meets or exceeds all state curriculum requirements.' },
  'canada': { name: 'Canada', terminology: ['pilot car', 'escort vehicle', 'EVO', 'oversize'], notes: 'Requirements vary by province. Alberta and BC have the highest activity. HC Certified accepted as a training baseline for broker trust.' },
  'australia': { name: 'Australia', terminology: ['pilot vehicle', 'escort vehicle', 'over-dimensional', 'NHVR'], notes: 'NHVR governs heavy vehicle permits nationally. State-level escort requirements vary. HC Certified aligns with best practice guidelines.' },
  'united-kingdom': { name: 'United Kingdom', terminology: ['attendant vehicle', 'wide load escort', 'abnormal load'], notes: 'STGO categories govern abnormal load movements. HC Certified provides operational baseline aligned with DfT guidance.' },
  'uae': { name: 'UAE', terminology: ['escort vehicle', 'oversized transport', 'special transport permit'], notes: 'Permit requirements governed by RTA and individual emirate authorities. HC Certified recognized as international operator baseline.' },
};

const US_STATES = [
  { name: 'Texas', slug: 'texas' }, { name: 'California', slug: 'california' },
  { name: 'Florida', slug: 'florida' }, { name: 'Washington', slug: 'washington' },
  { name: 'Arizona', slug: 'arizona' }, { name: 'Colorado', slug: 'colorado' },
  { name: 'Georgia', slug: 'georgia' }, { name: 'Ohio', slug: 'ohio' },
  { name: 'Louisiana', slug: 'louisiana' }, { name: 'Oregon', slug: 'oregon' },
  { name: 'North Carolina', slug: 'north-carolina' }, { name: 'Pennsylvania', slug: 'pennsylvania' },
  { name: 'Tennessee', slug: 'tennessee' }, { name: 'Michigan', slug: 'michigan' },
  { name: 'Illinois', slug: 'illinois' },
];

const gold = '#D4A844';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { country } = await params;
  const meta = COUNTRY_META[country];
  const name = meta?.name ?? country.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  return {
    title: `Pilot Car & Escort Operator Training in ${name} | Haul Command`,
    description: `Heavy haul pilot car and escort operator certification for ${name}. State-aware, locally relevant training with digital badge verification. HC Certified, AV-Ready, and Elite pathways.`,
    alternates: { canonical: `https://www.haulcommand.com/training/region/${country}` },
  };
}

export default async function CountryTrainingPage({ params }: Props) {
  const { country } = await params;
  const meta = COUNTRY_META[country];
  const countryName = meta?.name ?? country.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  const isUS = country === 'united-states';

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Pilot Car Training in ${countryName} — Haul Command`,
    url: `https://www.haulcommand.com/training/region/${country}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
        { '@type': 'ListItem', position: 3, name: countryName, item: `https://www.haulcommand.com/training/region/${country}` },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div style={{ minHeight: '100vh', background: '#07090d', color: '#e8e8e8' }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/training" style={{ color: '#6b7280', textDecoration: 'none' }}>Training</Link>
            <span>›</span>
            <span style={{ color: gold }}>{countryName}</span>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2rem,5vw,4rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 14 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Training · {countryName}</span>
            </div>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,4vw,2.8rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.1 }}>
              Pilot Car &amp; Escort Operator Training<br />
              <span style={{ color: gold }}>in {countryName}</span>
            </h1>
            {meta?.notes && (
              <p style={{ margin: '0 0 20px', fontSize: 15, color: '#9ca3af', lineHeight: 1.7, maxWidth: 640 }}>{meta.notes}</p>
            )}
            {meta?.terminology && (
              <p style={{ margin: '0 0 24px', fontSize: 13, color: '#6b7280' }}>
                Common terms in {countryName}: {meta.terminology.join(', ')}
              </p>
            )}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/training/pilot-car-fundamentals" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                🎓 Start Free Training
              </Link>
              <Link href="/escort-requirements" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                📋 {countryName} Requirements
              </Link>
            </div>
          </div>
        </section>

        {/* US states drill-down */}
        {isUS && (
          <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ maxWidth: 1100, margin: '0 auto' }}>
              <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Training by US State</h2>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {US_STATES.map(st => (
                  <Link key={st.slug} href={`/training/region/united-states/${st.slug}`}
                    style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600, background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.2)', color: gold, textDecoration: 'none' }}>
                    {st.name}
                  </Link>
                ))}
                <Link href="/escort-requirements" style={{ padding: '7px 14px', borderRadius: 999, fontSize: 13, fontWeight: 700, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af', textDecoration: 'none' }}>All 50 States →</Link>
              </div>
            </div>
          </section>
        )}

        {/* Modules for this country */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Training Modules</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                { slug: 'pilot-car-fundamentals', title: 'Pilot Car Fundamentals', desc: 'Safety, roles, equipment — the global baseline' },
                { slug: 'route-survey-clearance-intelligence', title: 'Route Survey & Clearance Intelligence', desc: 'Heights, widths, obstacles, and hazard documentation' },
                { slug: 'state-jurisdiction-compliance', title: 'State & Jurisdiction Compliance', desc: 'Permit rules, signage, escort formation requirements' },
                { slug: 'communication-convoy-control', title: 'Communication, Convoy Control & Incident Response', desc: 'Radio discipline, emergencies, multi-vehicle coordination' },
                { slug: 'specialized-vertical-operations', title: 'Specialized Vertical Operations', desc: 'Wind, superload, oilfield, port, military, aerospace' },
              ].map(m => (
                <Link key={m.slug} href={`/training/${m.slug}`} style={{ display: 'flex', gap: 12, alignItems: 'center', padding: '14px 16px', borderRadius: 10, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textDecoration: 'none' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 700, color: '#e5e7eb', marginBottom: 2 }}>{m.title}</div>
                    <div style={{ fontSize: 11, color: '#6b7280' }}>{m.desc}</div>
                  </div>
                  <span style={{ color: gold }}>→</span>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Global Regulatory Resources */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Global Regulatory Resources & Search</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>Access up-to-date compliance requirements and standardized best practices for {countryName}.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 10 }}>
              
              <a href={`https://www.google.com/search?q=${countryName}+oversize+overweight+permit+pilot+car+escort+requirements`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{countryName} Transport Ministry Rules ↗</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>Search the official transport/highway ministry portal in {countryName} for current oversize load and pilot car mandate guidelines.</div>
              </a>
              
              <a href="https://www.scranet.org/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>SC&RA Best Practices (Global) ↗</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>Specialized Carriers & Rigging Association global operating standards & guidelines.</div>
              </a>

              <a href="https://www.iru.org/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>IRU Transport Guidelines ↗</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>International Road Transport Union standards for commercial transport and road safety.</div>
              </a>

            </div>
          </div>
        </section>

        {/* Related links */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <p style={{ margin: '0 0 12px', fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.3)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Related</p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {[
                ['All Training Modules', '/training'],
                ['Escort Requirements', '/escort-requirements'],
                ['Heavy Haul Glossary', '/glossary'],
                ['Find Operators', '/directory'],
                ['Verify a Badge', '/training/verify'],
                ['Corporate Training', '/training/corporate'],
                ['All Countries', '/training/countries'],
              ].map(([label, href]) => (
                <Link key={href} href={href} style={{ padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: '#9ca3af', textDecoration: 'none' }}>
                  {label}
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
