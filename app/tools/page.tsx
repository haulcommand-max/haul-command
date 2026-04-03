'use client';

import React from 'react';
import Link from 'next/link';
import { AdGridSlot } from '@/components/home/AdGridSlot';
import { DataTeaserStrip } from '@/components/data/DataTeaserStrip';

const TOOLS = [
    {
        slug: 'permit-checker',
        name: 'Permit Checker',
        icon: '📋',
        tag: 'Compliance',
        tagColor: '#EF4444',
        desc: 'Instantly check permit requirements by state, load dimensions, and corridor. 50-state coverage.',
        cta: 'Check Permits →',
    },
    {
        slug: 'rate-lookup',
        name: 'Rate Lookup',
        icon: '💰',
        tag: 'Pricing',
        tagColor: '#10B981',
        desc: 'Real-time escort rate benchmarks by state and corridor. Know what the market is paying.',
        cta: 'Look Up Rates →',
    },
    {
        slug: 'state-requirements',
        name: 'State Requirements',
        icon: '🗺️',
        tag: 'Regulations',
        tagColor: '#F59E0B',
        desc: 'Quick-reference guide for pilot car certification, insurance minimums, and night travel rules.',
        cta: 'View Requirements →',
    },
    {
        slug: 'escort-calculator',
        name: 'Escort Calculator',
        icon: '🧮',
        tag: 'Planning',
        tagColor: '#3B82F6',
        desc: 'Calculate how many escorts your load requires based on dimensions, state, and route type.',
        cta: 'Calculate Escorts →',
    },
    {
        slug: 'cost-calculator',
        name: 'Cost Calculator',
        icon: '📊',
        tag: 'Budgeting',
        tagColor: '#8B5CF6',
        desc: 'Full move cost estimate including permits, escorts, fuel, hotel, and route survey fees.',
        cta: 'Estimate Cost →',
    },
    {
        slug: 'instant-quote',
        name: 'Instant Quote',
        icon: '⚡',
        tag: 'Fast',
        tagColor: '#F59E0B',
        desc: 'Get a real-time escort quote from available operators in your area. No phone calls needed.',
        cta: 'Get Quote →',
    },
    {
        slug: 'route-complexity',
        name: 'Route Complexity',
        icon: '🛣️',
        tag: 'Intelligence',
        tagColor: '#6366F1',
        desc: 'Score your route for complexity, chokepoints, permit difficulty, and operator availability.',
        cta: 'Analyze Route →',
    },
    {
        slug: 'bridge-weight',
        name: 'Bridge Weight Tool',
        icon: '🌉',
        tag: 'Engineering',
        tagColor: '#14B8A6',
        desc: 'Check bridge weight limits and posting restrictions for oversize load corridors.',
        cta: 'Check Bridges →',
    },
    {
        slug: 'compliance-copilot',
        name: 'Compliance Copilot',
        icon: '🤖',
        tag: 'AI',
        tagColor: '#EC4899',
        desc: 'AI-powered compliance assistant. Ask regulatory questions and get jurisdiction-specific answers.',
        cta: 'Ask Compliance AI →',
    },
    {
        slug: 'cross-border',
        name: 'Cross-Border Tool',
        icon: '🌐',
        tag: 'International',
        tagColor: '#0EA5E9',
        desc: 'International move planning for Canada, Mexico, EU, and Australia. Permit + escort requirements.',
        cta: 'Plan Cross-Border →',
    },
    {
        slug: 'global-command-map',
        name: 'Global Command Map',
        icon: '🗾',
        tag: 'Global',
        tagColor: '#22C55E',
        desc: 'Interactive global map of operator density, coverage gaps, and active corridors across 120 countries.',
        cta: 'Open Map →',
    },
    {
        slug: 'route-survey',
        name: 'Route Survey',
        icon: '📍',
        tag: 'Field',
        tagColor: '#F97316',
        desc: 'Submit and retrieve route survey data for upcoming oversize moves. Crowd-sourced hazard reports.',
        cta: 'Survey Route →',
    },
];

const TOOL_CATEGORIES = [
    { label: 'All Tools', filter: null },
    { label: 'Compliance', filter: 'Compliance' },
    { label: 'Pricing', filter: 'Pricing' },
    { label: 'Planning', filter: 'Planning' },
    { label: 'AI', filter: 'AI' },
    { label: 'International', filter: 'International' },
];

export default function ToolsIndexPage() {
    const [activeFilter, setActiveFilter] = React.useState<string | null>(null);

    const filtered = activeFilter
        ? TOOLS.filter(t => t.tag === activeFilter)
        : TOOLS;

    return (
        <div style={{ minHeight: '100vh', background: '#08080C', color: '#F0F0F0' }}>

            {/* Hero */}
            <section style={{ padding: '5rem 1rem 3rem', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>Free Intelligence Tools</span>
                </div>
                <h1 style={{ margin: 0, fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, letterSpacing: '-0.02em', maxWidth: 700, marginLeft: 'auto', marginRight: 'auto' }}>
                    Every Tool a Heavy Haul Operator Needs
                </h1>
                <p style={{ margin: '16px auto 0', maxWidth: 540, color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
                    Permits, rates, compliance, cost estimates, route intelligence, and AI copilot — all free, no login required.
                </p>
            </section>

            {/* Category Filter */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 16px 0', display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}>
                {TOOL_CATEGORIES.map(cat => (
                    <button
                        key={cat.label}
                        aria-label="Filter tools"
                        onClick={() => setActiveFilter(cat.filter)}
                        style={{
                            padding: '5px 16px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer',
                            background: activeFilter === cat.filter ? 'rgba(241,169,27,0.12)' : 'rgba(255,255,255,0.04)',
                            border: `1px solid ${activeFilter === cat.filter ? 'rgba(241,169,27,0.35)' : 'rgba(255,255,255,0.08)'}`,
                            color: activeFilter === cat.filter ? '#F1A91B' : '#6B7280',
                            transition: 'all 0.15s',
                        }}
                    >
                        {cat.label}
                    </button>
                ))}
            </div>

            {/* Tool Grid */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '24px 16px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 16 }}>
                    {filtered.map(tool => (
                        <Link
                            key={tool.slug}
                            href={`/tools/${tool.slug}`}
                            style={{ textDecoration: 'none' }}
                        >
                            <div style={{
                                background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)',
                                borderRadius: 16, padding: '20px', display: 'flex', flexDirection: 'column', gap: 10,
                                transition: 'all 0.15s', cursor: 'pointer', height: '100%',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(241,169,27,0.25)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.05)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLDivElement).style.borderColor = 'rgba(255,255,255,0.07)'; (e.currentTarget as HTMLDivElement).style.background = 'rgba(255,255,255,0.03)'; }}
                            >
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <span style={{ fontSize: 28 }}>{tool.icon}</span>
                                    <span style={{
                                        fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 10, letterSpacing: '0.05em',
                                        background: `${tool.tagColor}18`, color: tool.tagColor, border: `1px solid ${tool.tagColor}25`,
                                    }}>
                                        {tool.tag}
                                    </span>
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: 14, color: '#F0F0F0', marginBottom: 4 }}>{tool.name}</div>
                                    <div style={{ fontSize: 11, color: '#6B7280', lineHeight: 1.6 }}>{tool.desc}</div>
                                </div>
                                <div style={{ marginTop: 'auto', fontSize: 11, fontWeight: 700, color: '#F1A91B' }}>{tool.cta}</div>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>

            {/* Tool Sponsor Slot */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 16px' }}>
                <AdGridSlot zone="tool_sponsor" />
            </div>

            {/* Data Teaser */}
            <div style={{ maxWidth: 900, margin: '0 auto', padding: '8px 16px 48px' }}>
                <DataTeaserStrip />
            </div>
        </div>
    );
}
