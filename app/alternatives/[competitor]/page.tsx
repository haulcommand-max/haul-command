import Link from 'next/link';
import { ChevronRight, CheckCircle, XCircle, AlertTriangle, Globe, Shield, Zap, TrendingUp, Bot } from 'lucide-react';
import type { Metadata } from 'next';

// ═══════════════════════════════════════════════════════════════
// COMPETITOR INTERCEPT PAGES — SEO Capture
// Factual comparisons only. No trademark misuse.
// Expanded: ODS, WCS, Oversize.io + original three
// ═══════════════════════════════════════════════════════════════

const ALTERNATIVES: Record<string, {
  companyLabel: string;
  category: string;
  factsOnly: string[];
  hcAdvantages: string[];
  metaDescription: string;
  metaTitle: string;
}> = {
  'ods-north-america': {
    companyLabel: 'ODS North America',
    category: 'Oversize Load Permitting Service',
    factsOnly: [
      'Specializes in oversize/overweight load permitting across North America',
      'Manual permit processing with experienced agents',
      'Phone-and-email based workflow for permit ordering',
      'Coverage primarily focused on US and Canadian provinces',
      'No integrated load board or operator matching capabilities',
    ],
    hcAdvantages: [
      'AI-powered permit route optimization — instant route analysis',
      'Integrated load board connects permits directly to qualified escorts',
      'Real-time compliance tracking across 120 countries, not just North America',
      'Digital permit processing with automated state requirement checking',
      'Operator matching: find certified escorts in under 47 minutes median fill time',
      'One-stop: permits + escorts + route planning + payment in a single platform',
    ],
    metaDescription: 'Looking for an ODS North America alternative? Haul Command combines AI-powered permitting with integrated escort dispatch across 120 countries.',
    metaTitle: 'ODS North America Alternatives — Haul Command vs ODS',
  },
  'wcs-permits': {
    companyLabel: 'WCS Permits',
    category: 'Heavy Haul Permitting Service',
    factsOnly: [
      'Provides oversize and overweight permitting services for the trucking industry',
      'Manual permit application processing and route planning',
      'Primarily focused on US state-level permits',
      'Traditional phone/fax/email communication workflow',
      'No integrated marketplace for escort operators',
    ],
    hcAdvantages: [
      'Digital-first: real-time permit status tracking and push notifications',
      'Multi-country support: 120 countries with jurisdiction-specific compliance',
      'Automated route analysis identifies bridge restrictions and height clearances',
      'Same-platform escort matching eliminates separate vendor coordination',
      'Escrow-protected payments ensure operator and broker security',
      'AI Compliance Copilot answers jurisdiction questions instantly',
    ],
    metaDescription: 'Looking for a WCS Permits alternative? Haul Command offers digital permitting with AI route analysis and escort matching in one platform.',
    metaTitle: 'WCS Permits Alternatives — Haul Command vs WCS',
  },
  'oversize-io': {
    companyLabel: 'Oversize.io',
    category: 'Oversize Load Management Platform',
    factsOnly: [
      'Digital platform for oversize load management and coordination',
      'Provides tools for tracking oversize load shipments',
      'Emerging platform with growing feature set',
      'Focused primarily on the US market',
      'Limited pilot car operator directory and matching',
    ],
    hcAdvantages: [
      '1.5M+ verified operators across 120 countries — the largest escort directory',
      'HOT/WARM/COOL corridor intelligence shows real-time market demand',
      'Escrow payments protect both operators and brokers on every job',
      'AV escort certification system ready for autonomous fleet regulation',
      'Rate intelligence: corridor-specific pricing benchmarks with value indicators',
      'Emergency Fill: blast urgent loads to all available operators in seconds',
      'White label API for enterprise integration ($999/mo)',
    ],
    metaDescription: 'Looking for an Oversize.io alternative? Haul Command serves 1.5M+ operators across 120 countries with AI-powered dispatch and escrow payments.',
    metaTitle: 'Oversize.io Alternatives — Haul Command vs Oversize.io',
  },
  truckstop: {
    companyLabel: 'Truckstop.com',
    category: 'Freight Load Board',
    factsOnly: [
      'Load board focused primarily on dry van, flatbed, and general freight lanes',
      'Limited filtering specifically for oversize escort / pilot car loads',
      'Subscription-based access with tiered pricing for carriers',
      'Primarily broker-to-carrier matching, not escort-specific',
    ],
    hcAdvantages: [
      'Built exclusively for oversize escort and pilot car operators',
      'Escort-specific filters: state certifications, equipment type, corridor experience',
      'Instant real-time matching — median fill time under 47 minutes',
      'Free driver profiles with verified credential display',
      'Live load map with density heatmap and route intelligence',
    ],
    metaDescription: 'Looking for a Truckstop.com alternative for pilot car services? See how Haul Command compares for oversize load escort operators.',
    metaTitle: 'Truckstop Alternatives for Pilot Car Services — Haul Command',
  },
  'dat-freight': {
    companyLabel: 'DAT Freight & Analytics',
    category: 'Freight Analytics & Load Board',
    factsOnly: [
      'Industry-leading freight analytics and load board for general trucking',
      'Strong rate intelligence across standard freight lanes',
      'Not specifically designed for oversize escort / pilot car workflow',
      'Rate tools focused on dry van and flatbed, not escort-per-mile pricing',
    ],
    hcAdvantages: [
      'Escort-specific rate intelligence by corridor and load type',
      'Value indicators on every load (Strong/Market/Below)',
      'Real-time driver availability, not just rate history',
      'Free state requirements cheatsheet built in',
      'Pilot car certification verification built into profiles',
    ],
    metaDescription: 'Looking for a DAT Freight alternative for escort services? Compare Haul Command vs DAT for oversize load escort operators.',
    metaTitle: 'DAT Freight Alternatives for Escort Services — Haul Command',
  },
  uship: {
    companyLabel: 'uShip',
    category: 'Freight Marketplace',
    factsOnly: [
      'Consumer and business freight marketplace with auction-style bidding',
      'Handles a wide variety of freight including vehicle and boat transport',
      'Not purpose-built for certified oversize escort vehicle dispatch',
      'Limited state-by-state compliance and certification verification',
    ],
    hcAdvantages: [
      'Purpose-built for oversize escort — state cert verification built in',
      'Direct match to certified pilot car operators, no bidding required',
      'Instant dispatch vs multi-day auction cycles',
      'Compliance-first: driver profiles show FAC, height pole, insurance status',
      'Emergency and same-day dispatch available',
    ],
    metaDescription: 'Looking for a uShip alternative for pilot car services? See how Haul Command compares for certified oversize escort dispatch.',
    metaTitle: 'uShip Alternatives for Pilot Car Services — Haul Command',
  },
};

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: any): Promise<Metadata> {
  const p = await params;
  const alt = ALTERNATIVES[p.competitor];
  return {
    title: alt?.metaTitle ?? 'Competitor Alternatives for Pilot Car Services | Haul Command',
    description: alt?.metaDescription ?? 'Compare pilot car and escort vehicle platforms.',
    openGraph: {
      title: alt?.metaTitle,
      description: alt?.metaDescription,
      type: 'website',
    },
  };
}

export default async function CompetitorInterceptPage({ params }: any) {
  const p = await params;
  const slug = p.competitor;
  const alt = ALTERNATIVES[slug];

  if (!alt) {
    return <div style={{ padding: 40, color: '#6b7280', background: '#0B0B0C', minHeight: '100vh' }}>Page not found.</div>;
  }

  const gold = '#C6923A';
  const bg = '#0B0B0C';
  const text = '#F0F0F2';
  const muted = '#6B6B75';
  const border = 'rgba(255,255,255,0.06)';

  return (
    <div style={{ minHeight: '100vh', background: bg, color: text, fontFamily: "'Inter', system-ui", padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        {/* Breadcrumb */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: muted, marginBottom: 28, fontWeight: 700 }}>
          <Link href="/directory" style={{ color: muted, textDecoration: 'none' }}>Directory</Link>
          <ChevronRight style={{ width: 12, height: 12 }} />
          <Link href="/alternatives" style={{ color: muted, textDecoration: 'none' }}>Alternatives</Link>
          <ChevronRight style={{ width: 12, height: 12 }} />
          <span style={{ color: text }}>{alt.companyLabel}</span>
        </nav>

        {/* Header */}
        <header style={{ marginBottom: 36 }}>
          <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(198,146,58,0.06)', border: `1px solid rgba(198,146,58,0.15)`, borderRadius: 20, marginBottom: 14 }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: gold, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Platform Comparison</span>
          </div>
          <h1 style={{ margin: 0, fontSize: 'clamp(26px, 4vw, 38px)', fontWeight: 900, color: text, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
            {alt.companyLabel} Alternatives<br />
            <span style={{ color: gold }}>for Oversize Escort Services</span>
          </h1>
          <p style={{ margin: '12px 0 0', fontSize: 14, color: muted, lineHeight: 1.6 }}>
            {alt.companyLabel} is a {alt.category}. Here&apos;s how it compares to Haul Command for oversize escort and pilot car operators globally.
          </p>
        </header>

        {/* Side-by-side comparison */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 36 }}>
          <div style={{ background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}`, borderRadius: 16, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, color: muted }}>{alt.companyLabel}</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alt.factsOnly.map((f, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <AlertTriangle style={{ width: 13, height: 13, color: '#4b5563', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: muted, lineHeight: 1.6 }}>{f}</span>
                </div>
              ))}
            </div>
          </div>
          <div style={{ background: 'rgba(198,146,58,0.04)', border: '1px solid rgba(198,146,58,0.15)', borderRadius: 16, padding: '1.5rem' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 13, fontWeight: 800, color: gold }}>Haul Command</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {alt.hcAdvantages.map((a, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                  <CheckCircle style={{ width: 13, height: 13, color: '#22c55e', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 12, color: text, lineHeight: 1.6 }}>{a}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key differentiators */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 36 }}>
          {[
            { icon: <Globe size={18} />, label: '120 Countries', sub: 'Global coverage' },
            { icon: <Shield size={18} />, label: 'Escrow Protected', sub: 'Every verified job' },
            { icon: <Zap size={18} />, label: '47min Fill Time', sub: 'Median response' },
            { icon: <Bot size={18} />, label: 'AV Ready', sub: 'Autonomous fleet escorts' },
          ].map((d, i) => (
            <div key={i} style={{
              display: 'flex', alignItems: 'center', gap: 12, padding: '14px 16px',
              background: 'rgba(255,255,255,0.02)', border: `1px solid ${border}`, borderRadius: 12,
            }}>
              <div style={{ color: gold }}>{d.icon}</div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 800, color: text }}>{d.label}</div>
                <div style={{ fontSize: 11, color: muted }}>{d.sub}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.08)', borderRadius: 10, padding: '12px 16px', marginBottom: 28 }}>
          <p style={{ margin: 0, fontSize: 10, color: muted, lineHeight: 1.7 }}>
            This comparison contains only factual, publicly available information. All trademarks belong to their respective owners. Haul Command is not affiliated with {alt.companyLabel}.
          </p>
        </div>

        {/* CTA */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <Link href="/start" className="ag-press" style={{
            display: 'inline-flex', padding: '14px 36px', borderRadius: 12,
            background: `linear-gradient(135deg, ${gold}, #E4B872)`,
            color: '#000', fontSize: 15, fontWeight: 800, textDecoration: 'none',
          }}>
            Try Haul Command Free →
          </Link>
        </div>

        {/* Other comparisons */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', marginBottom: 12, letterSpacing: '0.1em' }}>More Comparisons</div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {Object.entries(ALTERNATIVES).filter(([s]) => s !== slug).map(([s, a]) => (
              <Link key={s} href={`/alternatives/${s}`} style={{
                padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 600,
                textDecoration: 'none', background: 'rgba(255,255,255,0.03)',
                border: `1px solid ${border}`, color: muted,
                transition: 'all 0.15s ease',
              }}>{a.companyLabel}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
