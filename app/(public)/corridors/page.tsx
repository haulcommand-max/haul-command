import type { Metadata } from 'next';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { MapPin, ChevronRight, Shield, Zap, Award, Globe, TrendingUp, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Heavy Haul Corridors — Route Intelligence by Lane | Haul Command',
  description:
    'Corridor-level pilot car demand, escort density maps, permit complexity, and rate benchmarks for the most active heavy haul lanes across the US, Canada, and international routes.',
  keywords: [
    'heavy haul corridors', 'oversize load lanes', 'pilot car corridor demand',
    'escort route intelligence', 'heavy haul lane rates', 'oversize corridor map',
  ],
  alternates: {
    canonical: 'https://www.haulcommand.com/corridors',
    languages: {
      'en-US': 'https://www.haulcommand.com/corridors',
      'x-default': 'https://www.haulcommand.com/corridors',
    },
  },
  openGraph: {
    title: 'Heavy Haul Corridors — Route Intelligence | Haul Command',
    description: 'Corridor demand, escort density, and rate benchmarks for the top heavy haul lanes.',
    url: 'https://www.haulcommand.com/corridors',
  },
};

const TOP_CORRIDORS = [
  { id: 'tx-la', name: 'TX → LA', desc: 'Gulf petrochemical heavy corridor', demand: 'Hot', demandColor: '#ef4444', rate: '$2.40–$3.60/mi', escorts: 240 },
  { id: 'ok-tx', name: 'OK → TX', desc: 'Wind energy nacelle movements', demand: 'Hot', demandColor: '#ef4444', rate: '$2.10–$3.20/mi', escorts: 180 },
  { id: 'i-10-west', name: 'I-10 West', desc: 'AZ/CA solar & substation moves', demand: 'High', demandColor: '#f59e0b', rate: '$2.20–$3.40/mi', escorts: 155 },
  { id: 'appalachian', name: 'Appalachian', desc: 'PA/WV/OH industrial east', demand: 'High', demandColor: '#f59e0b', rate: '$1.80–$2.80/mi', escorts: 130 },
  { id: 'i-5-northwest', name: 'I-5 NW', desc: 'WA/OR forest product & wind', demand: 'Moderate', demandColor: '#22c55e', rate: '$2.00–$3.00/mi', escorts: 105 },
  { id: 'se-nuclear', name: 'SE Nuclear', desc: 'GA/SC reactor component moves', demand: 'High', demandColor: '#f59e0b', rate: '$2.30–$3.50/mi', escorts: 95 },
  { id: 'permian-basin', name: 'Permian Basin', desc: 'TX oilfield equipment — 24/7', demand: 'Hot', demandColor: '#ef4444', rate: '$2.60–$4.00/mi', escorts: 310 },
  { id: 'great-lakes', name: 'Great Lakes', desc: 'MI/IN/OH manufacturing', demand: 'Moderate', demandColor: '#22c55e', rate: '$1.70–$2.60/mi', escorts: 88 },
  { id: 'canada-us', name: 'Canada–US', desc: 'Cross-border wind & O&G', demand: 'High', demandColor: '#f59e0b', rate: 'C$2.50–$3.80/mi', escorts: 70 },
  { id: 'i-80-east', name: 'I-80 East', desc: 'NE/IA/IL midwest windmills', demand: 'Moderate', demandColor: '#22c55e', rate: '$1.90–$2.90/mi', escorts: 82 },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: 'Heavy Haul Corridors — Route Intelligence | Haul Command',
      url: 'https://www.haulcommand.com/corridors',
      description: 'Corridor demand, escort density, permit complexity, and rate benchmarks for heavy haul lanes.',
      breadcrumb: {
        '@type': 'BreadcrumbList',
        itemListElement: [
          { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
          { '@type': 'ListItem', position: 2, name: 'Corridors', item: 'https://www.haulcommand.com/corridors' },
        ],
      },
    },
    {
      '@type': 'ItemList',
      name: 'Top Heavy Haul Corridors',
      numberOfItems: TOP_CORRIDORS.length,
      itemListElement: TOP_CORRIDORS.map((c, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: c.name,
        description: c.desc,
      })),
    },
  ],
};

export default function CorridorsPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <ProofStrip variant="bar" />

      {/* ── HERO ── */}
      <section style={{
        position: 'relative', minHeight: 360, display: 'flex', alignItems: 'center',
        overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0A0D14',
      }}>
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse at 40% 50%, rgba(99,102,241,0.08), transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 60px, rgba(255,255,255,0.012) 60px, rgba(255,255,255,0.012) 61px), repeating-linear-gradient(90deg, transparent, transparent 60px, rgba(255,255,255,0.012) 60px, rgba(255,255,255,0.012) 61px)', pointerEvents: 'none' }} />

        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '3rem 1.5rem', position: 'relative', zIndex: 1, width: '100%' }}>
          <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 20, textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 700 }}>
            <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Haul Command</Link>
            <ChevronRight style={{ width: 10, height: 10 }} />
            <span style={{ color: '#818cf8' }}>Corridors</span>
          </nav>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}>🛣️ {TOP_CORRIDORS.length} Active Corridors</span>
            <span style={{ fontSize: 10, fontWeight: 800, padding: '4px 10px', borderRadius: 20, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.25)', color: '#f87171' }}>🔥 Live Demand</span>
          </div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.1, margin: '0 0 16px', fontStyle: 'italic' }}>
            Heavy Haul <span style={{ color: '#818cf8' }}>Corridor</span> Intelligence
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.15rem)', color: '#94a3b8', maxWidth: 600, lineHeight: 1.65, margin: '0 0 28px' }}>
            Escort demand, operator density, permit complexity, and rate benchmarks for the most active heavy haul lanes.
            Know the corridor before you move.
          </p>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="#corridors" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'linear-gradient(135deg, #818cf8, #6366f1)', color: '#fff', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
              <MapPin style={{ width: 14, height: 14 }} /> Explore Corridors
            </Link>
            <Link href="/tools/corridor-pricing" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.14)', color: '#f9fafb', padding: '12px 24px', borderRadius: 12, fontSize: 13, fontWeight: 800, textDecoration: 'none' }}>
              <TrendingUp style={{ width: 14, height: 14 }} /> Rate Benchmarks
            </Link>
          </div>
        </div>
      </section>

      {/* ── TOP SPONSOR ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <AdGridSlot zone="corridors_top" />
      </div>

      {/* ── CATEGORY ACTION BAR ── */}
      <section style={{ maxWidth: 1280, margin: '0 auto', padding: '20px 1.5rem 0' }}>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {[
            { label: 'Find Escorts on Route', href: '/directory', icon: '🔍', accent: true },
            { label: 'Rate Benchmarks', href: '/tools/corridor-pricing', icon: '📈' },
            { label: 'Permit Complexity', href: '/regulations', icon: '⚖️' },
            { label: 'Available Now', href: '/available-now', icon: '🟢' },
            { label: 'Get Certified', href: '/training', icon: '🎓' },
            { label: 'Sponsor a Corridor', href: '/advertise', icon: '📣', sponsor: true },
          ].map(item => (
            <Link key={item.label} href={item.href} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 20, background: item.accent ? 'linear-gradient(135deg, #818cf8, #6366f1)' : item.sponsor ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.05)', border: item.sponsor ? '1px dashed rgba(198,146,58,0.3)' : item.accent ? 'none' : '1px solid rgba(255,255,255,0.08)', color: item.accent ? '#fff' : item.sponsor ? '#C6923A' : '#d1d5db', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
              <span>{item.icon}</span> {item.label}
            </Link>
          ))}
        </div>
      </section>

      {/* ── MAIN TWO-COLUMN ── */}
      <div id="corridors" style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 1.5rem 48px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) 280px', gap: 32, alignItems: 'start' }}>

          {/* LEFT: Corridor grid */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', margin: 0 }}>Active Corridors</h2>
              <span style={{ fontSize: 12, color: '#475569' }}>{TOP_CORRIDORS.length} lanes tracked</span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {TOP_CORRIDORS.map((corridor, idx) => (
                <div key={corridor.id}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 16, padding: '18px 20px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, alignItems: 'center' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                        <span style={{ fontSize: 15, fontWeight: 900, color: '#f9fafb' }}>{corridor.name}</span>
                        <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 20, background: `${corridor.demandColor}14`, border: `1px solid ${corridor.demandColor}30`, color: corridor.demandColor }}>
                          {corridor.demand}
                        </span>
                      </div>
                      <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 8px' }}>{corridor.desc}</p>
                      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 11, color: '#C6923A', fontWeight: 700 }}>{corridor.rate}</span>
                        <span style={{ fontSize: 11, color: '#475569' }}>•</span>
                        <span style={{ fontSize: 11, color: '#475569' }}>{corridor.escorts} verified escorts</span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, flexShrink: 0 }}>
                      <Link href={`/directory?corridor=${corridor.id}`} style={{ padding: '7px 14px', borderRadius: 8, background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 11, fontWeight: 900, textDecoration: 'none', whiteSpace: 'nowrap' }}>
                        Find Escorts →
                      </Link>
                      <Link href={`/tools/corridor-pricing?lane=${corridor.id}`} style={{ padding: '7px 14px', borderRadius: 8, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 11, fontWeight: 700, textDecoration: 'none', whiteSpace: 'nowrap', textAlign: 'center' }}>
                        Rate History
                      </Link>
                    </div>
                  </div>
                  {/* Sponsor every 4th corridor */}
                  {(idx + 1) % 4 === 0 && (
                    <div style={{ marginTop: 12 }}>
                      <AdGridSlot zone={`corridors_mid_${idx}`} />
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Data note */}
            <p style={{ fontSize: 10, color: '#374151', marginTop: 20, padding: '12px 0', borderTop: '1px solid rgba(255,255,255,0.04)' }}>
              Corridor data updated weekly from Haul Command operator activity, permit data, and market intelligence. Rate ranges are benchmarks — actual rates vary by operator, load, and date.
            </p>
          </div>

          {/* RIGHT SIDEBAR */}
          <aside style={{ display: 'flex', flexDirection: 'column', gap: 14, position: 'sticky', top: 80 }}>

            <div style={{ background: 'linear-gradient(135deg, rgba(198,146,58,0.1), rgba(198,146,58,0.03))', border: '1px solid rgba(198,146,58,0.22)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <MapPin style={{ width: 14, height: 14, color: '#C6923A' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#C6923A', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Find Corridor Escorts</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Search verified escorts by corridor, state, or specific route. Real availability.</p>
              <Link href="/directory" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px 0', borderRadius: 10, width: '100%', background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000', fontSize: 12, fontWeight: 900, textDecoration: 'none' }}>
                Search Directory
              </Link>
              <Link href="/available-now" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '7px 0', borderRadius: 10, width: '100%', marginTop: 8, background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.18)', color: '#22c55e', fontSize: 11, fontWeight: 700, textDecoration: 'none' }}>
                🟢 Available Now
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Shield style={{ width: 14, height: 14, color: '#22c55e' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#22c55e', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Escort Operators</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>List your availability on specific corridors. Get priority placement in corridor searches.</p>
              <Link href="/claim" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.22)', color: '#22c55e', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                Claim Listing — Free
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <TrendingUp style={{ width: 14, height: 14, color: '#34d399' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#34d399', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Rate Benchmarks</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Historical lane rate data for all major corridors. Stop overpaying or underbidding.</p>
              <Link href="/tools/corridor-pricing" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', color: '#34d399', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Rate History →
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <FileText style={{ width: 14, height: 14, color: '#60a5fa' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#60a5fa', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Permit Complexity</span>
              </div>
              <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 12px', lineHeight: 1.5 }}>Know multi-state permit requirements before routing your load through any corridor.</p>
              <Link href="/regulations" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(96,165,250,0.08)', border: '1px solid rgba(96,165,250,0.2)', color: '#60a5fa', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Regulations →
              </Link>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: 16, padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Globe style={{ width: 14, height: 14, color: '#38bdf8' }} />
                <span style={{ fontSize: 11, fontWeight: 800, color: '#38bdf8', textTransform: 'uppercase', letterSpacing: '0.08em' }}>Corridor Data API</span>
              </div>
              <p style={{ fontSize: 12, color: '#475569', margin: '0 0 12px', lineHeight: 1.5 }}>Export corridor demand and rate data. Bulk CSV, API access, enterprise.</p>
              <Link href="/data-products" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '8px 0', borderRadius: 10, width: '100%', background: 'rgba(56,189,248,0.07)', border: '1px solid rgba(56,189,248,0.15)', color: '#38bdf8', fontSize: 12, fontWeight: 800, textDecoration: 'none' }}>
                View Data Products →
              </Link>
            </div>

            <div style={{ background: 'rgba(198,146,58,0.04)', border: '1px dashed rgba(198,146,58,0.18)', borderRadius: 16, padding: 16, textAlign: 'center' }}>
              <p style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 5px' }}>Sponsor a Corridor</p>
              <p style={{ fontSize: 11, color: '#475569', margin: '0 0 10px', lineHeight: 1.4 }}>Reach operators moving loads on specific routes.</p>
              <Link href="/advertise" style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '7px 14px', borderRadius: 8, background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.22)', color: '#C6923A', fontSize: 11, fontWeight: 800, textDecoration: 'none' }}>
                View Packages →
              </Link>
            </div>
          </aside>
        </div>
      </div>

      {/* ── NO DEAD END ── */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 1.5rem 48px' }}>
        <NoDeadEndBlock
          heading="Next Move"
          moves={[
            { href: '/directory', icon: '🔍', title: 'Find Corridor Escorts', desc: 'Search verified operators by lane', primary: true, color: '#D4A844' },
            { href: '/claim', icon: '✓', title: 'Claim Your Profile', desc: 'Get placed in corridor results', primary: true, color: '#22C55E' },
            { href: '/tools/corridor-pricing', icon: '📈', title: 'Rate Benchmarks', desc: 'Historical lane rates' },
            { href: '/regulations', icon: '⚖️', title: 'Permit Complexity', desc: 'Multi-state requirements' },
            { href: '/available-now', icon: '🟢', title: 'Available Now', desc: 'Live operator feed' },
            { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC Academy' },
            { href: '/escort-requirements', icon: '📋', title: 'Escort Requirements', desc: 'State-by-state rules' },
            { href: '/advertise', icon: '📣', title: 'Sponsor a Corridor', desc: 'Reach route operators' },
          ]}
        />
      </div>
    </>
  );
}
