'use client';

/**
 * ADMIN DASHBOARDS HUB
 *
 * Central navigation to all admin dashboards.
 */

import Link from 'next/link';

const DASHBOARDS = [
    {
        name: 'Revenue',
        description: 'All monetization surfaces • By country • By time period',
        href: '/admin/dashboards/revenue',
        icon: '💰',
        color: '#F1A91B',
    },
    {
        name: 'Country Readiness',
        description: '120 countries • Market modes • Transition status',
        href: '/admin/dashboards/country-readiness',
        icon: '🌍',
        color: '#3B82F6',
    },
    {
        name: 'AdGrid Fill & Yield',
        description: 'Fill rates • CPM/CPC • Slot utilization',
        href: '/admin/dashboards/fill-yield',
        icon: '📊',
        color: '#22C55E',
    },
    {
        name: 'Creative Performance',
        description: 'Gemini output • A/B tests • Winner detection',
        href: '/admin/dashboards/creative-performance',
        icon: '🎨',
        color: '#8B5CF6',
    },
    {
        name: 'Distribution',
        description: 'Social engine • Posts • Funnel attribution',
        href: '/admin/dashboards/distribution',
        icon: '📡',
        color: '#F59E0B',
    },
    {
        name: 'Data Products',
        description: 'Self-serve catalog • Sales • Access patterns',
        href: '/admin/dashboards/data-products',
        icon: '📦',
        color: '#EF4444',
    },
    {
        name: 'Ad Campaigns',
        description: 'Active campaigns • Budget tracking • ROI',
        href: '/admin/ads/campaigns',
        icon: '📢',
        color: '#06B6D4',
    },
];

export default function DashboardsHub() {
    return (
        <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
            <h1 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 4 }}>Dashboards</h1>
            <p style={{ fontSize: 13, color: '#888', marginBottom: 32 }}>System-wide intelligence and revenue tracking</p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                {DASHBOARDS.map(d => (
                    <Link
                        key={d.name}
                        href={d.href}
                        style={{
                            display: 'block', textDecoration: 'none',
                            padding: '24px', borderRadius: 18,
                            border: `1px solid ${d.color}15`,
                            background: `${d.color}04`,
                            transition: 'all 0.2s ease',
                        }}
                    >
                        <div style={{ fontSize: 32, marginBottom: 12 }}>{d.icon}</div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#fff' }}>{d.name}</div>
                        <div style={{ fontSize: 12, color: '#888', marginTop: 6, lineHeight: 1.5 }}>{d.description}</div>
                        <div style={{
                            marginTop: 14, fontSize: 11, fontWeight: 700, color: d.color,
                            display: 'flex', alignItems: 'center', gap: 4,
                        }}>
                            View Dashboard →
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
}
