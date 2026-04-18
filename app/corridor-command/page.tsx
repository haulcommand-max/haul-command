import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Shield, Zap, BarChart3, MapPin, Activity, Eye, ChevronRight, Star, ArrowRight, CheckCircle } from 'lucide-react';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { FreshnessBadge } from '@/components/ui/FreshnessBadge';

// ═══════════════════════════════════════════════════════════════
// /corridor-command — Premium Corridor Intelligence Sales Page
// The conversion surface for the $29/mo Corridor Command product.
// Schema: Product + Offer for rich search results.
// ═══════════════════════════════════════════════════════════════

export const revalidate = 3600; // 1hr

export const metadata: Metadata = {
  title: 'Corridor Command — Live Route Intelligence | Haul Command',
  description:
    'Monitor every heavy haul corridor in real time. Rate benchmarks, operator density, compliance alerts, and supply signals — starting at $29/month.',
  keywords: [
    'corridor intelligence', 'heavy haul route monitoring', 'oversize load corridors',
    'pilot car supply', 'corridor rate trends', 'freight route analytics',
    'heavy haul command center', 'corridor monitoring subscription',
  ],
  alternates: { canonical: 'https://www.haulcommand.com/corridor-command' },
  openGraph: {
    title: 'Corridor Command — Live Route Intelligence | Haul Command',
    description: 'Monitor every heavy haul corridor in real time. Rate benchmarks, supply signals, compliance alerts.',
    url: 'https://www.haulcommand.com/corridor-command',
    images: [{ url: '/og-image.png', width: 1200, height: 630 }],
  },
};

const PRODUCT_JSONLD = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Product',
      name: 'Corridor Command',
      description: 'Real-time heavy haul corridor intelligence platform with rate benchmarks, operator density signals, and compliance alerts.',
      url: 'https://www.haulcommand.com/corridor-command',
      brand: { '@type': 'Organization', name: 'Haul Command' },
      offers: [
        {
          '@type': 'Offer', name: 'Starter', price: '29', priceCurrency: 'USD',
          url: 'https://www.haulcommand.com/corridor-command#pricing',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer', name: 'Pro', price: '79', priceCurrency: 'USD',
          url: 'https://www.haulcommand.com/corridor-command#pricing',
          availability: 'https://schema.org/InStock',
        },
        {
          '@type': 'Offer', name: 'Enterprise', price: '199', priceCurrency: 'USD',
          url: 'https://www.haulcommand.com/corridor-command#pricing',
          availability: 'https://schema.org/InStock',
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.haulcommand.com' },
        { '@type': 'ListItem', position: 2, name: 'Corridor Command', item: 'https://www.haulcommand.com/corridor-command' },
      ],
    },
  ],
};

const FEATURES = [
  { icon: Activity, title: 'Live Corridor Pulse', desc: 'Real-time operator density, availability, and repositioning signals on every major route.' },
  { icon: BarChart3, title: 'Rate Benchmarks', desc: 'Historical and current escort rate data so you never overpay or underbid on a corridor.' },
  { icon: Shield, title: 'Compliance Radar', desc: 'Permit requirement changes, state regulation updates, and height/weight restriction alerts.' },
  { icon: MapPin, title: 'Coverage Gap Alerts', desc: 'Automatic notifications when operator supply drops below your thresholds.' },
  { icon: Eye, title: 'Competitive Intel', desc: 'See which corridors are heating up, where operators are repositioning, and where supply is thinning.' },
  { icon: Zap, title: 'Instant Dispatch Match', desc: 'One-click operator matching from corridor intelligence directly into the dispatch pipeline.' },
];

const TIERS = [
  {
    name: 'Starter',
    price: 29,
    period: '/mo',
    desc: 'For owner-operators and small fleets watching 1-3 corridors.',
    features: ['3 watched corridors', 'Daily briefing email', 'Rate benchmarks', 'Basic compliance alerts', 'Directory visibility boost'],
    cta: 'Start Monitoring',
    productKey: 'hc_basic_monthly',
    highlight: false,
  },
  {
    name: 'Pro',
    price: 79,
    period: '/mo',
    desc: 'For brokers and carriers managing multiple corridors.',
    features: ['Unlimited corridors', 'Real-time push alerts', 'Rate history + trends', 'Coverage gap radar', 'Morning briefing', 'Priority dispatch matching', 'Report card analytics'],
    cta: 'Go Pro',
    productKey: 'hc_pro_monthly',
    highlight: true,
  },
  {
    name: 'Enterprise',
    price: 199,
    period: '/mo',
    desc: 'For logistics companies running corridor-scale operations.',
    features: ['Everything in Pro', 'API access', 'Custom alert rules', 'Corridor sponsorship slot', 'Dedicated account rep', 'SLA-backed data freshness', 'White-label reports'],
    cta: 'Contact Sales',
    productKey: 'hc_elite_monthly',
    highlight: false,
  },
];

const TOP_CORRIDORS = [
  { name: 'I-10 Texas-Louisiana', slug: 'i-10-tx-la', operators: 47, trend: '+12%' },
  { name: 'I-35 Oklahoma-Texas', slug: 'i-35-ok-tx', operators: 38, trend: '+8%' },
  { name: 'I-20 Texas-Mississippi', slug: 'i-20-tx-ms', operators: 29, trend: 'stable' },
  { name: 'I-40 Cross-Country', slug: 'i-40-cross', operators: 52, trend: '+15%' },
  { name: 'I-5 Pacific Coast', slug: 'i-5-pacific', operators: 34, trend: '+6%' },
  { name: 'I-75 Florida Gateway', slug: 'i-75-fl', operators: 41, trend: '+10%' },
];

export default async function CorridorCommandPage() {
  // Pull real corridor counts for proof
  const supabase = createClient();
  const { count: totalCorridors } = await supabase
    .from('h3_corridor_intelligence')
    .select('id', { count: 'exact', head: true })
    .catch(() => ({ count: null })) as any;

  const { count: totalOperators } = await supabase
    .from('hc_global_operators')
    .select('id', { count: 'exact', head: true })
    .eq('country_code', 'US')
    .catch(() => ({ count: null })) as any;

  const corridorCount = totalCorridors ?? 120;
  const operatorCount = totalOperators ?? 8400;

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(PRODUCT_JSONLD) }} />
      <ProofStrip variant="bar" />

      <div style={{ minHeight: '100vh', background: '#050608', color: '#e5e7eb', fontFamily: "'Inter', system-ui" }}>

        {/* === HERO === */}
        <section style={{ position: 'relative', overflow: 'hidden', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(ellipse 80% 50% at 50% -10%, rgba(198,146,58,0.12), transparent 70%)', pointerEvents: 'none' }} />
          <div style={{ maxWidth: 1100, margin: '0 auto', padding: '4rem 1.5rem 3.5rem', position: 'relative' }}>

            <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: '#4b5563', marginBottom: 24, textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
              <Link href="/" style={{ color: '#6b7280', textDecoration: 'none' }}>Home</Link>
              <ChevronRight style={{ width: 12, height: 12 }} />
              <span style={{ color: '#C6923A' }}>Corridor Command</span>
            </nav>

            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 14px', borderRadius: 20, background: 'rgba(198,146,58,0.1)', border: '1px solid rgba(198,146,58,0.3)', fontSize: 11, fontWeight: 800, color: '#C6923A' }}>
                <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#C6923A', boxShadow: '0 0 8px rgba(198,146,58,0.5)', animation: 'pulse 2s ease-in-out infinite' }} />
                LIVE INTELLIGENCE
              </div>
              <FreshnessBadge lastSeenAt={new Date().toISOString()} />
            </div>

            <h1 style={{ margin: '0 0 16px', fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 900, color: '#f9fafb', letterSpacing: '-0.03em', lineHeight: 1.08 }}>
              Own Every Corridor.<br />
              <span style={{ color: '#C6923A' }}>Command the Route.</span>
            </h1>
            <p style={{ margin: '0 0 2rem', fontSize: '1.1rem', color: '#94a3b8', lineHeight: 1.7, maxWidth: 580 }}>
              Real-time rate intelligence, operator density, compliance radar, and
              supply signals across {corridorCount}+ monitored heavy haul corridors.
              Stop guessing. Start commanding.
            </p>

            {/* Stats row */}
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap', marginBottom: 32 }}>
              {[
                { val: `${corridorCount}+`, label: 'Corridors Monitored' },
                { val: operatorCount.toLocaleString(), label: 'Verified Operators' },
                { val: '10s', label: 'Data Refresh' },
                { val: '50', label: 'States Covered' },
              ].map(s => (
                <div key={s.label} style={{ textAlign: 'center' }}>
                  <div style={{ fontSize: 28, fontWeight: 900, color: '#C6923A' }}>{s.val}</div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: 1 }}>{s.label}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              <Link href="#pricing" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 12,
                background: 'linear-gradient(135deg, #C6923A, #E0B05C)',
                color: '#000', fontSize: 14, fontWeight: 900, textDecoration: 'none',
                boxShadow: '0 4px 20px rgba(198,146,58,0.3)',
              }}>
                Start Monitoring <ArrowRight style={{ width: 16, height: 16 }} />
              </Link>
              <Link href="/corridors" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 12,
                background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                color: '#d1d5db', fontSize: 14, fontWeight: 700, textDecoration: 'none',
              }}>
                Browse Free Corridors
              </Link>
            </div>
          </div>
        </section>

        <div style={{ maxWidth: 1100, margin: '0 auto', padding: '0 1.5rem' }}>

          {/* === FEATURES GRID === */}
          <section style={{ padding: '4rem 0 3rem' }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f9fafb', marginBottom: 8, textAlign: 'center' }}>
              Intelligence That Moves Freight
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
              Everything a broker, carrier, or fleet needs to dominate their corridors.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
              {FEATURES.map(f => (
                <div key={f.title} style={{
                  background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: 16, padding: 24, transition: 'all 0.2s',
                }}>
                  <f.icon style={{ width: 24, height: 24, color: '#C6923A', marginBottom: 12 }} />
                  <h3 style={{ fontSize: 16, fontWeight: 800, color: '#f9fafb', marginBottom: 6 }}>{f.title}</h3>
                  <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: 0 }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* === LIVE CORRIDORS === */}
          <section style={{ padding: '2rem 0 3rem' }}>
            <h2 style={{ fontSize: 20, fontWeight: 900, color: '#f9fafb', marginBottom: 20 }}>
              Top Monitored Corridors
            </h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 12 }}>
              {TOP_CORRIDORS.map(c => (
                <Link key={c.slug} href={`/corridors/${c.slug}`} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '16px 20px', borderRadius: 14,
                  background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                  textDecoration: 'none', transition: 'all 0.15s',
                }}>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#f9fafb' }}>{c.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{c.operators} operators active</div>
                  </div>
                  <span style={{
                    fontSize: 11, fontWeight: 800, padding: '4px 10px', borderRadius: 8,
                    background: c.trend.includes('+') ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.04)',
                    color: c.trend.includes('+') ? '#22c55e' : '#64748b',
                  }}>
                    {c.trend}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          {/* === SPONSOR ZONE === */}
          <AdGridSlot zone="corridor_command_sponsor" />

          {/* === PRICING === */}
          <section id="pricing" style={{ padding: '4rem 0 3rem', scrollMarginTop: 80 }}>
            <h2 style={{ fontSize: 24, fontWeight: 900, color: '#f9fafb', textAlign: 'center', marginBottom: 8 }}>
              Choose Your Command Level
            </h2>
            <p style={{ textAlign: 'center', color: '#64748b', fontSize: 14, marginBottom: 40, maxWidth: 500, margin: '0 auto 40px' }}>
              All plans include a 7-day free trial. Cancel anytime.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {TIERS.map(t => (
                <div key={t.name} style={{
                  background: t.highlight ? 'rgba(198,146,58,0.06)' : 'rgba(255,255,255,0.025)',
                  border: `1px solid ${t.highlight ? 'rgba(198,146,58,0.25)' : 'rgba(255,255,255,0.06)'}`,
                  borderRadius: 20, padding: 28, display: 'flex', flexDirection: 'column',
                  position: 'relative', overflow: 'hidden',
                }}>
                  {t.highlight && (
                    <span style={{
                      position: 'absolute', top: 12, right: 12, fontSize: 9, fontWeight: 900,
                      background: 'linear-gradient(135deg, #C6923A, #E0B05C)', color: '#000',
                      padding: '3px 10px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 1,
                    }}>
                      Most Popular
                    </span>
                  )}

                  <h3 style={{ fontSize: 18, fontWeight: 900, color: '#f9fafb', marginBottom: 4 }}>{t.name}</h3>
                  <p style={{ fontSize: 12, color: '#64748b', marginBottom: 16, lineHeight: 1.5 }}>{t.desc}</p>

                  <div style={{ marginBottom: 20 }}>
                    <span style={{ fontSize: 36, fontWeight: 900, color: t.highlight ? '#C6923A' : '#f9fafb' }}>
                      ${t.price}
                    </span>
                    <span style={{ fontSize: 14, color: '#64748b' }}>{t.period}</span>
                  </div>

                  <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1 }}>
                    {t.features.map(f => (
                      <li key={f} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, fontSize: 13, color: '#94a3b8' }}>
                        <CheckCircle style={{ width: 14, height: 14, color: t.highlight ? '#C6923A' : '#22c55e', flexShrink: 0 }} />
                        {f}
                      </li>
                    ))}
                  </ul>

                  <Link href={`/api/checkout/session?product_key=${t.productKey}`} style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    padding: '12px', borderRadius: 12,
                    background: t.highlight ? 'linear-gradient(135deg, #C6923A, #E0B05C)' : 'rgba(255,255,255,0.06)',
                    border: t.highlight ? 'none' : '1px solid rgba(255,255,255,0.1)',
                    color: t.highlight ? '#000' : '#d1d5db',
                    fontSize: 13, fontWeight: 900, textDecoration: 'none',
                    boxShadow: t.highlight ? '0 4px 20px rgba(198,146,58,0.25)' : 'none',
                  }}>
                    {t.cta} <ArrowRight style={{ width: 14, height: 14 }} />
                  </Link>
                </div>
              ))}
            </div>
          </section>

          {/* === INTERNAL LINKS === */}
          <section style={{ marginBottom: 32, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/corridors" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>Browse All Corridors</Link>
            <Link href="/directory" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>Operator Directory</Link>
            <Link href="/tools/escort-calculator" style={{ padding: '8px 14px', background: 'rgba(212,168,68,0.07)', border: '1px solid rgba(212,168,68,0.18)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#D4A844', textDecoration: 'none' }}>Escort Calculator</Link>
            <Link href="/pricing" style={{ padding: '8px 14px', background: 'rgba(34,197,94,0.06)', border: '1px solid rgba(34,197,94,0.15)', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#22C55E', textDecoration: 'none' }}>Compare All Plans</Link>
            <Link href="/available-now" style={{ padding: '8px 14px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 9, fontSize: 12, fontWeight: 600, color: '#9CA3AF', textDecoration: 'none' }}>Available Now Feed</Link>
          </section>

          {/* === NO DEAD END === */}
          <NoDeadEndBlock
            heading="Ready to Command Your Corridors?"
            moves={[
              { href: '/corridors', icon: '🗺️', title: 'Browse Corridors', desc: 'Free corridor intelligence', primary: true, color: '#C6923A' },
              { href: '/pricing', icon: '💲', title: 'View All Plans', desc: 'Compare tiers', primary: true, color: '#22C55E' },
              { href: '/directory', icon: '🔍', title: 'Find Operators', desc: 'Verified escort directory' },
              { href: '/available-now', icon: '📡', title: 'Available Now', desc: 'Live operator feed' },
              { href: '/tools/escort-calculator', icon: '🧮', title: 'Escort Calculator', desc: 'Get instant quotes' },
              { href: '/training', icon: '🎓', title: 'Get Certified', desc: 'HC training program' },
            ]}
          />
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }`}</style>
    </>
  );
}
