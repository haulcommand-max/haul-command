/**
 * DataTeaserCard — Contextual data product promotion
 *
 * Renders a premium intelligence teaser card on corridor, directory,
 * and rate pages to drive Data Marketplace purchases.
 *
 * Usage:
 *   <DataTeaserCard
 *       productType="corridor_snapshot"
 *       context={{ corridor: "I-10 West", country: "US" }}
 *   />
 */

import Link from 'next/link';

export type DataProductType =
    | 'corridor_snapshot'
    | 'market_report'
    | 'rate_benchmark'
    | 'competitor_tracking'
    | 'claim_gap_report';

interface DataTeaserCardProps {
    productType: DataProductType;
    context?: {
        corridor?: string;
        country?: string;
        state?: string;
        city?: string;
    };
}

const TEASER_CONFIG: Record<DataProductType, {
    icon: string;
    title: string;
    subtitle: string;
    teaserStats: string[];
    price: string;
    color: string;
}> = {
    corridor_snapshot: {
        icon: '🛣️',
        title: 'Corridor Intelligence',
        subtitle: 'Demand, supply density, and rate trends for this corridor',
        teaserStats: ['Load volume trends', 'Operator density', 'Avg escort rate', 'Seasonal patterns'],
        price: '$79/mo',
        color: '#3b82f6',
    },
    market_report: {
        icon: '📊',
        title: 'Market Intelligence Report',
        subtitle: 'Comprehensive heavy haul market analysis updated daily',
        teaserStats: ['Market heat index', 'Supply/demand ratio', 'Pricing trends', 'Growth corridors'],
        price: '$49/mo',
        color: '#8b5cf6',
    },
    rate_benchmark: {
        icon: '💰',
        title: 'Rate Benchmark Data',
        subtitle: 'Know exactly what escort rates should be for any route',
        teaserStats: ['Per-mile rates', 'Daily rates', 'Surge periods', 'Regional comparisons'],
        price: '$19',
        color: '#22c55e',
    },
    competitor_tracking: {
        icon: '🔍',
        title: 'Competitor Tracking',
        subtitle: 'Monitor operator activity, new claims, and market movements',
        teaserStats: ['New operators', 'Claim velocity', 'Coverage changes', 'Rating shifts'],
        price: '$29/mo',
        color: '#f59e0b',
    },
    claim_gap_report: {
        icon: '📍',
        title: 'Claim Gap Report',
        subtitle: 'Find unclaimed high-value listings in your service area',
        teaserStats: ['Unclaimed listings', 'Traffic volume', 'Revenue potential', 'Competition level'],
        price: '$9',
        color: '#06b6d4',
    },
};

export default function DataTeaserCard({ productType, context }: DataTeaserCardProps) {
    const config = TEASER_CONFIG[productType];
    if (!config) return null;

    const contextLabel = context?.corridor || context?.state || context?.country || '';

    return (
        <div style={{
            background: '#111114',
            border: '1px solid rgba(255,255,255,0.06)',
            borderRadius: 16,
            padding: 24,
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Top accent */}
            <div style={{
                position: 'absolute', top: 0, left: 0, right: 0, height: 2,
                background: `linear-gradient(90deg, ${config.color}, transparent)`,
                opacity: 0.5,
            }} />

            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 20 }}>{config.icon}</span>
                        <h3 style={{ fontSize: 14, fontWeight: 800, color: '#F0F0F2', margin: 0 }}>
                            {config.title}
                        </h3>
                    </div>
                    <p style={{ fontSize: 12, color: '#9CA3AF', margin: 0, lineHeight: 1.4 }}>
                        {contextLabel ? `${config.subtitle} — ${contextLabel}` : config.subtitle}
                    </p>
                </div>
                <span style={{
                    fontSize: 9, fontWeight: 800, padding: '3px 10px', borderRadius: 999,
                    background: `${config.color}15`, border: `1px solid ${config.color}30`,
                    color: config.color, textTransform: 'uppercase' as const,
                    letterSpacing: '0.06em', whiteSpace: 'nowrap',
                }}>
                    {config.price}
                </span>
            </div>

            {/* Teaser Preview Stats */}
            <div style={{
                display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 6,
                marginBottom: 16,
            }}>
                {config.teaserStats.map((stat, i) => (
                    <div key={stat} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 11, color: i < 2 ? '#D1D5DB' : '#6B7280',
                    }}>
                        <span style={{
                            width: 4, height: 4, borderRadius: '50%',
                            background: i < 2 ? config.color : 'rgba(255,255,255,0.15)',
                            flexShrink: 0,
                        }} />
                        {stat}
                        {i >= 2 && (
                            <span style={{
                                fontSize: 8, fontWeight: 700, color: '#4B5563',
                                background: 'rgba(255,255,255,0.04)',
                                padding: '1px 5px', borderRadius: 3,
                            }}>LOCKED</span>
                        )}
                    </div>
                ))}
            </div>

            {/* CTA */}
            <Link href="/data" style={{
                display: 'block', textAlign: 'center', textDecoration: 'none',
                padding: '10px 16px', borderRadius: 10,
                background: `${config.color}12`,
                border: `1px solid ${config.color}25`,
                color: config.color, fontWeight: 700, fontSize: 12,
                transition: 'all 0.2s',
            }}>
                Unlock Full Report →
            </Link>

            {/* Trust signal */}
            <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                gap: 6, marginTop: 10,
                fontSize: 10, color: '#4B5563',
            }}>
                <span style={{ color: '#22c55e', fontSize: 8 }}>●</span>
                Powered by real platform data · Updated daily
            </div>
        </div>
    );
}
