import type { Metadata } from 'next';
import Link from 'next/link';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600;

export const metadata: Metadata = {
  title: '<a href="/glossary/heavy-haul" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Heavy Haul</a> Dispatchers — Dispatch Tools, Load Board & Escort Coordination | <a href="/glossary/haul-command" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">Haul Command</a>',
  description:
    'The complete platform for heavy haul dispatchers. Manage loads, coordinate <a href="/glossary/pilot-car" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">pilot car</a> escorts, track permits, and connect with verified operators across 120 countries. Real-time load board, dispatch map, and corridor intelligence.',
  keywords: [
    'heavy haul dispatcher', '<a href="/glossary/oversize-load" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">oversize load</a> dispatch', 'pilot car dispatch',
    '<a href="/glossary/escort-vehicle" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">escort vehicle</a> coordinator', 'oversize load coordinator', 'heavy haul load board',
    'dispatch oversize load', 'find pilot car for load', 'heavy haul dispatch platform',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/roles/dispatcher' },
  openGraph: {
    title: 'Heavy Haul Dispatchers | Haul Command',
    description: 'Manage loads, coordinate escorts, and track permits. The dispatch platform for oversize load professionals.',
    url: 'https://www.haulcommand.com/roles/dispatcher',
    siteName: 'Haul Command',
    type: 'website',
  },
};

const PAGE_SCHEMA = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Heavy Haul Dispatchers | Haul Command',
      url: 'https://www.haulcommand.com/roles/dispatcher',
      description: 'Platform and resource hub for heavy haul dispatchers coordinating oversize load moves.',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Directory', item: 'https://www.haulcommand.com/directory' },
          { '@type': 'ListItem', position: 3, name: 'Dispatchers', item: 'https://www.haulcommand.com/roles/dispatcher' },
        ],
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        { '@type': 'Question', name: 'What does a heavy haul dispatcher do?', acceptedAnswer: { '@type': 'Answer', text: 'A heavy haul dispatcher coordinates the movement of oversize or overweight loads by arranging permits, booking escort vehicles (pilot cars), planning routes, and communicating with drivers, brokers, and state DOT agencies throughout each move.' } },
        { '@type': 'Question', name: 'How do I find a pilot car for my load?', acceptedAnswer: { '@type': 'Answer', text: 'Use the Haul Command directory to search for pilot car operators by state and availability. You can also post a load on the load board and receive quotes from nearby certified escort operators.' } },
        { '@type': 'Question', name: 'What permits are required for oversize loads?', acceptedAnswer: { '@type': 'Answer', text: 'Every state has different permit thresholds and <a href="/glossary/escort-requirements" style="color: #D4A844; text-decoration: none; border-bottom: 1px dotted rgba(212,168,68,0.3);">escort requirements</a>. Use the Haul Command escort requirements tool to look up rules for any US state. For cross-border moves, permits are required in each jurisdiction the load passes through.' } },
        { '@type': 'Question', name: 'How many pilot cars are required for my load?', acceptedAnswer: { '@type': 'Answer', text: 'The number of escort vehicles required depends on load dimensions (width, height, length, and weight), the specific route, and the state or jurisdiction rules. Use the Haul Command escort vehicle calculator to get an instant estimate.' } },
      ],
    },
  ],
};

const ACTIONS = [
  { href: '/loads', icon: '📡', label: 'Open Load Board', desc: 'See all active oversize loads needing dispatch coverage', cta: 'View Loads →', primary: true },
  { href: '/directory', icon: '🔍', label: 'Find Escort Operators', desc: 'Locate verified pilot cars available in any state or country', cta: 'Find Escorts →', primary: false },
  { href: '/escort-requirements', icon: '⚖️', label: 'State Escort Rules', desc: 'Look up escort and permit requirements for any US state', cta: 'Check State Rules →', primary: false },
  { href: '/tools/escort-calculator', icon: '🧮', label: 'Escort Vehicle Calculator', desc: 'Calculate how many pilot cars your load requires', cta: 'Calculate Escorts →', primary: false },
  { href: '/available-now', icon: '🟢', label: 'Available Right Now', desc: 'Operators broadcasting live availability for immediate dispatch', cta: 'See Who\'s Available →', primary: false },
  { href: '/map', icon: '🗺️', label: 'Live Dispatch Map', desc: 'Track active loads, corridors, and operator positions in real time', cta: 'Open Map →', primary: false },
];

const gold = '#D4A844';

export default function DispatcherPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PAGE_SCHEMA) }} />

      <ProofStrip variant="bar" />

      <main style={{ minHeight: '100vh', background: '#06080f', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" style={{ maxWidth: 1100, margin: '0 auto', padding: '20px 20px 0', fontSize: 11, color: '#6b7280', display: 'flex', gap: 6, alignItems: 'center', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
          <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
          <span>›</span>
          <Link href="/directory" style={{ color: '#6b7280', textDecoration: 'none' }}>Directory</Link>
          <span>›</span>
          <span style={{ color: gold }}>Dispatchers</span>
        </nav>

        {/* Hero */}
        <section style={{ position: 'relative', borderBottom: '1px solid rgba(255,255,255,0.06)', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 60% at 50% -10%, rgba(212,168,68,0.08), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(2rem,5vw,4rem) 20px 2rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', background: 'rgba(212,168,68,0.1)', border: '1px solid rgba(212,168,68,0.25)', borderRadius: 20, marginBottom: 16 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22C55E', boxShadow: '0 0 6px #22C55E' }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Dispatch Command Center</span>
            </div>
            <h1 style={{ margin: '0 0 14px', fontSize: 'clamp(2rem, 5vw, 3.25rem)', fontWeight: 900, lineHeight: 1.05, letterSpacing: '-0.035em', color: '#f9fafb' }}>
              Heavy Haul<br />
              <span style={{ color: gold }}>Dispatchers</span>
            </h1>
            <p style={{ margin: '0 0 24px', fontSize: 16, color: '#9ca3af', lineHeight: 1.7, maxWidth: 560 }}>
              Manage loads, coordinate pilot car escorts, and stay ahead of every permit deadline. Haul Command gives dispatchers the intelligence and network to move any load, anywhere.
            </p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <Link href="/loads" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 28px', borderRadius: 12, background: `linear-gradient(135deg, ${gold}, #E4B872)`, color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none' }}>📡 Open Load Board</Link>
              <Link href="/directory" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 12, background: 'rgba(34,197,94,0.1)', border: '1px solid rgba(34,197,94,0.25)', color: '#22C55E', fontSize: 14, fontWeight: 800, textDecoration: 'none' }}>🔍 Find Escort Now</Link>
              <Link href="/available-now" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: '#e5e7eb', fontSize: 14, fontWeight: 700, textDecoration: 'none' }}>🟢 Available Now</Link>
            </div>
          </div>
        </section>

        {/* Action Grid */}
        <section style={{ maxWidth: 1100, margin: '0 auto', padding: '2.5rem 20px' }}>
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 6px' }}>Dispatch Tools</h2>
          <p style={{ fontSize: 13, color: '#6b7280', margin: '0 0 20px' }}>Everything you need to move an oversize load from order to delivery.</p>
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
          <h2 style={{ fontSize: 17, fontWeight: 800, color: '#f9fafb', margin: '0 0 14px' }}>Dispatcher FAQ</h2>
          {[
            { q: 'What does a heavy haul dispatcher do?', a: 'A heavy haul dispatcher coordinates the movement of oversize or overweight loads by arranging permits, booking escort vehicles, planning routes, and communicating with drivers and brokers throughout each move.' },
            { q: 'How do I find a pilot car for my load?', a: 'Search the Haul Command directory by state and availability, or post your load on the load board. Certified escort operators can respond directly with availability and rates.' },
            { q: 'How many pilot cars does my load need?', a: 'Use the Haul Command escort vehicle calculator — input your load dimensions and route states to get an instant requirement estimate. Requirements vary by state.' },
            { q: 'What permits are required for oversize loads?', a: 'Every state has different thresholds and escort requirements. Use the escort requirements tool to look up rules for any US state. For cross-state moves, permits are required in each jurisdiction.' },
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
          <Link href="/glossary/pilot-car" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>📖 What Is a Pilot Car?</Link>
          <Link href="/glossary/oversize-load" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>📖 Oversize Load Definition</Link>
          <Link href="/tools/escort-calculator" style={{ padding: '8px 14px', background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: gold, textDecoration: 'none' }}>🧮 Escort Calculator</Link>
          <Link href="/escort-requirements" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>⚖️ State Escort Rules</Link>
          <Link href="/pricing" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>💲 Dispatcher Plans</Link>
        </section>

        {/* No Dead End */}
        <NoDeadEndBlock
          heading="What Would You Like to Do Next?"
          moves={[
            { href: '/loads', icon: '📡', title: 'Open Load Board', desc: 'Find loads needing escorts', primary: true, color: gold },
            { href: '/directory', icon: '🔍', title: 'Find Escort Operators', desc: 'Verified pilot cars by state', primary: true, color: '#22C55E' },
            { href: '/available-now', icon: '🟢', title: 'Available Right Now', desc: 'Operators broadcasting availability' },
            { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'How many vehicles?' },
            { href: '/corridors', icon: '🛣️', title: 'Corridor Intelligence', desc: 'Route complexity by corridor' },
            { href: '/pricing', icon: '💎', title: 'Pro Dispatch Tools', desc: 'Advanced features for dispatchers' },
          ]}
        />

      </main>
    </>
  );
}
