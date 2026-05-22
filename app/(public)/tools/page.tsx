import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';
import { buildToolAssetControl } from '@/lib/tools/tool-asset-control';
import {
  OFFICIAL_TOOL_ASSET_COUNT,
  buildToolDoorwayModel,
  getToolCoverageLabel,
  getToolLifecycleLabel,
  getToolPublicHref,
  getCanonicalToolFamily,
  getToolFamilyHubByFamily,
} from '@/lib/tools/tool-empire';
import { fetchPublicToolIndex } from '@/lib/tools/tool-registry-server';
import { HaulCommandTopicHero } from '@/components/topic-hero/HaulCommandTopicHero';
import { TOPIC_HERO_PRESETS } from '@/lib/topic-hero/configs';
import {
  contractToCollectionJsonLd,
  contractToMetadata,
  definePageSeoContract,
} from '@/lib/seo/page-seo-contract';

export const revalidate = 3600;

const FAMILIES: Record<string, { label: string; desc: string; icon: string; color: string }> = {
  rates:          { label: 'Rates & Pricing',          desc: 'Benchmarks, cost calculators, and margin tools for every move.',                icon: '\u{1F4B2}', color: '#22c55e' },
  load:           { label: 'Load Analysis',            desc: 'Dimensions, weight compliance, and classification tools.',                     icon: '\u{1F4E6}', color: '#3b82f6' },
  escort:         { label: 'Escort Intelligence',      desc: 'Requirements, matching, and compliance for pilot car operations.',             icon: '\u{1F697}', color: '#f59e0b' },
  permit:         { label: 'Permits & Authorities',    desc: 'Fees, lead times, authority contacts, and permit planning.',                   icon: '\u{1F4CB}', color: '#ef4444' },
  data:           { label: 'Market Intelligence',      desc: 'Demand signals, operator density, corridor analytics, and coverage data.',     icon: '\u{1F4CA}', color: '#8b5cf6' },
  compliance:     { label: 'Compliance & Documents',   desc: 'Checklists, verification, contracts, and regulatory alignment.',               icon: '\u{2705}',  color: '#10b981' },
  route:          { label: 'Route Compliance',         desc: 'Restrictions, clearances, curfews, and seasonal limits.',                      icon: '\u{1F6E3}', color: '#06b6d4' },
  certification:  { label: 'Certification & Training', desc: 'Timelines, reciprocity, credential requirements, and training paths.',        icon: '\u{1F393}', color: '#a78bfa' },
  claim:          { label: 'Profile & Claims',         desc: 'Verification, readiness scores, and trust signal tools for operators.',         icon: '\u{1F464}', color: '#f472b6' },
  broker:         { label: 'Broker Operations',        desc: 'Quotes, matching, pipeline management, and coordination tools.',               icon: '\u{1F91D}', color: '#fb923c' },
  enterprise:     { label: 'Enterprise & API',         desc: 'Fleet analytics, bulk exports, white-label solutions, and API demos.',          icon: '\u{1F3E2}', color: '#38bdf8' },
  localization:   { label: 'Localization',             desc: 'Country-specific rules, regional adapters, unit conversions.',                  icon: '\u{1F30D}', color: '#34d399' },
  infrastructure: { label: 'Infrastructure',           desc: 'Smart corridors, fuel stops, crane yards, and port access.',                   icon: '\u{1F3D7}', color: '#94a3b8' },
};

const SEO_INTENT_LINKS = [
  { label: 'Pilot car near me', href: '/directory?q=pilot%20car' },
  { label: 'Escort count calculator', href: '/tools/escort-count-calculator' },
  { label: 'Oversize permit cost', href: '/tools/permit-cost-calculator' },
  { label: 'Route compliance checker', href: '/tools/route-iq' },
  { label: 'Heavy haul rate advisor', href: '/tools/rate-advisor' },
  { label: 'High-pole requirements', href: '/tools/oversize-load-checker' },
  { label: 'Staging and parking support', href: '/directory?q=staging%20parking' },
  { label: 'Move support packet', href: '/loads/post?intent=support-packet' },
];

const TOOLS_HUB_SEO_CONTRACT = definePageSeoContract({
  path: '/tools',
  pageType: 'tools_hub',
  title: 'Free Heavy Haul Tools: Pilot Car, Permit, Escort & Route Calculators | Haul Command',
  metaDescription: 'Use free heavy haul tools for pilot car requirements, oversize permits, escort counts, route checks, rates, staging, and support. Coverage varies by market.',
  ogTitle: 'Free Heavy Haul Tools for Pilot Cars, Permits, Rates & Route Support',
  ogDescription: 'Check pilot car requirements, oversize permits, route compliance, rates, and provider discovery from one heavy haul tools hub. Coverage varies by market.',
  h1: 'Free Heavy Haul Tools for Pilot Cars, Permits, Rates, and Route Support',
  eyebrow: 'Free oversize load calculators / pilot car requirements / route support workflows',
  visibleIntro: 'Use Haul Command to answer the questions heavy haul teams search for every day: how many pilot cars are needed, what permits may apply, what a route might require, what support could cost, and where to find operators, staging, parking, repair, and route support near the move.',
  quickAnswer: 'Haul Command tools help brokers, carriers, dispatchers, pilot car operators, permit teams, and support locations move from a messy oversize load question into a usable next step.',
  h2Outline: [
    'Pilot Car & Escort Requirement Tools',
    'Oversize Permit & Compliance Tools',
    'Heavy Haul Rate & Cost Calculators',
    'Route Survey, High Pole & Clearance Tools',
    'Staging, Parking, Repair & Support Tools',
    'Country, State, Province & Corridor Tools',
  ],
  schemaTypes: ['CollectionPage', 'ItemList', 'BreadcrumbList'],
  primaryKeyword: 'free heavy haul tools',
  secondaryKeywords: [
    'pilot car requirements',
    'oversize permit calculator',
    'escort count calculator',
    'route compliance checker',
    'heavy haul rate calculator',
    'pilot car near me',
  ],
  entityTerms: ['pilot car', 'escort vehicle', 'oversize load', 'high pole', 'route survey', 'permit service'],
  imageFilenamePattern: 'haul-command-heavy-haul-tools-dashboard.webp',
  imageAltText: 'Haul Command heavy haul tools dashboard for pilot car, permit, route, and rate planning',
  internalLinkSlots: [
    { label: 'Pilot car near me', href: '/directory?q=pilot%20car', reason: 'near-me provider intent', pageFamily: 'directory_hub' },
    { label: 'Escort count calculator', href: '/tools/escort-count-calculator', reason: 'highest-intent calculator', pageFamily: 'tool_detail' },
    { label: 'Oversize permit cost', href: '/tools/permit-cost-calculator', reason: 'permit cost intent', pageFamily: 'tool_detail' },
    { label: 'Route compliance checker', href: '/tools/route-iq', reason: 'route planning intent', pageFamily: 'tool_detail' },
    { label: 'Heavy haul load board', href: '/loads', reason: 'demand and conversion path', pageFamily: 'load_board' },
    { label: 'Global regulations', href: '/regulations', reason: 'authority and trust path', pageFamily: 'regulation' },
  ],
  conversionCtas: [
    { label: 'Open HaulSuggest', href: '/tools/haulsuggest', intent: 'open_tool', primary: true },
    { label: 'Find Support Records', href: '/directory', intent: 'find_provider' },
    { label: 'Post a Load', href: '/loads/post', intent: 'post_load' },
    { label: 'Sponsor Tool Inventory', href: '/advertise/buy?zone=tools_hub', intent: 'sponsor_market' },
  ],
  sourceBasis: 'Supabase hc_tool_registry with shared tool-family and asset-control modeling from lib/tools/tool-empire.',
  updateFrequency: 'event_driven',
  qualityStatus: 'indexable',
  linkMagnetModules: ['embed_tool', 'share_result', 'download_checklist', 'citation_block', 'qr_code', 'share_card'],
});

const STATUS_BADGE: Record<string, { label: string; bg: string; text: string; border: string }> = {
  live_global:   { label: 'Live global framework', bg: 'rgba(34,197,94,0.12)',  text: '#4ade80', border: 'rgba(34,197,94,0.3)' },
  live_selected: { label: 'Live in selected markets', bg: 'rgba(59,130,246,0.12)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' },
  beta:          { label: 'Beta',                   bg: 'rgba(245,158,11,0.12)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' },
  coming_soon:   { label: 'In development',         bg: 'rgba(148,163,184,0.08)', text: '#94a3b8', border: 'rgba(148,163,184,0.15)' },
};

interface Tool {
  id?: string;
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
  primary_intent?: string | null;
  seo_score?: number | null;
  monetization_score?: number | null;
  trust_score?: number | null;
  thin_risk?: number | null;
  has_country_overlay?: boolean | null;
  has_state_overlay?: boolean | null;
  has_corridor_overlay?: boolean | null;
  supported_countries?: string[] | null;
  sponsor_eligible?: boolean | null;
  related_tools?: string[] | null;
  related_glossary?: string[] | null;
  related_regulations?: string[] | null;
  primary_role_targets?: string[] | null;
  primary_cta?: string | null;
  secondary_cta?: string | null;
  confidence_state?: string | null;
  schema_type?: string | null;
  canonical_url?: string | null;
  qa_status?: string | null;
  content_status?: string | null;
  placeholder_detected?: boolean | null;
  intent_mismatch?: boolean | null;
}

export const metadata: Metadata = contractToMetadata(TOOLS_HUB_SEO_CONTRACT);

export default async function ToolsPage() {
  const registryTools = (await fetchPublicToolIndex()) as Tool[];
  // Positive filter on audit fields. The previous broad public tooling path could
  // leak broken-route, placeholder, duplicate, and moved-page rows.
  const publicIndexTools = registryTools.filter((tool) => (
    (tool.status === 'live_global' || tool.status === 'live_selected')
    && tool.content_status === 'valid'
    && tool.qa_status === 'pass'
    && tool.placeholder_detected !== true
    && tool.intent_mismatch !== true
  ));
  const activeToolsBySlug = new Set(publicIndexTools.map((tool) => tool.slug));
  const allTools: Tool[] = publicIndexTools;
  const toolControls = new Map(publicIndexTools.map((tool) => [tool.slug, buildToolAssetControl(tool)]));
  const publicToolBySlug = new Map(publicIndexTools.map((tool) => [tool.slug, tool]));
  const activeCatalogCount = publicIndexTools.length;
  const indexReadyTools = publicIndexTools.filter((tool) => toolControls.get(tool.slug)?.indexable);
  const sponsorReadyCount = publicIndexTools.filter((tool) => tool.sponsor_eligible).length;

  const grouped: Record<string, Tool[]> = {};
  for (const t of allTools) {
    if (!grouped[t.family]) grouped[t.family] = [];
    grouped[t.family].push(t);
  }

  const statusOrder: Record<string, number> = { live_global: 1, live_selected: 2, beta: 3, coming_soon: 4 };
  for (const fam of Object.keys(grouped)) {
    grouped[fam].sort((a, b) => (statusOrder[a.status] ?? 9) - (statusOrder[b.status] ?? 9));
  }

  const familyOrder = Object.keys(grouped).sort((a, b) => {
    const aLive = grouped[a].filter(t => t.status !== 'coming_soon').length;
    const bLive = grouped[b].filter(t => t.status !== 'coming_soon').length;
    if (bLive !== aLive) return bLive - aLive;
    return grouped[b].length - grouped[a].length;
  });

  const officialToolCount = OFFICIAL_TOOL_ASSET_COUNT;
  const familyCount = familyOrder.length;
  const toolsHeroConfig = {
    ...TOPIC_HERO_PRESETS.toolsHub,
    quickChips: SEO_INTENT_LINKS,
    internalLinks: TOOLS_HUB_SEO_CONTRACT.internalLinkSlots.map((link) => ({
      label: link.label,
      href: link.href,
      intent: link.reason,
    })),
    statCards: [
      { val: officialToolCount, label: 'Official assets' },
      { val: activeCatalogCount, label: 'Live / beta' },
      { val: familyCount, label: 'Tool families' },
      { val: sponsorReadyCount, label: 'Sponsor paths' },
    ]
      .filter((stat) => stat.val !== 0)
      .map((stat) => ({ value: stat.val, label: stat.label })),
    relatedNextSteps: [
      { label: 'Find providers after calculating', href: '/directory', intent: 'provider_intent' },
      { label: 'Save result to load packet', href: '/load-board/post?intent=support-packet', intent: 'load_post_intent' },
      { label: 'Check related regulations', href: '/regulations', intent: 'regulation_intent' },
      { label: 'Ask Haul Command', href: '#topic-hero-ask', intent: 'ask_intent' },
      { label: 'View sponsor slots', href: '/advertise/buy?zone=tools_hub', intent: 'sponsor_intent' },
      { label: 'Upgrade to Pro', href: '/pricing', intent: 'pro_intent' },
    ],
  };

  const schemaTools = indexReadyTools.filter((t) => toolControls.get(t.slug)?.sitemapEligible);
  const toolsSchema = contractToCollectionJsonLd(
    TOOLS_HUB_SEO_CONTRACT,
    schemaTools.map((t) => ({ name: t.name, url: getToolPublicHref(t) }))
  );

  const catCounts: Record<string, number> = {};
  for (const t of allTools) {
    const cat = t.category.replace(/_/g, ' ');
    catCounts[cat] = (catCounts[cat] || 0) + 1;
  }
  const topCats = Object.entries(catCounts).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const faqCatText = topCats.map(([cat, cnt]) => `${cnt} in ${cat}`).join(', ');

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }} />

      <div style={{ background: 'transparent', minHeight: '100vh', color: '#F5F5F0' }}>

        <HaulCommandTopicHero config={toolsHeroConfig} />

        {/* Jump nav */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '28px 24px 44px' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
            {familyOrder.map(fam => {
              const meta = FAMILIES[fam];
              if (!meta) return null;
              const liveCnt = grouped[fam].filter((tool) => activeToolsBySlug.has(tool.slug)).length;
              const familyHub = getToolFamilyHubByFamily(fam);
              return (
                <a key={fam} href={familyHub ? `/tools/${familyHub.slug}` : `#family-${fam}`} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6,
                  padding: '6px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700,
                  color: meta.color, textDecoration: 'none',
                  background: `${meta.color}11`, border: `1px solid ${meta.color}22`,
                }}>
                  {meta.label}
                  {liveCnt > 0 && (
                    <span style={{ fontSize: 10, padding: '1px 6px', borderRadius: 6, background: `${meta.color}22` }}>{liveCnt}</span>
                  )}
                </a>
              );
            })}
          </div>
        </section>

        {/* Families */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 80px' }}>
          {familyOrder.map(fam => {
            const meta = FAMILIES[fam];
            if (!meta) return null;
            const familyTools = grouped[fam];
            const activeTools = familyTools.filter((tool) => activeToolsBySlug.has(tool.slug));
            const comingSoonTools = familyTools.filter((tool) => !activeToolsBySlug.has(tool.slug));

            return (
              <div key={fam} id={`family-${fam}`} style={{ marginBottom: 64, scrollMarginTop: 80 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                  <span style={{ fontSize: 24 }}>{meta.icon}</span>
                  <h2 style={{ fontSize: 22, fontWeight: 800, color: '#F5F5F0', margin: 0 }}>{meta.label}</h2>
                  <span style={{ fontSize: 11, fontWeight: 700, color: '#64748b', background: 'rgba(100,116,139,0.1)', padding: '3px 10px', borderRadius: 6 }}>
                    {familyTools.length} tools
                  </span>
                </div>
                <p style={{ fontSize: 14, color: '#64748b', marginBottom: 24, marginLeft: 36, lineHeight: 1.5 }}>{meta.desc}</p>

                {activeTools.length > 0 && (
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 280px), 1fr))', gap: 16, marginBottom: comingSoonTools.length > 0 ? 20 : 0 }}>
                    {activeTools.map(tool => {
                      const badge = STATUS_BADGE[tool.status] || STATUS_BADGE.coming_soon;
                      const doorway = buildToolDoorwayModel(tool);
                      const canonical = getCanonicalToolFamily(tool);
                      const hasPublicDestination = Boolean(tool.page_url || tool.canonical_url);
                      const publicDestination = getToolPublicHref(tool);
                      const coverageLabel = getToolCoverageLabel(tool);
                      return (
                        <div key={tool.slug} className="hc-tool-card" style={{ background: 'rgba(0,0,0,0.52)', borderRadius: 16, padding: 24, border: '1px solid rgba(198,146,58,0.16)', backdropFilter: 'blur(10px)', transition: 'border-color 0.2s, transform 0.2s, box-shadow 0.2s' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 6, background: badge.bg, color: badge.text, border: `1px solid ${badge.border}`, letterSpacing: '0.04em' }}>
                              {getToolLifecycleLabel(tool)}
                            </span>
                            {coverageLabel && (
                              <span style={{ fontSize: 10, color: '#64748b' }}>{coverageLabel}</span>
                            )}
                          </div>
                          <h3 style={{ fontSize: 16, fontWeight: 800, color: '#F5F5F0', margin: '0 0 8px' }}>{tool.name}</h3>
                          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
                            <span style={{ fontSize: 10, color: '#d8c6a3', background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.16)', borderRadius: 6, padding: '2px 7px' }}>
                              {canonical.label}
                            </span>
                            <span style={{ fontSize: 10, color: '#94a3b8', background: 'rgba(148,163,184,0.06)', border: '1px solid rgba(148,163,184,0.12)', borderRadius: 6, padding: '2px 7px' }}>
                              {doorway.indexState}
                            </span>
                          </div>
                          <p style={{ fontSize: 13, color: '#94a3b8', lineHeight: 1.6, margin: '0 0 16px', minHeight: 40 }}>
                            {tool.short_desc || 'Free heavy haul intelligence tool.'}
                          </p>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
                            {doorway.relatedTools.slice(0, 2).map((related) => {
                              const relatedTool = publicToolBySlug.get(related);
                              return relatedTool ? (
                                <Link key={related} href={getToolPublicHref(relatedTool)} style={{ fontSize: 11, color: '#64748b', textDecoration: 'none' }}>
                                  {related.replace(/-/g, ' ')}
                                </Link>
                              ) : (
                                <span key={related} style={{ fontSize: 11, color: '#4b5563' }}>
                                  {related.replace(/-/g, ' ')} coming soon
                                </span>
                              );
                            })}
                          </div>
                          {hasPublicDestination ? (
                            <Link href={publicDestination} style={{
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
                )}

                {comingSoonTools.length > 0 && (
                  <details style={{ background: 'rgba(0,0,0,0.48)', borderRadius: 12, border: '1px solid rgba(198,146,58,0.14)', overflow: 'hidden', backdropFilter: 'blur(10px)' }}>
                    <summary style={{ padding: '14px 20px', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: '#64748b', listStyle: 'none', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span className="hc-chevron" style={{ display: 'inline-block', width: 0, height: 0, borderLeft: '5px solid #64748b', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', transition: 'transform 0.2s' }} />
                      {comingSoonTools.length} more tools coming soon in {meta.label}
                    </summary>
                    <div style={{ padding: '8px 20px 16px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 240px), 1fr))', gap: 8 }}>
                      {comingSoonTools.map(tool => (
                        <div key={tool.slug} style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(148,163,184,0.04)', border: '1px solid rgba(148,163,184,0.06)' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <span style={{ fontSize: 13, fontWeight: 700, color: '#94a3b8' }}>{tool.name}</span>
                            <span style={{ fontSize: 9, fontWeight: 600, padding: '2px 7px', borderRadius: 4, background: 'rgba(148,163,184,0.08)', color: '#64748b', letterSpacing: '0.03em' }}>
                              Soon
                            </span>
                          </div>
                          {tool.short_desc && (
                            <p style={{ fontSize: 11, color: '#4b5563', margin: '4px 0 0', lineHeight: 1.4 }}>{tool.short_desc}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </details>
                )}
              </div>
            );
          })}
        </section>

        {/* Bottom CTA */}
        <section style={{ borderTop: '1px solid rgba(198,146,58,0.14)', background: 'rgba(0,0,0,0.48)', backdropFilter: 'blur(10px)' }}>
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
                background: 'linear-gradient(135deg, #C6923A, #E4B872)',
                color: '#0B0B0C', fontWeight: 800, fontSize: 13,
                textDecoration: 'none', textTransform: 'uppercase',
                letterSpacing: '0.03em',
              }}>
                Browse Data Products
              </Link>
              <Link href="/directory" style={{
                padding: '14px 32px', borderRadius: 12,
                background: 'rgba(148,163,184,0.08)',
                border: '1px solid rgba(198,146,58,0.14)',
                color: '#94a3b8', fontWeight: 700, fontSize: 13,
                textDecoration: 'none',
              }}>
                Find Support Records &rarr;
              </Link>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section style={{ maxWidth: 1200, margin: '0 auto', padding: '48px 24px' }}>
          <StaticAnswerBlock
            question="What tools does Haul Command offer for heavy haul logistics?"
            answer={`Haul Command treats ${officialToolCount} tools as linkable-asset candidates across ${familyCount} families for heavy haul logistics. Categories include: ${faqCatText}. Country, state, province, and corridor overlays are controlled by each tool's data confidence, source support, canonical intent, and useful-data gate.`}
            confidence="verified_current"
            ctaLabel="Browse All Tools"
            ctaUrl="/tools"
          />
        </section>

        <NoDeadEndBlock
          heading="Explore More Haul Command Resources"
          moves={[
            { href: '/directory', icon: '\u{1F50D}', title: 'Find Support Records', desc: 'Search by role, market, and proof state', primary: true, color: '#D4A844' },
            { href: '/claim', icon: '\u2713', title: 'Claim / Fix Profile', desc: 'Improve a claimable support record', primary: true, color: '#22C55E' },
            { href: '/escort-requirements', icon: '\u2696', title: 'State Escort Rules', desc: 'Requirements by state' },
            { href: '/regulations', icon: '\u{1F310}', title: 'Global Regulations', desc: '120 country rules' },
            { href: '/glossary/pilot-car', icon: '\u{1F4D6}', title: 'Pilot Car Glossary', desc: 'Terms and definitions' },
            { href: '/available-now', icon: '\u{1F7E2}', title: 'Available Now', desc: 'Claimed providers can broadcast availability' },
          ]}
        />

        <style dangerouslySetInnerHTML={{ __html: `
          .hc-tool-card {
            background:
              linear-gradient(180deg, rgba(0,0,0,0.58), rgba(0,0,0,0.48)) !important;
            border-color: rgba(198,146,58,0.18) !important;
            box-shadow: 0 18px 48px rgba(0,0,0,0.34), inset 0 1px 0 rgba(255,255,255,0.035);
            backdrop-filter: blur(10px);
            -webkit-backdrop-filter: blur(10px);
            animation: hcToolCardSettle 520ms ease-out both;
          }
          .hc-tool-card:hover {
            border-color: rgba(198,146,58,0.56) !important;
            transform: translateY(-3px);
            box-shadow: 0 22px 54px rgba(0,0,0,0.48), 0 0 0 1px rgba(198,146,58,0.08), 0 0 28px rgba(198,146,58,0.10);
          }
          details[open] .hc-chevron { transform: rotate(90deg); }
          details summary::-webkit-details-marker { display: none; }
          details summary::marker { display: none; content: ''; }
          @keyframes hcToolCardSettle {
            from { opacity: 0.94; transform: translateY(5px); }
            to { opacity: 1; transform: translateY(0); }
          }
          @media (prefers-reduced-motion: reduce) {
            .hc-tool-card { animation: none !important; }
            .hc-tool-card:hover { transform: none; }
          }
        `}} />
      </div>
    </>
  );
}
