import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

/* ── Metadata ─────────────────────────────────────────────────────────────── */

export const metadata: Metadata = {
  title: 'Heavy Haul Tools — 293 Free Calculators & Intelligence Tools',
  description:
    'Route compliance, cost estimation, permit calculators, escort requirements, market intelligence, and regulation monitoring. 293 tools across 8 categories for brokers, carriers, and escorts across 120 countries.',
  keywords:
    'heavy haul calculator, oversize load tools, escort cost calculator, permit calculator, route compliance checker, pilot car rate calculator, axle weight calculator, bridge formula, frost law tracker',
  alternates: { canonical: 'https://www.haulcommand.com/tools' },
  openGraph: {
    title: 'Heavy Haul Tools — 293 Free Calculators & Intelligence Tools',
    description:
      'Route compliance, escort calculators, permit estimators, and market intelligence for heavy haul across 120 countries.',
    url: 'https://www.haulcommand.com/tools',
    siteName: 'Haul Command',
    type: 'website',
    images: [{ url: 'https://www.haulcommand.com/og-image.jpg', width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Heavy Haul Tools — 293 Free Calculators',
    description: 'Route compliance, escort calculators, and market intelligence across 120 countries.',
  },
  other: { 'color-scheme': 'dark' },
};

/* ── Constants ─────────────────────────────────────────────────────────────── */

const FAMILY_META: Record<string, { label: string; icon: string; color: string; desc: string }> = {
  rates:          { label: 'Rates & Pricing',         icon: '\u{1F4B0}', color: '#22c55e', desc: 'Market rate benchmarks, corridor pricing, cost calculators' },
  load:           { label: 'Load Analysis',            icon: '\u{1F4E6}', color: '#3b82f6', desc: 'Dimensions, axle weights, bridge formula, oversize checks' },
  escort:         { label: 'Escort Services',          icon: '\u{1F697}', color: '#f59e0b', desc: 'Escort requirements, count calculators, service matching' },
  permit:         { label: 'Permits & Authorities',    icon: '\u{1F4CB}', color: '#ef4444', desc: 'Permit costs, lead times, authority directories, cross-border' },
  data:           { label: 'Market Intelligence',      icon: '\u{1F4CA}', color: '#8b5cf6', desc: 'Corridor demand, operator density, coverage analytics' },
  compliance:     { label: 'Compliance',               icon: '\u{2705}',  color: '#10b981', desc: 'Checklists, compliance cards, regulatory alignment' },
  route:          { label: 'Route Planning',           icon: '\u{1F5FA}', color: '#06b6d4', desc: 'Seasonal restrictions, frost laws, route complexity' },
  certification:  { label: 'Certification & Training', icon: '\u{1F393}', color: '#a78bfa', desc: 'Timelines, reciprocity, credential requirements' },
  claim:          { label: 'Claim & Profile',          icon: '\u{1F464}', color: '#C6923A', desc: 'Profile readiness, proof packets, claim verification' },
  broker:         { label: 'Broker Tools',             icon: '\u{1F91D}', color: '#f472b6', desc: 'Quote builders, carrier matching, pipeline management' },
  enterprise:     { label: 'Enterprise',               icon: '\u{1F3E2}', color: '#64748b', desc: 'Fleet analytics, data exports, white-label solutions' },
  localization:   { label: 'Localization',             icon: '\u{1F310}', color: '#38bdf8', desc: 'Region resolvers, country-specific rule adapters' },
  infrastructure: { label: 'Infrastructure',           icon: '\u{1F527}', color: '#78716c', desc: 'Smart corridors, EV/hydrogen routing, autonomous freight' },
};

const STATUS_BADGE: Record<string, { label: string; bg: string; fg: string }> = {
  live_global:   { label: 'Live \u2014 120 Countries', bg: 'rgba(34,197,94,0.15)',  fg: '#22c55e' },
  live_selected: { label: 'Live \u2014 Select Markets', bg: 'rgba(59,130,246,0.15)', fg: '#60a5fa' },
  beta:          { label: 'Beta',                       bg: 'rgba(245,158,11,0.15)', fg: '#f59e0b' },
  coming_soon:   { label: 'Coming Soon',                bg: 'rgba(100,116,139,0.12)', fg: '#64748b' },
};

const STATUS_ORDER: Record<string, number> = { live_global: 0, live_selected: 1, beta: 2, coming_soon: 3 };

/* ── Data ──────────────────────────────────────────────────────────────────── */

interface Tool {
  slug: string; name: string; short_desc: string | null;
  family: string; status: string; page_url: string | null;
  category: string; tier: string;
}

async function getTools(): Promise<Tool[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data, error } = await supabase
    .from('hc_tool_registry')
    .select('slug, name, short_desc, family, status, page_url, category, tier')
    .neq('status', 'internal_only')
    .order('name');
  if (error) { console.error('[tools] fetch error:', error.message); return []; }
  return (data ?? []) as Tool[];
}

/* ── Page ──────────────────────────────────────────────────────────────────── */

export const revalidate = 3600;

export default async function ToolsPage() {
  const tools = await getTools();
  const totalCount = tools.length;
  const liveCount = tools.filter(t => t.status === 'live_global' || t.status === 'live_selected').length;
  const betaCount = tools.filter(t => t.status === 'beta').length;

  // Group by family
  const grouped = tools.reduce<Record<string, Tool[]>>((acc, t) => {
    const f = t.family || 'other';
    if (!acc[f]) acc[f] = [];
    acc[f].push(t);
    return acc;
  }, {});

  // Sort tools within each family: live first
  Object.values(grouped).forEach(arr =>
    arr.sort((a, b) => (STATUS_ORDER[a.status] ?? 9) - (STATUS_ORDER[b.status] ?? 9))
  );

  // Sort families: most active first
  const familyOrder = Object.entries(grouped)
    .map(([fam, arr]) => ({ fam, arr, active: arr.filter(t => t.status !== 'coming_soon').length }))
    .sort((a, b) => b.active - a.active || b.arr.length - a.arr.length);

  // JSON-LD
  const liveTools = tools.filter(t => t.page_url && t.status !== 'coming_soon');
  const jsonLd = {
    '@context': 'https://schema.org', '@type': 'CollectionPage',
    name: 'Haul Command \u2014 Heavy Haul Intelligence Tools',
    description: `${totalCount} free tools for heavy haul logistics across 120 countries.`,
    url: 'https://www.haulcommand.com/tools',
    mainEntity: {
      '@type': 'ItemList', numberOfItems: liveTools.length,
      itemListElement: liveTools.map((t, i) => ({
        '@type': 'ListItem', position: i + 1, name: t.name,
        url: `https://www.haulcommand.com${t.page_url}`,
      })),
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <div style={{ background: '#0B0F14', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px 32px', textAlign: 'center' as const }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#C6923A', textTransform: 'uppercase' as const, letterSpacing: '0.12em', marginBottom: 12 }}>
            Free Tools &middot; No Login Required
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 4vw, 42px)', fontWeight: 900, color: '#F5F5F0', lineHeight: 1.15, margin: '0 0 16px' }}>
            Heavy Haul Intelligence Tools
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 680, margin: '0 auto 28px', lineHeight: 1.6 }}>
            Route compliance, cost estimation, permit calculation, market intelligence, and regulation monitoring across 120 countries.
          </p>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' as const }}>
            {[
              { n: String(totalCount), l: 'total tools' },
              { n: String(liveCount + betaCount), l: 'live now' },
              { n: '13', l: 'families' },
              { n: '120', l: 'countries' },
            ].map(s => (
              <div key={s.l} style={{ textAlign: 'center' as const }}>
                <div style={{ fontSize: 28, fontWeight: 900, color: '#C6923A' }}>{s.n}</div>
                <div style={{ fontSize: 11, color: '#64748b', textTransform: 'uppercase' as const, letterSpacing: '0.08em', fontWeight: 600 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Jump Nav */}
        <nav style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 32px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap' as const, gap: 8, justifyContent: 'center' }}>
            {familyOrder.map(({ fam, arr }) => {
              const m = FAMILY_META[fam];
              return m ? (
                <a key={fam} href={`#family-${fam}`} style={{
                  fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 8,
                  background: '#141820', border: '1px solid #1e2530', color: '#94a3b8',
                  textDecoration: 'none', whiteSpace: 'nowrap' as const,
                }}>
                  {m.icon} {m.label} ({arr.length})
                </a>
              ) : null;
            })}
          </div>
        </nav>

        {/* Family Sections */}
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 64px' }}>
          {familyOrder.map(({ fam, arr }) => {
            const meta = FAMILY_META[fam] || { label: fam, icon: '\u{1F527}', color: '#64748b', desc: '' };
            const live = arr.filter(t => t.status !== 'coming_soon');
            const soon = arr.filter(t => t.status === 'coming_soon');

            return (
              <section key={fam} id={`family-${fam}`} style={{ marginBottom: 48, scrollMarginTop: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{meta.icon}</span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F0', margin: 0 }}>{meta.label}</h2>
                  <span style={{
                    fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 99,
                    background: `${meta.color}22`, color: meta.color,
                  }}>{arr.length} tools</span>
                </div>
                <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 20px', paddingLeft: 36 }}>{meta.desc}</p>

                {live.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14, marginBottom: soon.length > 0 ? 16 : 0 }}>
                    {live.map(tool => {
                      const badge = STATUS_BADGE[tool.status] || STATUS_BADGE.coming_soon;
                      const href = tool.page_url || `/tools/${tool.slug}`;
                      return (
                        <Link key={tool.slug} href={href} className="hc-tool-card" style={{
                          display: 'block', textDecoration: 'none',
                          background: '#141820', border: '1px solid #1e2530', borderRadius: 14,
                          padding: 20, transition: 'border-color 0.2s, transform 0.2s',
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                            <h3 style={{ fontSize: 15, fontWeight: 700, color: '#F5F5F0', margin: 0, lineHeight: 1.3, paddingRight: 8 }}>{tool.name}</h3>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 6, background: badge.bg, color: badge.fg, whiteSpace: 'nowrap' as const, flexShrink: 0 }}>{badge.label}</span>
                          </div>
                          {tool.short_desc && <p style={{ fontSize: 13, color: '#94a3b8', margin: '0 0 14px', lineHeight: 1.5 }}>{tool.short_desc}</p>}
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#C6923A' }}>Open Tool &rarr;</span>
                        </Link>
                      );
                    })}
                  </div>
                )}

                {soon.length > 0 && (
                  <details style={{ marginTop: live.length > 0 ? 8 : 0 }}>
                    <summary className="hc-soon-toggle" style={{
                      cursor: 'pointer', fontSize: 12, fontWeight: 700, color: '#475569',
                      padding: '8px 0', listStyleType: 'none',
                    }}>
                      \u25B6 {soon.length} more coming soon in {meta.label}
                    </summary>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 10, marginTop: 10 }}>
                      {soon.map(tool => (
                        <div key={tool.slug} style={{
                          background: '#0f1318', border: '1px solid #1a1f28', borderRadius: 10,
                          padding: '12px 16px', opacity: 0.7,
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ fontSize: 13, fontWeight: 600, color: '#94a3b8' }}>{tool.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 7px', borderRadius: 4, background: 'rgba(100,116,139,0.12)', color: '#475569' }}>Soon</span>
                          </div>
                          {tool.short_desc && <p style={{ fontSize: 11, color: '#475569', margin: '6px 0 0', lineHeight: 1.4 }}>{tool.short_desc}</p>}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </section>
            );
          })}
        </div>

        {/* Bottom CTA */}
        <section style={{ borderTop: '1px solid #1e2530', background: '#0d1117' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px', textAlign: 'center' as const }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#F5F5F0' }}>Need a custom solution?</h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>
              Enterprise buyers can access Haul Command data via API, bulk exports, and white-glove intelligence reports across all 120 countries.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' as const }}>
              <Link href="/data-products" style={{ padding: '14px 32px', borderRadius: 12, background: 'linear-gradient(135deg, #C6923A, #E4B872)', color: '#0B0B0C', fontWeight: 800, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase' as const, letterSpacing: '0.03em' }}>Browse Data Products</Link>
              <Link href="/directory" style={{ padding: '14px 32px', borderRadius: 12, background: 'transparent', border: '1px solid #2a3040', color: '#C6923A', fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>Find Operators &rarr;</Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
          <StaticAnswerBlock
            question="What free tools does Haul Command offer for heavy haul logistics?"
            answer={`Haul Command offers ${totalCount} tools across 13 families for heavy haul logistics including route compliance, load analysis, escort services, permits, rates & pricing, market intelligence, compliance, certification, broker tools, claim & profile, enterprise, localization, and infrastructure. ${liveCount} tools are live with full 120-country coverage, ${betaCount} are in beta, and the rest are in active development. All tools are free with no login required.`}
            confidence="verified_current"
            ctaLabel="Browse All Tools"
            ctaUrl="/tools"
          />
        </section>

        <NoDeadEndBlock
          heading="Explore More Haul Command Resources"
          moves={[
            { href: '/directory', icon: '\u{1F50D}', title: 'Find Verified Escorts', desc: 'Search by state and specialty', primary: true, color: '#D4A844' },
            { href: '/claim', icon: '\u2713', title: 'Claim Your Listing', desc: 'Free for operators', primary: true, color: '#22C55E' },
            { href: '/escort-requirements', icon: '\u2696\uFE0F', title: 'State Escort Rules', desc: 'Requirements by state' },
            { href: '/regulations', icon: '\u{1F30D}', title: 'Global Regulations', desc: '120 country rules' },
            { href: '/glossary/pilot-car', icon: '\u{1F4D6}', title: 'Pilot Car Glossary', desc: 'Terms and definitions' },
            { href: '/available-now', icon: '\u{1F7E2}', title: 'Available Now', desc: 'Operators broadcasting live' },
          ]}
        />

        <style dangerouslySetInnerHTML={{ __html: `
          .hc-tool-card:hover { border-color: #C6923A !important; transform: translateY(-2px); box-shadow: 0 8px 32px rgba(198,146,58,0.08); }
          details[open] .hc-soon-toggle { color: #94a3b8; }
          .hc-soon-toggle::-webkit-details-marker { display: none; }
          .hc-soon-toggle::marker { content: ''; }
        `}} />
      </div>
    </>
  );
}
