// components/ui/ProofStrip.tsx
// Trust/proof bar — embed on any money page: homepage, directory, pricing, market pages.
// Server-compatible: no 'use client' needed. Accepts static props for ISR pages.

import Link from 'next/link';

interface ProofStripProps {
    operatorCount?: number;
    countryCount?: number;
    style?: React.CSSProperties;
    variant?: 'bar' | 'compact' | 'hero';
}

export function ProofStrip({
    operatorCount,
    countryCount = 120,
    style,
    variant = 'bar',
}: ProofStripProps) {
    const items = [
        ...(operatorCount ? [{ emoji: '🟢', stat: `${operatorCount.toLocaleString()}`, label: 'verified operators', color: '#22C55E' }] : []),
        { emoji: '🌍', stat: `${countryCount}`, label: 'countries active', color: '#3B82F6' },
        { emoji: '🔒', stat: 'Escrow', label: 'protected payments', color: '#8B5CF6' },
    ];

    if (variant === 'compact') {
        return (
            <div style={{
                display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center',
                fontSize: 11, color: 'rgba(255,255,255,0.5)', fontWeight: 600,
                ...style,
            }}>
                {items.map(({ emoji, stat, label }) => (
                    <span key={label} style={{ display: 'flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}>
                        {emoji} <strong style={{ color: 'rgba(255,255,255,0.8)' }}>{stat}</strong> {label}
                    </span>
                ))}
            </div>
        );
    }

    if (variant === 'hero') {
        return (
            <div style={{
                display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap',
                padding: '16px 0', borderTop: '1px solid rgba(255,255,255,0.06)',
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                ...style,
            }}>
                {items.map(({ stat, label, color }) => (
                    <div key={label} style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: 20, fontWeight: 900, color, lineHeight: 1 }}>{stat}</div>
                        <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.4)', marginTop: 3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</div>
                    </div>
                ))}
            </div>
        );
    }

    // Default: full bar
    return (
        <div style={{
            background: 'rgba(255,255,255,0.02)',
            borderTop: '1px solid rgba(255,255,255,0.05)',
            borderBottom: '1px solid rgba(255,255,255,0.05)',
            padding: '10px 16px',
            overflowX: 'auto',
            ...style,
        }}>
            <div style={{
                display: 'flex', gap: '20px 32px', alignItems: 'center',
                justifyContent: 'center', flexWrap: 'wrap',
                maxWidth: 900, margin: '0 auto',
            }}>
                {items.map(({ emoji, stat, label, color }) => (
                    <span key={label} style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        fontSize: 12, fontWeight: 600, whiteSpace: 'nowrap',
                        color: 'rgba(255,255,255,0.55)',
                    }}>
                        <span>{emoji}</span>
                        <span style={{ color, fontWeight: 800 }}>{stat}</span>
                        <span>{label}</span>
                    </span>
                ))}
                <Link href="/claim" style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 14px', borderRadius: 999,
                    background: '#D4A844', color: '#000',
                    fontSize: 11, fontWeight: 800, textDecoration: 'none',
                    flexShrink: 0,
                }}>
                    Claim Free Listing →
                </Link>
            </div>
        </div>
    );
}
