import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { AdGridSlot } from '@/components/home/AdGridSlot';

export const metadata: Metadata = {
    title: 'Heavy Haul Tools & Calculators | Haul Command',
    description: 'Free heavy haul calculators and intelligence tools: escort cost estimator, permit calculator, route compliance checker, load analyzer, rate advisor, and more. Built for brokers, carriers, and pilot car operators across 120 countries.',
    alternates: {
        canonical: 'https://www.haulcommand.com/tools',
    },
};

const toolsSchema = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Haul Command Tools & Calculators',
    description: 'Free heavy haul logistics calculators and intelligence tools for the oversize/overweight transportation industry.',
    url: 'https://www.haulcommand.com/tools',
    mainEntity: {
        '@type': 'ItemList',
        itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Route IQ', url: 'https://www.haulcommand.com/tools/route-iq' },
            { '@type': 'ListItem', position: 2, name: 'Rate Advisor', url: 'https://www.haulcommand.com/tools/rate-advisor' },
            { '@type': 'ListItem', position: 3, name: 'Permit Calculator', url: 'https://www.haulcommand.com/tools/permit-calculator' },
            { '@type': 'ListItem', position: 4, name: 'Load Analyzer', url: 'https://www.haulcommand.com/tools/load-analyzer' },
            { '@type': 'ListItem', position: 5, name: 'Compliance Card', url: 'https://www.haulcommand.com/tools/compliance-card' },
            { '@type': 'ListItem', position: 6, name: 'Heavy Haul Index', url: 'https://www.haulcommand.com/tools/heavy-haul-index' },
            { '@type': 'ListItem', position: 7, name: 'Discovery Map', url: 'https://www.haulcommand.com/tools/discovery-map' },
            { '@type': 'ListItem', position: 8, name: 'Regulation Alerts', url: 'https://www.haulcommand.com/tools/regulation-alerts' },
            { '@type': 'ListItem', position: 9, name: 'Instant Quote', url: 'https://www.haulcommand.com/estimate' },
        ],
    },
};

const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
        {
            '@type': 'Question',
            name: 'What free tools does Haul Command offer?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Haul Command provides free tools for heavy haul logistics: Route IQ for compliance checking, Rate Advisor for escort cost benchmarks, Permit Calculator for multi-state permit estimation, Load Analyzer for dimension classification, Compliance Card for state-by-state requirements, Heavy Haul Market Index, Discovery Map for finding operators, and Regulation Alerts for rule changes across 120 countries.',
            },
        },
        {
            '@type': 'Question',
            name: 'How much does a pilot car cost per mile?',
            acceptedAnswer: {
                '@type': 'Answer',
                text: 'Pilot car (escort vehicle) costs typically range from $1.50 to $3.00 per mile in the United States, $1.75 to $3.50 per mile in Canada, and $2.00 to $4.00 per mile in Europe. Rates vary by urgency, route complexity, load dimensions, and seasonal demand. Use the Haul Command Rate Advisor for real-time benchmarks.',
            },
        },
    ],
};

// ── Tool Card Data ──
const TOOLS = [
    {
        name: 'Route IQ',
        slug: '/tools/route-iq',
        icon: '🛣️',
        color: '#3b82f6',
        tagline: 'Route Compliance Checker',
        description: 'Check escort requirements, restrictions, and compliance for any oversize route across multiple states or countries.',
        badge: 'Most Popular',
    },
    {
        name: 'Rate Advisor',
        slug: '/tools/rate-advisor',
        icon: '💰',
        color: '#22c55e',
        tagline: 'Escort Cost Benchmarks',
        description: 'Get real-time rate benchmarks for pilot car escorts by corridor, region, and season. Stop overpaying.',
        badge: 'Free',
    },
    {
        name: 'Permit Calculator',
        slug: '/tools/permit-calculator',
        icon: '📋',
        color: '#f59e0b',
        tagline: 'Multi-State Permit Estimator',
        description: 'Estimate permit costs, lead times, and authority contacts for oversize loads crossing multiple jurisdictions.',
    },
    {
        name: 'Load Analyzer',
        slug: '/tools/load-analyzer',
        icon: '📐',
        color: '#8b5cf6',
        tagline: 'Dimension Classification Engine',
        description: 'Enter load dimensions → get escort requirements, permit needs, route restrictions, and cost estimates instantly.',
    },
    {
        name: 'Compliance Card',
        slug: '/tools/compliance-card',
        icon: '🛡️',
        color: '#06b6d4',
        tagline: 'State-by-State Requirements',
        description: 'Generate a compliance card for any state showing escort rules, speed limits, travel time restrictions, and equipment.',
    },
    {
        name: 'Heavy Haul Index',
        slug: '/tools/heavy-haul-index',
        icon: '📊',
        color: '#ec4899',
        tagline: 'Market Intelligence Dashboard',
        description: 'Track heavy haul market activity: demand trends, supply density, corridor heat, and rate movements in real time.',
        badge: 'Live Data',
    },
    {
        name: 'Discovery Map',
        slug: '/tools/discovery-map',
        icon: '🗺️',
        color: '#14b8a6',
        tagline: 'Operator Finder',
        description: 'Find pilot car operators, escort services, and heavy haul specialists on an interactive map. Filter by service area.',
    },
    {
        name: 'Regulation Alerts',
        slug: '/tools/regulation-alerts',
        icon: '🔔',
        color: '#f97316',
        tagline: 'Rule Change Notifications',
        description: 'Get notified when escort regulations, permit rules, or travel restrictions change in your operating states or countries.',
    },
    {
        name: 'Instant Quote',
        slug: '/estimate',
        icon: '⚡',
        color: '#C6923A',
        tagline: 'Escort Cost Estimator',
        description: 'Enter load dimensions and route → get an instant escort cost estimate with coverage confidence and operator availability.',
        badge: '#1 Asked',
    },
];

export default function ToolsIndexPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

            <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#F0F0F2' }}>
                {/* ── Hero ── */}
                <section style={{
                    position: 'relative', overflow: 'hidden',
                    borderBottom: '1px solid rgba(255,255,255,0.05)',
                }}>
                    <div style={{
                        position: 'absolute', inset: 0, opacity: 0.15, pointerEvents: 'none',
                        background: 'radial-gradient(ellipse at 40% 0%, rgba(198,146,58,0.4) 0%, transparent 70%)',
                    }} />
                    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '80px 24px 64px', position: 'relative', zIndex: 1 }}>
                        <div style={{ maxWidth: 640 }}>
                            <div style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                background: 'rgba(198,146,58,0.08)', border: '1px solid rgba(198,146,58,0.20)',
                                borderRadius: 999, padding: '6px 16px',
                                fontSize: 11, fontWeight: 800, textTransform: 'uppercase' as const,
                                letterSpacing: '0.1em', color: '#C6923A', marginBottom: 24,
                            }}>
                                🔧 Free Tools · No Login Required
                            </div>
                            <h1 style={{
                                fontSize: 'clamp(32px, 5vw, 48px)', fontWeight: 900, lineHeight: 1.1,
                                letterSpacing: '-0.03em', marginBottom: 16,
                            }}>
                                Heavy Haul{' '}
                                <span style={{
                                    background: 'linear-gradient(135deg, #C6923A, #E4B872)',
                                    WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                                }}>
                                    Intelligence Tools
                                </span>
                            </h1>
                            <p style={{ fontSize: 17, color: '#9CA3AF', lineHeight: 1.6, marginBottom: 24 }}>
                                Route compliance, cost estimation, permit calculation, market intelligence,
                                and regulation monitoring. Free. For brokers, carriers, and escorts across 120 countries.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#6B7280' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>●</span> 9 free tools
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>●</span> 120 countries
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>●</span> No sign-up needed
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>●</span> Updated daily
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* ── Tool Grid ── */}
                <section style={{ maxWidth: 1200, margin: '0 auto', padding: '64px 24px' }}>
                    <div style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
                        gap: 20,
                    }}>
                        {TOOLS.map(tool => (
                            <Link
                                key={tool.slug}
                                href={tool.slug}
                                style={{
                                    display: 'flex', flexDirection: 'column', gap: 16,
                                    padding: 28, borderRadius: 16,
                                    background: '#111114',
                                    border: '1px solid rgba(255,255,255,0.06)',
                                    textDecoration: 'none', color: 'inherit',
                                    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                    position: 'relative', overflow: 'hidden',
                                }}
                                className="ag-tool-card"
                            >
                                {/* Gradient accent */}
                                <div style={{
                                    position: 'absolute', top: 0, left: 0, right: 0, height: 3,
                                    background: `linear-gradient(90deg, ${tool.color}, transparent)`,
                                    opacity: 0.6,
                                }} />

                                {/* Header */}
                                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
                                    <div style={{
                                        fontSize: 28, width: 52, height: 52,
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        borderRadius: 14,
                                        background: `${tool.color}10`,
                                        border: `1px solid ${tool.color}25`,
                                    }}>
                                        {tool.icon}
                                    </div>
                                    {tool.badge && (
                                        <span style={{
                                            fontSize: 9, fontWeight: 800, padding: '4px 10px',
                                            borderRadius: 999, textTransform: 'uppercase' as const,
                                            letterSpacing: '0.08em',
                                            background: `${tool.color}15`,
                                            border: `1px solid ${tool.color}30`,
                                            color: tool.color,
                                        }}>
                                            {tool.badge}
                                        </span>
                                    )}
                                </div>

                                {/* Content */}
                                <div>
                                    <h2 style={{ fontSize: 18, fontWeight: 800, marginBottom: 2, color: '#F9FAFB' }}>
                                        {tool.name}
                                    </h2>
                                    <div style={{ fontSize: 11, fontWeight: 700, color: tool.color, textTransform: 'uppercase' as const, letterSpacing: '0.05em', marginBottom: 8 }}>
                                        {tool.tagline}
                                    </div>
                                    <p style={{ fontSize: 13, color: '#9CA3AF', lineHeight: 1.55 }}>
                                        {tool.description}
                                    </p>
                                </div>

                                {/* CTA */}
                                <div style={{
                                    marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 6,
                                    fontSize: 12, fontWeight: 700, color: tool.color,
                                }}>
                                    Open Tool →
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* ── Bottom CTA ── */}
                <section style={{
                    borderTop: '1px solid rgba(255,255,255,0.05)',
                    background: '#0f0f12',
                }}>
                    <div style={{
                        maxWidth: 800, margin: '0 auto', padding: '64px 24px',
                        textAlign: 'center',
                    }}>
                        <h2 style={{ fontSize: 24, fontWeight: 800, marginBottom: 12 }}>
                            Need a custom solution?
                        </h2>
                        <p style={{ fontSize: 14, color: '#9CA3AF', marginBottom: 24, lineHeight: 1.6 }}>
                            Enterprise buyers can access Haul Command data via API, bulk exports,
                            and white-glove intelligence reports across all 120 countries.
                        </p>
                        <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                            <Link href="/data" style={{
                                padding: '14px 32px', borderRadius: 12,
                                background: 'linear-gradient(135deg, #C6923A, #E4B872)',
                                color: '#0B0B0C', fontWeight: 800, fontSize: 13,
                                textDecoration: 'none', textTransform: 'uppercase' as const,
                                letterSpacing: '0.03em',
                            }}>
                                Browse Data Products
                            </Link>
                            <Link href="/directory" style={{
                                padding: '14px 32px', borderRadius: 12,
                                background: 'rgba(255,255,255,0.05)',
                                border: '1px solid rgba(255,255,255,0.10)',
                                color: '#F0F0F2', fontWeight: 700, fontSize: 13,
                                textDecoration: 'none',
                            }}>
                                Find Operators →
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {/* ── AI Search Answer Block ── */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
              <StaticAnswerBlock
                question="What free tools does Haul Command offer for heavy haul logistics?"
                answer="Haul Command provides 9 free tools for heavy haul logistics: Route IQ for compliance checking, Rate Advisor for escort cost benchmarks, Permit Calculator for multi-state permit estimation, Load Analyzer for dimension classification, Compliance Card for state-by-state requirements, Heavy Haul Market Index, Discovery Map for operator finding, Regulation Alerts, and Instant Quote for escort cost estimation. All tools cover 120 countries."
                confidence="verified_current"
                ctaLabel="Try Route IQ — Free"
                ctaUrl="/tools/route-iq"
              />
            </section>

            {/* ── AdGrid — Tools Page Bottom ── */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
              <AdGridSlot zone="tools_bottom" />
            </div>

            {/* Hover animation style */}
            <style dangerouslySetInnerHTML={{ __html: `
                .ag-tool-card:hover {
                    border-color: rgba(255,255,255,0.14) !important;
                    transform: translateY(-2px);
                    box-shadow: 0 12px 40px rgba(0,0,0,0.4);
                }
            `}} />
        </>
    );
}
