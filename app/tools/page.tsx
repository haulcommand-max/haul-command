'use client';

import React from 'react';
import Link from 'next/link';

const TOOLS = [
    {
        title: 'Compliance Copilot',
        description: 'Ask any question about oversize load regulations — escort requirements, height poles, night travel bans, permits — for any state. Powered by Claude AI with real regulation data.',
        href: '/tools/compliance-copilot',
        icon: '⚖️', badges: ['Free', 'AI-Powered', 'All 50 States'],
        color: '#f5b942',
        featured: true,
    },
    {
        title: 'Permit Complexity Checker',
        description: 'Estimate escort needs, permit costs, and risk bands by entering load dimensions and states.',
        href: '/tools/permit-checker',
        icon: '📋', badges: ['Free', 'Instant'],
        color: '#F1A91B',
    },
    {
        title: 'Lane Rate Lookup',
        description: 'Get market-rate intelligence for any corridor, service type, and escort count.',
        href: '/tools/rate-lookup',
        icon: '💰', badges: ['Free', 'Market Data'],
        color: '#10b981',
    },
    {
        title: 'Route Complexity Calculator',
        description: 'Calculate overall route complexity, escort counts, permit lead time, and risk by selecting states and load dimensions.',
        href: '/tools/route-complexity',
        icon: '🗺️', badges: ['Free', 'Multi-State'],
        color: '#818cf8',
    },
    {
        title: 'State Requirements Cheatsheet',
        description: 'Quick-reference table of pilot car cert, equipment, insurance, and width thresholds across all states.',
        href: '/tools/state-requirements',
        icon: '📊', badges: ['Free', 'All 50 States'],
        color: '#ef4444',
    },
    {
        title: 'Geo-Fenced Compliance Sentinel (T-33)',
        description: 'Real-time GPS-based compliance monitoring. Cross-references vehicle position against jurisdiction rules to detect violations before fines.',
        href: '/tools/compliance-sentinel',
        icon: '🛰️', badges: ['Premium', 'Real-Time', '120 Countries'],
        color: '#f5b942',
        featured: true,
    },
    {
        title: 'Railroad Grade Crossing Profiler (T-34)',
        description: 'Cross-references load ground clearance against DOT crossing hump profiles and grade data to prevent high-center accidents.',
        href: '/tools/railroad-profiler',
        icon: '🚆', badges: ['Premium', 'Safety'],
        color: '#10b981',
    },
    {
        title: 'CRC Black Box Recorder (T-35)',
        description: 'Voice recording and transcription for critical operational commands (Command-Response-Confirm) with legal chain of custody.',
        href: '/tools/crc-recorder',
        icon: '🎙️', badges: ['Premium', 'Audit'],
        color: '#818cf8',
    },
    {
        title: 'Bridge Weight Overlay (T-36)',
        description: 'Cross-references axle weight and spacing against NBI and DOT bridge load capacity ratings along your route.',
        href: '/tools/bridge-weight',
        icon: '🌉', badges: ['Premium', 'Routing'],
        color: '#ef4444',
    },
    {
        title: 'Dynamic Terminology Switcher (T-37)',
        description: 'Region-aware localization converting industry terms instantly based on active jurisdiction (e.g., Pilot Car vs Abnormal Load Escort).',
        href: '/tools/terminology',
        icon: '🌐', badges: ['Premium', '120 Countries'],
        color: '#F1A91B',
    },
];

export default function ToolsLandingPage() {
    return (
        <div data-tool-interact="true" style={{ minHeight: '100vh', background: '#0a0a0f', color: '#e5e7eb', fontFamily: "'Inter', system-ui", padding: '2.5rem 1rem' }}>
            <div style={{ maxWidth: 800, margin: '0 auto' }}>
                <header style={{ textAlign: 'center', marginBottom: 48 }}>
                    <div style={{ display: 'inline-flex', gap: 6, padding: '4px 14px', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.2)', borderRadius: 20, marginBottom: 16 }}>
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#F1A91B', textTransform: 'uppercase', letterSpacing: 2 }}>⚡ Free Tools</span>
                    </div>
                    <h1 style={{ margin: 0, fontSize: 36, fontWeight: 900, color: '#f9fafb', letterSpacing: -1 }}>
                        Heavy Haul Intelligence, <span style={{ color: '#F1A91B' }}>Free</span>
                    </h1>
                    <p style={{ margin: '12px 0 0', fontSize: 15, color: '#6b7280', maxWidth: 500, marginLeft: 'auto', marginRight: 'auto', lineHeight: 1.6 }}>
                        Access 37 tools built from millions of data points across the oversize/overweight hauling industry. No account required.
                    </p>
                </header>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 16 }}>
                    {TOOLS.map(tool => (
                        <Link aria-label="Navigation Link" key={tool.href} href={tool.href} style={{ textDecoration: 'none', display: 'block' }}>
                            <div style={{
                                position: 'relative',
                                background: (tool as any).featured ? `rgba(245,185,66,0.04)` : 'rgba(255,255,255,0.03)',
                                border: `1px solid ${(tool as any).featured ? 'rgba(245,185,66,0.22)' : 'rgba(255,255,255,0.06)'}`,
                                borderRadius: 18, padding: '1.5rem', transition: 'all 0.2s', cursor: 'pointer',
                                height: '100%',
                            }}
                                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.borderColor = `${tool.color}40`; (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)'; }}
                                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.borderColor = (tool as any).featured ? 'rgba(245,185,66,0.22)' : 'rgba(255,255,255,0.06)'; (e.currentTarget as HTMLElement).style.transform = 'translateY(0)'; }}
                            >
                                {(tool as any).featured && (
                                    <div style={{
                                        position: 'absolute', top: -10, right: 16,
                                        padding: '2px 10px', borderRadius: 99,
                                        background: 'linear-gradient(135deg,#f5b942,#d97706)',
                                        fontSize: 9, fontWeight: 900, color: '#0a0f16',
                                        textTransform: 'uppercase', letterSpacing: '0.12em',
                                    }}>NEW</div>
                                )}
                                <div style={{ fontSize: 32, marginBottom: 12 }}>{tool.icon}</div>
                                <h2 style={{ margin: '0 0 8px', fontSize: 18, fontWeight: 800, color: '#f9fafb' }}>{tool.title}</h2>
                                <p style={{ margin: '0 0 16px', fontSize: 13, color: '#6b7280', lineHeight: 1.5 }}>{tool.description}</p>
                                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                                    {tool.badges.map(b => (
                                        <span key={b} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: `${tool.color}12`, color: tool.color, border: `1px solid ${tool.color}25`, textTransform: 'uppercase' }}>{b}</span>
                                    ))}
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* CTA */}
                <div style={{ textAlign: 'center', marginTop: 48 }}>
                    <p style={{ marginBottom: 16, fontSize: 13, color: '#6b7280' }}>Ready to go beyond the free tools?</p>
                    <Link aria-label="Navigation Link" href="/start" style={{ padding: '12px 32px', background: 'linear-gradient(135deg,#F1A91B,#d97706)', color: '#000', fontSize: 14, fontWeight: 800, borderRadius: 12, textDecoration: 'none' }}>Create Free Account →</Link>
                </div>
            </div>
        </div>
    );
}
