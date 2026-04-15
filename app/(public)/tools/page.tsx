import type { Metadata } from 'next';
import Link from 'next/link';
import { StaticAnswerBlock } from '@/components/ai-search/AnswerBlock';
import '@/components/ai-search/answer-block.css';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { SponsorCard } from '@/components/monetization/SponsorCard';
import { ProofStrip } from '@/components/ui/ProofStrip';
import { NoDeadEndBlock } from '@/components/ui/NoDeadEndBlock';

export const metadata: Metadata = {
    title: 'Heavy Haul Compliance Tools & Route Calculators | Haul Command',
    description: 'Free heavy haul calculators and intelligence tools: escort cost estimator, permit calculator, route compliance checker, official source finder, regulation change log, and more. Built for operators across 50+ countries.',
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
            { '@type': 'ListItem', position: 3, name: 'Escort Calculator', url: 'https://www.haulcommand.com/tools/escort-calculator' },
            { '@type': 'ListItem', position: 4, name: 'Permit Calculator', url: 'https://www.haulcommand.com/tools/permit-calculator' },
            { '@type': 'ListItem', position: 5, name: 'Official Source Finder', url: 'https://www.haulcommand.com/tools/official-source-finder' },
            { '@type': 'ListItem', position: 6, name: 'Certification Map', url: 'https://www.haulcommand.com/tools/certification-map' },
            { '@type': 'ListItem', position: 7, name: 'Permit Authority Directory', url: 'https://www.haulcommand.com/tools/permit-authorities' },
            { '@type': 'ListItem', position: 8, name: 'Regulation Change Log', url: 'https://www.haulcommand.com/tools/regulation-change-log' },
            { '@type': 'ListItem', position: 9, name: 'Country Source Library', url: 'https://www.haulcommand.com/tools/source-library' },
            { '@type': 'ListItem', position: 10, name: 'Forms & Document Hub', url: 'https://www.haulcommand.com/forms' },
            { '@type': 'ListItem', position: 11, name: 'Backhaul Locator', url: 'https://www.haulcommand.com/backhauls' },
            { '@type': 'ListItem', position: 12, name: 'Load Type Library', url: 'https://www.haulcommand.com/tools/load-types' },
            { '@type': 'ListItem', position: 13, name: 'Permit SLA Tracker', url: 'https://www.haulcommand.com/tools/permit-sla-tracker' },
            { '@type': 'ListItem', position: 14, name: 'Corridor Pricing', url: 'https://www.haulcommand.com/tools/corridor-pricing' },
            { '@type': 'ListItem', position: 15, name: 'Certification Timelines', url: 'https://www.haulcommand.com/tools/certification-timeline' },
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
                text: 'Haul Command provides 15 free tools for heavy haul logistics including Route IQ, Rate Advisor, Escort Calculator, Permit Calculator, Official Source Finder, Certification Map, Permit Authority Directory, Regulation Change Log, Country Source Library, Forms & Document Hub, Backhaul Locator, Load Type Library, Permit SLA Tracker, Corridor Pricing, and Certification Timelines. All tools cover 50+ countries with no login required.',
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

// â”€â”€ Tool Card Data â”€â”€
const TOOLS = [
    {
        name: 'Route IQ',
        slug: '/tools/route-iq',
        icon: 'ðŸ›£ï¸',
        color: '#3b82f6',
        tagline: 'Route Compliance Checker',
        description: 'Check escort requirements, restrictions, and compliance for any oversize route across multiple states or countries.',
        badge: 'Most Popular',
    },
    {
        name: 'Rate Advisor',
        slug: '/tools/rate-advisor',
        icon: 'ðŸ’°',
        color: '#22c55e',
        tagline: 'Escort Cost Benchmarks',
        description: 'Get real-time rate benchmarks for pilot car escorts by corridor, region, and season. Stop overpaying.',
        badge: 'Free',
    },
    {
        name: 'Escort Calculator',
        slug: '/tools/escort-calculator',
        icon: 'ðŸ§®',
        color: '#C6923A',
        tagline: 'Escort Cost Estimator',
        description: 'Calculate detailed heavy haul escort vehicle costs by region, service type, and wait time using live benchmarks across 50+ countries.',
    },
    {
        name: 'Permit Calculator',
        slug: '/tools/permit-calculator',
        icon: 'ðŸ“‹',
        color: '#f59e0b',
        tagline: 'Multi-State Permit Estimator',
        description: 'Estimate permit costs, lead times, and authority contacts for oversize loads crossing multiple jurisdictions.',
    },
    {
        name: 'Official Source Finder',
        slug: '/tools/official-source-finder',
        icon: 'ðŸ›ï¸',
        color: '#10b981',
        tagline: 'Verified Government Documents',
        description: 'Locate and download verifiable DOT workbooks, official escort guidelines, and legislative code directly from global authorities.',
        badge: 'New',
    },
    {
        name: 'Certification Map',
        slug: '/tools/certification-map',
        icon: 'ðŸ—ºï¸',
        color: '#8b5cf6',
        tagline: 'Global Credential Index',
        description: 'Look up certification reciprocity, local credential requirements, and training authority paths per jurisdiction.',
    },
    {
        name: 'Permit Authority Directory',
        slug: '/tools/permit-authorities',
        icon: 'ðŸ›ï¸',
        color: '#ec4899',
        tagline: 'Direct Routing Agency Portal Links',
        description: 'A global global directory of direct routing permit portals, contact phone numbers, and operational hours.',
    },
    {
        name: 'Regulation Change Log',
        slug: '/tools/regulation-change-log',
        icon: 'ðŸ””',
        color: '#f97316',
        tagline: 'Rule Change Notifications',
        description: 'Direct visibility into daily log updates for escort regulations, size limit tweaks, and emergency route revisions.',
    },
    {
        name: 'Country Source Library',
        slug: '/tools/source-library',
        icon: 'ðŸ“š',
        color: '#06b6d4',
        tagline: 'Global Regulatory Source Map',
        description: 'A dedicated library of authoritative rule books and threshold guides per country, mapped into actionable steps.',
    },
    {
        name: 'Forms & Document Hub',
        slug: '/forms',
        icon: 'ðŸ“„',
        color: '#14b8a6',
        tagline: 'Autofill & Expiration Alerts',
        description: 'Download industry-standard Bills of Lading, Service Agreements, and store compliance documents for fast autofill.',
    },
    {
        name: 'Backhaul Locator',
        slug: '/backhauls',
        icon: 'ðŸ›£ï¸',
        color: '#8b5cf6',
        tagline: 'Repositioning Broadcasts',
        description: 'Find verified escort operators repositioning and available for return-trip loads to lower deadhead costs.',
    },
    {
        name: 'Load Type Library',
        slug: '/tools/load-types',
        icon: 'ðŸ—ƒï¸',
        color: '#3b82f6',
        tagline: 'Dimension & Escort Index',
        description: 'A comprehensive directory of oversize load types encompassing typical dimensions, escort requirements, and industry-specific traversal risks.',
        badge: 'New',
    },
    {
        name: 'Permit SLA Tracker',
        slug: '/tools/permit-sla-tracker',
        icon: 'â±ï¸',
        color: '#a855f7',
        tagline: 'Processing Time Averages',
        description: 'Live visibility into state DOT permit processing times. Don\'t let your truck sit idle at the border waiting on a superload permit.',
        badge: 'New',
    },
    {
        name: 'Corridor Pricing',
        slug: '/tools/corridor-pricing',
        icon: 'ðŸ“ˆ',
        color: '#10b981',
        tagline: 'Historical Lane Rates',
        description: 'Track real-time and historical per-mile pricing for pilot cars across major industrial transit corridors.',
        badge: 'New',
    },
    {
        name: 'Certification Timelines',
        slug: '/tools/certification-timeline',
        icon: 'ðŸŽ“',
        color: '#f59e0b',
        tagline: 'State Protocols & Cost',
        description: 'Understand exactly how long it takes and what it costs to get legally certified in each state, plus a live reciprocity matrix.',
        badge: 'New',
    },
];

export default function ToolsIndexPage() {
    return (
        <>
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(toolsSchema) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
            <ProofStrip variant="bar" />

            <div style={{ minHeight: '100vh', background: '#0B0B0C', color: '#F0F0F2' }}>
                {/* â”€â”€ Hero â”€â”€ */}
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
                                ðŸ”§ Free Tools · No Login Required
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
                                and regulation monitoring. Free. For brokers, carriers, and escorts across 50+ countries.
                            </p>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, fontSize: 13, color: '#6B7280' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>â—</span> 15 free tools
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>â—</span> 50+ countries
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>â—</span> No sign-up needed
                                </span>
                                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                                    <span style={{ color: '#22c55e' }}>â—</span> Updated daily
                                </span>
                            </div>
                        </div>
                    </div>
                </section>

                {/* â”€â”€ Tool Grid â”€â”€ */}
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
                                    Open Tool â†’
                                </div>
                            </Link>
                        ))}
                    </div>
                </section>

                {/* â”€â”€ Tool Sponsor Slot â”€â”€ */}
                <div style={{ marginTop: 32 }}>
                    <SponsorCard zone="tool" compact />
                </div>

                {/* â”€â”€ Bottom CTA â”€â”€ */}
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
                            and white-glove intelligence reports across all 50+ countries.
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
                                Find Operators â†’
                            </Link>
                        </div>
                    </div>
                </section>
            </div>

            {/* â”€â”€ AI Search Answer Block â”€â”€ */}
            <section style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
              <StaticAnswerBlock
                question="What free tools does Haul Command offer for heavy haul logistics?"
                answer="Haul Command provides 15 free tools for heavy haul logistics: Route IQ for route compliance, Rate Advisor for cost benchmarks, Escort Calculator for escort cost estimation, Permit Calculator for multi-state permits, Official Source Finder for verified government documents, Certification Map for credential requirements, Permit Authority Directory for agency contacts, Regulation Change Log for rule updates, Country Source Library for regulatory source maps, Forms & Document Hub for autofill templates, Backhaul Locator for repositioning, Load Type Library for dimension indexes, Permit SLA Tracker for processing times, Corridor Pricing for lane rate history, and Certification Timelines for state-by-state protocols. All tools cover 50+ countries."
                confidence="verified_current"
                ctaLabel="Try Route IQ — Free"
                ctaUrl="/tools/route-iq"
              />
            </section>

            {/* â”€â”€ AdGrid — Tools Page Bottom â”€â”€ */}
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px 48px' }}>
              <AdGridSlot zone="tools_bottom" />
            </div>

            <NoDeadEndBlock
              heading="Explore More Haul Command Resources"
              moves={[
                { href: '/directory', icon: 'ðŸ”', title: 'Find Verified Escorts', desc: 'Search by state and specialty', primary: true, color: '#D4A844' },
                { href: '/claim', icon: 'âœ“', title: 'Claim Your Listing', desc: 'Free for operators', primary: true, color: '#22C55E' },
                { href: '/escort-requirements', icon: 'âš–ï¸', title: 'State Escort Rules', desc: 'Requirements by state' },
                { href: '/regulations', icon: 'ðŸŒ', title: 'Global Regulations', desc: '120 country rules' },
                { href: '/glossary/pilot-car', icon: 'ðŸ“–', title: 'Pilot Car Glossary', desc: 'Terms and definitions' },
                { href: '/available-now', icon: 'ðŸŸ¢', title: 'Available Now', desc: 'Operators broadcasting live' },
              ]}
            />

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