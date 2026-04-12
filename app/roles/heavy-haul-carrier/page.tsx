import type { Metadata } from 'next';
import Link from 'next/link';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'Heavy Haul Carriers â€” Find Flatbed, Lowboy & Oversize Operators | Haul Command',
  description:
    'Connect with verified heavy haul carriers, flatbed operators, and lowboy specialists across the US and 120 countries. Find equipment for your oversize move, post loads, and manage permits in one platform.',
  keywords: [
    'heavy haul carrier', 'oversize load carrier', 'flatbed carrier near me',
    'lowboy transport', 'heavy haul trucking company', 'wide load carrier',
    'oversize freight carrier', 'superload carrier', 'find heavy haul truck',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/roles/heavy-haul-carrier' },
  openGraph: {
    title: 'Heavy Haul Carriers | Haul Command',
    description: 'Find certified heavy haul carriers, flatbed operators, and lowboy specialists for your oversize move.',
    url: 'https://www.haulcommand.com/roles/heavy-haul-carrier',
    siteName: 'Haul Command',
    type: 'website',
  },
};

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Heavy Haul Carriers | Haul Command',
      url: 'https://www.haulcommand.com/roles/heavy-haul-carrier',
      description: 'Directory and resource hub for heavy haul carriers and flatbed operators in the oversize transport industry.',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://www.haulcommand.com/directory' },
          { '@type': 'ListItem', position: 3, name: 'Heavy Haul Carriers', item: 'https://www.haulcommand.com/roles/heavy-haul-carrier' },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What is a heavy haul carrier?', acceptedAnswer: { '@type': 'Answer', text: 'A heavy haul carrier is a trucking company or operator specializing in transporting oversize, overweight, or out-of-gauge loads that exceed standard legal limits. They use specialized equipment like lowboy trailers, flatbeds, and multi-axle platforms and must comply with state and federal permit requirements.' } },
        { '@type': 'Question', name: 'What equipment do heavy haul carriers use?', acceptedAnswer: { '@type': 'Answer', text: 'Heavy haul carriers use specialized trailers including flatbeds, step-decks, RGNs (removable gooseneck lowboys), multi-axle lowboys, modular trailers (SPMTs), and dolly combinations. Equipment selection depends on load dimensions, weight, and route requirements.' } },
        { '@type': 'Question', name: 'How do I find a heavy haul carrier near me?', acceptedAnswer: { '@type': 'Answer', text: 'Use the Haul Command directory to search for heavy haul carriers by state, equipment type, and capacity. You can also post your load on the load board and receive quotes from qualified carriers nationwide.' } },
        { '@type': 'Question', name: 'Do heavy haul loads require escort vehicles?', acceptedAnswer: { '@type': 'Answer', text: 'Yes. Most oversize loads require one or more pilot car (escort vehicle) operators. The exact number depends on load dimensions and the states traveled through. Use the Haul Command escort calculator to estimate required escorts for any move.' } },
      ],
    },
  ],
};

const ACTIONS = [
  { href: '/directory', icon: 'ðŸ”', label: 'Find Heavy Haul Carriers', desc: 'Browse verified carriers by state, equipment type, and capacity', cta: 'Browse Directory â†’', primary: true },
  { href: '/loads', icon: 'ðŸ“¦', label: 'Post a Load', desc: 'List your oversize move and receive quotes from qualified carriers', cta: 'Post a Load â†’', primary: false },
  { href: '/escort-requirements', icon: 'âš–ï¸', label: 'Permit & Escort Rules', desc: 'State-by-state oversize permit thresholds and escort requirements', cta: 'Check Requirements â†’', primary: false },
  { href: '/tools/escort-calculator', icon: 'ðŸ§®', label: 'Escort Calculator', desc: 'Calculate how many pilot cars your load requires by state', cta: 'Calculate â†’', primary: false },
  { href: '/claim', icon: 'ðŸš›', label: 'List Your Operation', desc: 'Add your carrier company to the Haul Command directory â€” free', cta: 'Get Listed Free â†’', primary: false },
  { href: '/available-now', icon: 'ðŸŸ¢', label: 'Available Right Now', desc: 'Carriers and escort operators broadcasting live availability', cta: 'See Who\'s Available â†’', primary: false },
];

const gold = '#D4A844';

export default function HeavyHaulCarrierPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />

      <ProofStrip variant="bar" />

      <main style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>â€º</span>
          <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
          <span>â€º</span>
          <span style={{ color: gold }}>Heavy Haul Carriers</span>
        </nav>

        {/* Hero */}
        <section style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,68,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 20px 2rem' }}>
            <div style={{ display: 'flex', gap: 32, flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between' }}>
              <div style={{ flex: 1, minWidth: 280 }}>
                <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
                  Heavy Haul<br />
                  <span style={{ color: gold }}>Carriers</span>
                </h1>
                <p style={{ margin: '0 0 24px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 560 }}>
                  Find certified heavy haul carriers, flatbed operators, and lowboy specialists. Post loads, check permit requirements, and move oversize freight with confidence.
                </p>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>ðŸ” Find Carriers</Link>
                  <Link href="/loads" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>ðŸ“¦ Post a Load</Link>
                  <Link href="/claim" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>ðŸš› List Your Operation</Link>
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, minWidth: 220 }}>
                {[
                  { val: '14,000+', label: 'Listed Operators', color: gold },
                  { val: '2,400+', label: 'Verified', color: '#22C55E' },
                  { val: '50', label: 'States', color: '#3B82F6' },
                  { val: '120', label: 'Countries', color: '#8B5CF6' },
                ].map(s => (
                  <div key={s.label} style={{ padding: '14px 16px', borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', textAlign: 'center' }}>
                    <div style={{ fontSize: 22, fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.08em', marginTop: 5 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Action Grid */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 20px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 6px' }}>Carrier Tools & Resources</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Everything you need to move an oversize load compliantly and on time.</p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {ACTIONS.map((a) => (
              <Link key={a.href} href={a.href} style={{
                display: 'block', padding: '1.25rem', borderRadius: 14, textDecoration: 'none',
                background: a.primary ? 'rgba(212,168,68,0.05)' : 'rgba(255,255,255,0.02)',
                border: `1px solid ${a.primary ? 'rgba(212,168,68,0.25)' : 'rgba(255,255,255,0.06)'}`,
              }}>
                <div style={{ fontSize: 28, marginBottom: 10 }}>{a.icon}</div>
                <h3 style={{ fontSize: 15, fontWeight: 800, color: '#f9fafb', margin: '0 0 6px' }}>{a.label}</h3>
                <p style={{ fontSize: 12, color: '#9ca3af', margin: '0 0 14px', lineHeight: 1.5 }}>{a.desc}</p>
                <span style={{ fontSize: 13, fontWeight: 700, color: a.primary ? gold : '#60a5fa' }}>{a.cta}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section style={{ maxWidth: 800, margin: '0 auto', padding: '0 20px 2.5rem' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 14px' }}>Heavy Haul Carrier FAQ</h2>
          {[
            { q: 'What is a heavy haul carrier?', a: 'A heavy haul carrier transports oversize or overweight loads that exceed standard legal limits, using specialized equipment like lowboys, flatbeds, and multi-axle platforms. Permits are required for every jurisdiction the load crosses.' },
            { q: 'What equipment do heavy haul carriers use?', a: 'Common equipment includes flatbeds, step-decks, RGN lowboys, multi-axle platforms, and modular SPMTs. The right equipment depends on load dimensions, weight, and route constraints.' },
            { q: 'How do I find a heavy haul carrier near me?', a: 'Search the Haul Command directory by state and equipment type. You can also post your load on the load board and receive quotes from qualified carriers in your area.' },
            { q: 'Do heavy haul loads require pilot car escorts?', a: 'Most do. Escort vehicle requirements depend on load width, height, length, and the specific states traveled through. Use the escort calculator to determine how many pilot cars your load requires.' },
          ].map(({ q, a }) => (
            <details key={q} style={{ marginBottom: 10, borderRadius: 12, background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <summary style={{ padding: '14px 18px', cursor: 'pointer', fontWeight: 700, fontSize: 14, listStyle: 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ color: gold }}>+</span> {q}
              </summary>
              <p style={{ padding: '12px 18px 16px', margin: 0, fontSize: 13, color: 'rgba(255,255,255,0.6)', lineHeight: 1.6, borderTop: '1px solid rgba(255,255,255,0.05)' }}>{a}</p>
            </details>
          ))}
        </section>

        {/* Internal link mesh */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '0 20px 2rem', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <Link href="/glossary/heavy-haul" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ“– What Is Heavy Haul?</Link>
          <Link href="/glossary/oversize-load" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>ðŸ“– Oversize Load Definition</Link>
          <Link href="/tools/escort-calculator" style={{ padding: '8px 14px', background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: gold, textDecoration: 'none' }}>ðŸ§® Escort Calculator</Link>
          <Link href="/escort-requirements" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>âš–ï¸ State Escort Rules</Link>
          <Link href="/pricing" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>ðŸ’² Carrier Plans</Link>
        </section>

        {/* No Dead End */}
        <NoDeadEndBlock
          heading="What Would You Like to Do Next?"
          moves={[
            { href: '/directory', icon: 'ðŸ”', title: 'Find Carriers', desc: 'Browse verified by state & equipment', primary: true, color: gold },
            { href: '/loads', icon: 'ðŸ“¦', title: 'Post a Load', desc: 'Get quotes from qualified carriers', primary: true, color: '#22C55E' },
            { href: '/tools/escort-calculator', icon: 'ðŸ§®', title: 'Escort Calculator', desc: 'How many pilot cars?' },
            { href: '/escort-requirements', icon: 'âš–ï¸', title: 'State Rules', desc: 'Permit & escort requirements' },
            { href: '/claim', icon: 'ðŸš›', title: 'List Your Carrier', desc: 'Free directory listing' },
            { href: '/corridors', icon: 'ðŸ›£ï¸', title: 'Corridor Intelligence', desc: 'Route complexity data' },
          ]}
        />

      </main>
    </>
  );
}