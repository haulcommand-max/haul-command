import type { Metadata } from 'next';
import Link from 'next/link';

interface Props {
  params: Promise<{ country: string; state: string }>;
}

const MANDATORY_CERT_STATES = ['washington', 'arizona', 'colorado', 'florida', 'georgia', 'louisiana', 'north-carolina', 'oregon', 'south-carolina', 'tennessee', 'texas', 'virginia'];

const gold = '#D4A844';

function toTitle(slug: string) {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
}

const STATE_RESOURCES: Record<string, { title: string; desc: string; url: string }[]> = {
  'florida': [
    {
      title: 'UF T2 Pilot Escort Flagging Database',
      desc: 'Official database of qualified Florida pilot/escort course graduates.',
      url: 'https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/find-a-qualified-florida-escort/'
    },
    {
      title: 'Florida T2 Escort Certification Course',
      desc: 'FDOT approved 8-hour in-person pilot escort flagging course at the University of Florida.',
      url: 'https://reg.pwd.aa.ufl.edu/search/publicCourseSearchDetails.do?method=load&courseId=12806312&selectedProgramAreaId=2616680'
    },
    {
      title: 'Florida 2025 PE Participant Workbook',
      desc: 'Official PDF workbook for Florida Pilot Escort Flagging requirements.',
      url: 'https://www.eng.ufl.edu/techtransfer/wp-content/uploads/sites/251/2025/11/PE-Participant-Workbook-04-01-2025.pdf'
    }
  ]
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { state, country } = await params;
  const stateName = toTitle(state);
  const countryName = toTitle(country);
  const mandatory = country === 'united-states' && MANDATORY_CERT_STATES.includes(state);
  return {
    title: `Pilot Car Training in ${stateName} — ${mandatory ? 'Mandatory Certification' : 'HC Certified'} | Haul Command`,
    description: `Pilot car and escort operator training for ${stateName}, ${countryName}. ${mandatory ? `${stateName} requires mandatory pilot car certification — HC Certified meets all state requirements.` : `HC Certified covers all escort requirements in ${stateName} and is accepted as an operator trust standard by brokers.`}`,
    alternates: { canonical: `https://www.haulcommand.com/training/region/${country}/${state}` },
  };
}

export default async function StateTrainingPage({ params }: Props) {
  const { state, country } = await params;
  const stateName = toTitle(state);
  const countryName = toTitle(country);
  const mandatory = country === 'united-states' && MANDATORY_CERT_STATES.includes(state);

  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: `Pilot Car Training in ${stateName} | Haul Command`,
    url: `https://www.haulcommand.com/training/region/${country}/${state}`,
    breadcrumb: {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Training', item: 'https://www.haulcommand.com/training' },
        { '@type': 'ListItem', position: 3, name: countryName, item: `https://www.haulcommand.com/training/region/${country}` },
        { '@type': 'ListItem', position: 4, name: stateName, item: `https://www.haulcommand.com/training/region/${country}/${state}` },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <div style={{ minHeight: '100vh', background: '#07090d', color: '#e8e8e8' }}>
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', padding: '12px 0' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px', display: 'flex', gap: 6, fontSize: 11, color: '#6b7280', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em', flexWrap: 'wrap' }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
            <span>›</span>
            <Link href="/training" style={{ color: '#6b7280', textDecoration: 'none' }}>Training</Link>
            <span>›</span>
            <Link href={`/training/region/${country}`} style={{ color: '#6b7280', textDecoration: 'none' }}>{countryName}</Link>
            <span>›</span>
            <span style={{ color: gold }}>{stateName}</span>
          </div>
        </nav>

        {/* Hero */}
        <section style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', padding: 'clamp(2rem,5vw,3.5rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            {mandatory && (
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 20, marginBottom: 14 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: '#f87171', textTransform: 'uppercase', letterSpacing: '0.1em' }}>⚠ Mandatory Certification State</span>
              </div>
            )}
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(1.8rem,4vw,2.6rem)', fontWeight: 900, color: '#f9fafb', lineHeight: 1.1 }}>
              Pilot Car Training in {stateName}
            </h1>
            <p style={{ margin: '0 0 16px', fontSize: 15, color: '#9ca3af', lineHeight: 1.7, maxWidth: 640 }}>
              {mandatory
                ? `${stateName} is one of 12 US states that require mandatory pilot car certification. HC Certified meets or exceeds ${stateName} curriculum requirements and is accepted as an operator qualification baseline by brokers and carriers operating in this state.`
                : `HC Certified provides the foundational knowledge for operating as a pilot car escort in ${stateName}. It is accepted by brokers and carriers as an operator trust and qualification standard.`
              }
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/training/pilot-car-fundamentals" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>
                🎓 Start {stateName} Training
              </Link>
              <Link href="/escort-requirements" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#9ca3af', fontSize: 13, fontWeight: 700, textDecoration: 'none' }}>
                📋 {stateName} Escort Rules
              </Link>
            </div>
          </div>
        </section>

        {/* State FAQ */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>{stateName} Pilot Car Training FAQ</h2>
            {[
              {
                q: `Does ${stateName} require pilot car certification?`,
                a: mandatory
                  ? `Yes. ${stateName} is one of 12 US states with mandatory pilot car certification requirements. HC Certified meets or exceeds the ${stateName} state curriculum requirements.`
                  : `${stateName} does not currently have a mandatory certification requirement, but many brokers and carriers require or strongly prefer HC Certified operators. It also qualifies you for cross-state moves into mandatory states.`,
              },
              {
                q: `Does HC Certified work for ${stateName} operations?`,
                a: `Yes. HC Certified is built on FMCSA and SC&RA Best Practices Guidelines, which meet or exceed the requirements for all mandatory certification states including ${stateName}. Brokers across ${stateName} use Haul Command to verify operator certification status.`,
              },
              {
                q: `How do I find pilot car jobs in ${stateName}?`,
                a: `Claim your free Haul Command listing and get HC Certified. Brokers searching for escort capacity in ${stateName} can find and verify your profile instantly.`,
              },
            ].map((item, i) => (
              <details key={i} style={{ marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                <summary style={{ padding: '14px 16px', cursor: 'pointer', fontWeight: 700, fontSize: 14, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8, color: '#e5e7eb' }}>
                  <span style={{ color: gold }}>+</span>{item.q}
                </summary>
                <p style={{ padding: '0 16px 14px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.7, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* State Specific Resources */}
        <section style={{ padding: 'clamp(1.5rem,3vw,2.5rem) 20px', borderBottom: '1px solid rgba(255,255,255,0.05)', background: 'rgba(255,255,255,0.01)' }}>
          <div style={{ maxWidth: 820, margin: '0 auto' }}>
            <h2 style={{ margin: '0 0 14px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>Official Regulatory Resources</h2>
            <p style={{ margin: '0 0 16px', fontSize: 13, color: '#9ca3af', lineHeight: 1.6 }}>Access up-to-date compliance requirements and standardized best practices for {stateName}.</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr)', gap: 10 }}>
              {/* Custom Injected Resources */
              STATE_RESOURCES[state]?.map(res => (
                <a key={res.url} href={res.url} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(212,168,68,0.3)', borderRadius: 12, textDecoration: 'none' }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: gold, marginBottom: 4 }}>{res.title} ↗</div>
                  <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>{res.desc}</div>
                </a>
              ))}
              
              {/* Deterministic Search & National Links */}
              <a href={`https://www.google.com/search?q=${stateName}+Department+of+Transportation+oversize+overweight+permit+pilot+car+requirements`} target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>{stateName} DOT OS/OW Permit Rules ↗</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>Search the official {stateName} Department of Transportation portal for current oversize load and pilot car mandate guidelines.</div>
              </a>
              
              <a href="https://mutcd.fhwa.dot.gov/pdfs/2009r1r2/mutcd2009r1r2edition.pdf" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>FHWA MUTCD Documentation ↗</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>Federal Highway Administration Manual on Uniform Traffic Control Devices (National Standard).</div>
              </a>
              
              <a href="https://www.scranet.org/" target="_blank" rel="noopener noreferrer" style={{ display: 'block', padding: '16px', background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 12, textDecoration: 'none' }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#e5e7eb', marginBottom: 4 }}>SC&RA Best Practices ↗</div>
                <div style={{ fontSize: 12, color: '#9ca3af', lineHeight: 1.5 }}>Specialized Carriers & Rigging Association global operating standards & guidelines.</div>
              </a>
            </div>
          </div>
        </section>

        {/* Related links */}
        <section style={{ padding: 'clamp(1.5rem,2.5vw,2rem) 20px' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto', display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {[
              ['All Training Modules', '/training'],
              [`${countryName} Training`, `/training/region/${country}`],
              ['Escort Requirements', '/escort-requirements'],
              ['Find Operators', `/find/pilot-car-operator/${state}`],
              ['Heavy Haul Glossary', '/glossary'],
              ['Verify a Badge', '/training/verify'],
              ['Claim Your Listing', '/claim'],
              ['Rate Index', '/rates'],
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
