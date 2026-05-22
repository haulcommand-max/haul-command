import type { Metadata } from 'next';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const revalidate = 3600;

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const FAMILIES: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  rates: { label: 'Rates & Pricing', desc: 'Benchmarks, cost calculators, and margin tools for every move.', icon: '\u{1F4B2}', color: '#22c55e' },
  load: { label: 'Load Analysis', desc: 'Dimensions, weight compliance, and classification tools.', icon: '\u{1F4E6}', color: '#3b82f6' },
  escort: { label: 'Escort Intelligence', desc: 'Requirements, matching, and compliance for pilot car operations.', icon: '\u{1F697}', color: '#f59e0b' },
  permit: { label: 'Permits & Authorities', desc: 'Fees, lead times, authority contacts, and permit planning.', icon: '\u{1F4CB}', color: '#ef4444' },
  data: { label: 'Market Intelligence', desc: 'Demand signals, operator density, corridor analytics, and coverage data.', icon: '\u{1F4CA}', color: '#8b5cf6' },
  compliance: { label: 'Compliance & Documents', desc: 'Checklists, verification, contracts, and regulatory alignment.', icon: '\u{2705}', color: '#10b981' },
  route: { label: 'Route Compliance', desc: 'Restrictions, clearances, curfews, and seasonal limits.', icon: '\u{1F6E3}', color: '#06b6d4' },
  certification: { label: 'Certification & Training', desc: 'Timelines, reciprocity, credential requirements, and training paths.', icon: '\u{1F393}', color: '#a78bfa' },
  claim: { label: 'Profile & Claims', desc: 'Verification, readiness scores, and trust signal tools for operators.', icon: '\u{1F464}', color: '#f472b6' },
  broker: { label: 'Broker Operations', desc: 'Quotes, matching, pipeline management, and coordination tools.', icon: '\u{1F91D}', color: '#fb923c' },
  enterprise: { label: 'Enterprise & API', desc: 'Fleet analytics, bulk exports, white-label solutions, and API demos.', icon: '\u{1F3E2}', color: '#38bdf8' },
  localization: { label: 'Localization', desc: 'Country-specific rules, regional adapters, unit conversions.', icon: '\u{1F30D}', color: '#34d399' },
  infrastructure: { label: 'Infrastructure', desc: 'Smart corridors, fuel stops, crane yards, and port access.', icon: '\u{1F3D7}', color: '#94a3b8' },
};

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  live_global: { label: 'Live', bg: 'rgba(34,197,94,0.12)', text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  live_selected: { label: 'Live - Select Markets', bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
};

interface Tool {
  slug: string;
  name: string;
  status: string;
  page_url: string | null;
  family: string;
  category: string;
  short_desc: string | null;
  tier: string;
  coverage_scope: string;
  is_free: boolean;
  requires_login: boolean;
  primary_audience: string;
  content_status: string | null;
  qa_status: string | null;
  placeholder_detected: boolean | null;
  intent_mismatch: boolean | null;
}

export const metadata: Metadata = {
  title: 'Heavy Haul Tools & Calculators | Haul Command',
  description: 'Free heavy haul calculators and intelligence tools: route compliance, escort requirements, permit costs, load analysis, market intelligence, and more. Coverage varies by market.',
  keywords: 'heavy haul tools, oversize load calculator, escort cost estimator, permit cost calculator, route compliance checker, pilot car requirements, axle weight calculator, bridge formula, load dimension checker',
  alternates: { canonical: 'https://www.haulcommand.com/tools' },
  openGraph: {
    title: 'Heavy Haul Tools & Calculators | Haul Command',
    description: 'Free heavy haul intelligence tools. Route compliance, escort requirements, permit planning, load analysis, market intelligence. Coverage varies by market.',
    url: 'https://www.haulcommand.com/tools',
    siteName: 'Haul Command',
    type: 'website',
  },
  other: { 'color-scheme': 'dark' },
};

export default async function ToolsPage() {
  // Positive filter on audit fields. The previous .neq('status','internal_only')
  // leaked broken-route, placeholder, duplicate, and moved-page rows.
  const { data: tools } = await supabase
    .from('hc_tool_registry')
    .select('slug, name, status, page_url, family, category, short_desc, tier, coverage_scope, is_free, requires_login, primary_audience, content_status, qa_status, placeholder_detected, intent_mismatch')
    .in('status', ['live_global', 'live_selected'])
    .eq('content_status', 'valid')
    .eq('qa_status', 'pass')
    .eq('placeholder_detected', false)
    .eq('intent_mismatch', false)
    .order('name');

  const allTools: Tool[] = (tools ?? []) as Tool[];

  const grouped: Record<string, Tool[]> = {};
  for (const tool of allTools) {
    if (!grouped[tool.family]) grouped[tool.family] = [];
    grouped[tool.family].push(tool);
  }

  const familyOrder = Object.keys(grouped).sort((a, b) => {
    const knownA = FAMILIES[a]?.label ?? a;
    const knownB = FAMILIES[b]?.label ?? b;
    return knownA.localeCompare(knownB);
  });

  const familyCount = familyOrder.length;
  const liveTools = allTools.filter((tool) => tool.page_url);
  const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Haul Command Tools & Calculators',
    description: `${allTools.length} verified heavy haul logistics tools.`,
    url: 'https://www.haulcommand.com/tools',
    mainEntity: {
      '@type': 'ItemList',
      itemListElement: liveTools.map((tool, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        name: tool.name,
        url: `https://www.haulcommand.com${tool.page_url}`,
      })),
    },
  };

  const catCounts: Record<string, number> = {};
  for (const tool of allTools) {
    const category = tool.category.replace(/_/g, ' ');
    catCounts[category] = (catCounts[category] || 0) + 1;
  }
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const faqCatText = topCats.map(([category, count]) => `${count} in ${category}`).join(', ');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }} />

      <div style={{ background: '#0B0F14', minHeight: '100vh', color: '#F5F5F0' }}>
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 48px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C6923A', marginBottom: 16 }}>
            Free Tools &middot; No Login Required
          </p>
          <h1 style={{ fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 800, lineHeight: 1.15, marginBottom: 20, color: '#F5F5F0' }}>
            Heavy Haul Intelligence Tools
          </h1>
          <p style={{ fontSize: 16, color: '#94a3b8', maxWidth: 680, margin: '0 auto 32px', lineHeight: 1.7 }}>
            Route compliance, cost estimation, permit calculation, market intelligence,
            and regulation monitoring for markets where the data is verified.
          </p>

          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', marginBottom: 40 }}>
            {[
              { val: allTools.length, label: 'Verified Tools' },
              { val: allTools.length, label: 'Live Now' },
              { val: familyCount, label: 'Families' },
            ].map((stat) => (
              <div key={stat.label} style={{ padding: '12px 20px', borderRadius: 12, background: 'rgba(198,146,58,0.06)', border: '1px solid rgba(198,146,58,0.15)' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: '#C6923A' }}>{stat.val}</div>
                <div style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600, letterSpacing: '0.04em' }}>{stat.label}</div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {familyOrder.map((family) => {
              const meta = FAMILIES[family];
              if (!meta) return null;
              const liveCount = grouped[family].length;
              return (
                <a key={family} href={`#family-${family}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  color: meta.color, textDecoration: 'none',
                  background: `${meta.color}11`, border: `1px solid ${meta.color}22`,
                }}>
                  {meta.label}
                  <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: `${meta.color}22` }}>{liveCount}</span>
                </a>
              );
            })}
          </div>
        </section>

        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          {familyOrder.map((family) => {
            const meta = FAMILIES[family];
            if (!meta) return null;
            const familyTools = grouped[family];

            return (
              <div key={family} id={`family-${family}`} style={{ marginBottom: 64, scrollMarginTop: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{meta.icon}</span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F0', margin: 0 }}>{meta.label}</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: 'rgba(100,116,139,0.1)', padding: '3px 10px', borderRadius: 6 }}>
                    {familyTools.length} live
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, marginLeft: 36, lineHeight: 1.5 }}>{meta.desc}</p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 320px), 1fr))', gap: 16 }}>
                  {familyTools.map((tool) => {
                    const badge = STATUS_BADGE[tool.status] || STATUS_BADGE.live_selected;
                    return (
                      <div key={tool.slug} className="hc-tool-card" style={{ background: '#141820', borderRadius: 16, padding: 24, border: '1px solid #1e2530', transition: 'border-color 0.2s, transform 0.2s' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                          <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, letterSpacing: '0.04em' }}>
                            {badge.label}
                          </span>
                          <span style={{ fontSize: 10, color: '#64748b' }}>
                            {tool.coverage_scope === '120_countries' ? 'Coverage varies' : tool.coverage_scope?.replace(/_/g, ' ')}
                          </span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 800, color: '#F5F5F0', margin: '0 0 8px' }}>{tool.name}</h3>
                        <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px', minHeight: 40 }}>
                          {tool.short_desc || 'Verified heavy haul intelligence tool.'}
                        </p>
                        {tool.page_url ? (
                          <Link href={tool.page_url} style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: 'rgba(198,146,58,0.12)', color: '#C6923A',
                            border: '1px solid rgba(198,146,58,0.25)', textDecoration: 'none',
                          }}>
                            Open Tool &rarr;
                          </Link>
                        ) : (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 6,
                            padding: '10px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700,
                            background: 'rgba(148,163,184,0.06)', color: '#64748b',
                            border: '1px solid rgba(148,163,184,0.1)',
                          }}>
                            In Development
                          </span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </section>

        <section style={{ borderTop: '1px solid #1e2530', background: '#111318' }}>
          <div style={{ maxWidth: 800, margin: '0 auto', padding: '64px 24px', textAlign: 'center' }}>
            <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12, color: '#F5F5F0' }}>
              Need a custom solution?
            </h2>
            <p style={{ fontSize: 14, color: '#94a3b8', marginBottom: 24, lineHeight: 1.6 }}>
              Enterprise buyers can access Haul Command data via API, bulk exports,
              and white-glove intelligence reports where source coverage and data quality support the market.
            </p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
              <Link href="/data-products" style={{
                padding: '14px 32px', borderRadius: 12,
                background: '#C6923A', color: '#0B0F14', fontWeight: 800,
                textDecoration: 'none', fontSize: 13,
              }}>
                View Data Products &rarr;
              </Link>
              <Link href="/directory" style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'rgba(148,163,184,0.08)',
                border: '1px solid #1e2530',
                color: '#94a3b8', fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
              }}>
                Find Operators &rarr;
              </Link>
            </div>
          </div>
        </section>

        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
          <StaticAnswerBlock
            question="What tools does Haul Command offer for heavy haul logistics?"
            answer={`Haul Command currently lists ${allTools.length} verified live tools across ${familyCount} families for heavy haul logistics. Categories include: ${faqCatText || 'permit, escort, route, load, compliance, and market intelligence'}. Hidden, duplicate, placeholder, and moved tools are not shown on this public index.`}
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
            { href: '/escort-requirements', icon: '\u2696', title: 'State Escort Rules', desc: 'Requirements by state' },
            { href: '/regulations', icon: '\u{1F310}', title: 'Global Regulations', desc: 'Country and region rules' },
            { href: '/glossary/pilot-car', icon: '\u{1F4D6}', title: 'Pilot Car Glossary', desc: 'Terms and definitions' },
            { href: '/available-now', icon: '\u{1F7E2}', title: 'Available Now', desc: 'Operators broadcasting live' },
          ]}
        />

        <style dangerouslySetInnerHTML={{ __html: `
          .hc-tool-card:hover { border-color: #C6923A !important; transform: translateY(-2px); box-shadow: 0 12px 40px rgba(0,0,0,0.3); }
        `}} />
      </div>
    </>
  );
}
