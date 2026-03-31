'use client';

/**
 * SearchIntentModules — Band C Rank 6
 * 
 * Reusable modules for search intent landing pages.
 * Converts search traffic into real actions (claims, posts, searches).
 * 
 * Components:
 *   - IntentToActionBar:   Quick action buttons based on search intent
 *   - RelatedLinksModule:  Internal linking for nearby corridors/markets
 *   - ReadinessState:      Honest market mode display with actionable copy
 *   - SearchLandingHeader: SEO-optimized header with live market badge
 */

import Link from 'next/link';
import { track } from '@/lib/telemetry';

/* ── Intent-to-Action Bar ── */
interface IntentAction {
    href: string;
    label: string;
    icon: string;
    color: string;
    primary?: boolean;
}

export function IntentToActionBar({
    intent = 'general',
    state,
    corridor,
}: {
    intent?: 'load' | 'operator' | 'corridor' | 'requirements' | 'general';
    state?: string;
    corridor?: string;
}) {
    const actions: Record<string, IntentAction[]> = {
        load: [
            { href: '/loads', label: 'Browse Loads', icon: '📋', color: '#22C55E', primary: true },
            { href: '/loads/post', label: 'Post a Load', icon: '➕', color: '#F1A91B' },
            { href: '/directory', label: 'Find Operators', icon: '🔍', color: '#3B82F6' },
        ],
        operator: [
            { href: '/directory', label: 'Find Operators', icon: '🔍', color: '#22C55E', primary: true },
            { href: '/claim', label: 'Claim Profile', icon: '✓', color: '#F1A91B' },
            { href: `/market/${state || ''}`, label: 'Market Intel', icon: '📡', color: '#8B5CF6' },
        ],
        corridor: [
            { href: `/corridor/${corridor || ''}`, label: 'View Corridor', icon: '🛣', color: '#22C55E', primary: true },
            { href: '/loads', label: 'Browse Loads', icon: '📋', color: '#3B82F6' },
            { href: `/escort-requirements/${state || ''}`, label: 'State Rules', icon: '📜', color: '#F59E0B' },
        ],
        requirements: [
            { href: `/escort-requirements/${state || ''}`, label: 'Check Requirements', icon: '📜', color: '#22C55E', primary: true },
            { href: '/corridor', label: 'Browse Corridors', icon: '🛣', color: '#3B82F6' },
            { href: '/loads', label: 'View Loads', icon: '📋', color: '#F59E0B' },
        ],
        general: [
            { href: '/loads', label: 'Browse Loads', icon: '📋', color: '#22C55E' },
            { href: '/directory', label: 'Find Operators', icon: '🔍', color: '#3B82F6' },
            { href: '/claim', label: 'Claim Profile', icon: '✓', color: '#F1A91B' },
            { href: '/corridor', label: 'Corridors', icon: '🛣', color: '#8B5CF6' },
            { href: '/infrastructure', label: 'Support', icon: '🏗', color: '#14B8A6' },
        ],
    };

    const items = actions[intent] || actions.general;

    return (
        <div style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${Math.min(items.length, 5)}, 1fr)`,
            gap: 8,
        }}>
            {items.map(a => (
                <Link aria-label="Navigation Link"
                    key={a.label}
                    href={a.href}
                    onClick={() => {
                        track('search_intent_action' as any, { metadata: { intent, action: a.label, state, corridor } });
                    }}
                    style={{
                        padding: '14px 10px', borderRadius: 14, textAlign: 'center',
                        background: a.primary ? `${a.color}10` : 'rgba(255,255,255,0.02)',
                        border: `1px solid ${a.primary ? `${a.color}25` : 'rgba(255,255,255,0.06)'}`,
                        textDecoration: 'none', transition: 'all 0.1s ease',
                    }}
                >
                    <div style={{ fontSize: 20, marginBottom: 4 }}>{a.icon}</div>
                    <div style={{
                        fontSize: 10, fontWeight: 800,
                        color: a.primary ? a.color : '#fff',
                    }}>
                        {a.label}
                    </div>
                </Link>
            ))}
        </div>
    );
}

/* ── Related Links Module ── */
export function RelatedLinksModule({
    title = 'Explore Nearby',
    links,
}: {
    title?: string;
    links: { href: string; label: string; badge?: string }[];
}) {
    if (links.length === 0) return null;

    return (
        <div style={{ marginTop: 24 }}>
            <div style={{
                fontSize: 10, fontWeight: 900, color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 10,
            }}>
                {title}
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {links.map(link => (
                    <Link aria-label="Navigation Link"
                        key={link.href}
                        href={link.href}
                        style={{
                            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                            padding: '10px 14px', borderRadius: 10,
                            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)',
                            textDecoration: 'none',
                        }}
                    >
                        <span style={{ fontSize: 13, fontWeight: 600, color: '#fff' }}>{link.label}</span>
                        {link.badge && (
                            <span style={{
                                fontSize: 9, fontWeight: 800, padding: '2px 8px', borderRadius: 6,
                                background: 'rgba(241,169,27,0.08)', color: '#F1A91B',
                            }}>
                                {link.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ── Readiness State ── */
export function ReadinessState({
    mode,
    stateName,
}: {
    mode: string;
    stateName: string;
}) {
    const configs: Record<string, { color: string; label: string; desc: string; cta: { label: string; href: string } }> = {
        live: {
            color: '#22C55E', label: 'LIVE MARKET',
            desc: `Active loads and verified operators in ${stateName}. Take action now.`,
            cta: { label: 'Browse Loads', href: '/loads' },
        },
        seeding: {
            color: '#F59E0B', label: 'MARKET BUILDING',
            desc: `Operators are claiming profiles in ${stateName}. Early advantage available.`,
            cta: { label: 'Claim Profile', href: '/claim' },
        },
        demand_capture: {
            color: '#8B5CF6', label: 'DEMAND DETECTED',
            desc: `Loads flowing in ${stateName} but supply is thin. Huge operator opportunity.`,
            cta: { label: 'Claim Territory', href: '/claim' },
        },
        waitlist: {
            color: '#6B7280', label: 'COMING SOON',
            desc: `${stateName} market launching soon. Be first when it goes live.`,
            cta: { label: 'Claim Early', href: '/claim' },
        },
    };

    const config = configs[mode] || configs.waitlist;

    return (
        <div style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '10px 14px', borderRadius: 12,
            background: `${config.color}06`, border: `1px solid ${config.color}12`,
        }}>
            <div style={{
                width: 8, height: 8, borderRadius: '50%', background: config.color,
                boxShadow: `0 0 8px ${config.color}40`, flexShrink: 0,
            }} />
            <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 900, color: config.color, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                    {config.label}
                </div>
                <div style={{ fontSize: 11, color: '#bbb', marginTop: 2 }}>
                    {config.desc}
                </div>
            </div>
            <Link aria-label="Navigation Link" href={config.cta.href} style={{
                padding: '6px 12px', borderRadius: 8, fontSize: 10, fontWeight: 800,
                background: `${config.color}12`, border: `1px solid ${config.color}20`,
                color: config.color, textDecoration: 'none', whiteSpace: 'nowrap',
            }}>
                {config.cta.label}
            </Link>
        </div>
    );
}

/* ── Search Landing Header ── */
export function SearchLandingHeader({
    title,
    subtitle,
    marketMode,
    breadcrumbs,
}: {
    title: string;
    subtitle: string;
    marketMode?: string;
    breadcrumbs?: { label: string; href: string }[];
}) {
    const modeColors: Record<string, string> = {
        live: '#22C55E', seeding: '#F59E0B', demand_capture: '#8B5CF6', waitlist: '#6B7280',
    };

    return (
        <div style={{ padding: '48px 16px 24px' }}>
            {/* Breadcrumbs */}
            {breadcrumbs && breadcrumbs.length > 0 && (
                <div style={{
                    display: 'flex', gap: 6, alignItems: 'center', marginBottom: 16,
                    fontSize: 11, color: '#888',
                }}>
                    {breadcrumbs.map((bc, i) => (
                        <span key={bc.href} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                            {i > 0 && <span style={{ color: '#444' }}>›</span>}
                            <Link aria-label="Navigation Link" href={bc.href} style={{ color: '#888', textDecoration: 'none' }}>
                                {bc.label}
                            </Link>
                        </span>
                    ))}
                </div>
            )}

            {/* Market mode badge */}
            {marketMode && (
                <div style={{
                    display: 'inline-flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 999, marginBottom: 12,
                    background: `${modeColors[marketMode] || '#888'}08`,
                    border: `1px solid ${modeColors[marketMode] || '#888'}15`,
                }}>
                    <div style={{
                        width: 6, height: 6, borderRadius: '50%',
                        background: modeColors[marketMode] || '#888',
                    }} />
                    <span style={{
                        fontSize: 9, fontWeight: 900,
                        color: modeColors[marketMode] || '#888',
                        textTransform: 'uppercase', letterSpacing: '0.1em',
                    }}>
                        {marketMode.replace('_', ' ')}
                    </span>
                </div>
            )}

            <h1 style={{
                fontSize: 'clamp(1.8rem, 4vw, 2.6rem)', fontWeight: 900,
                lineHeight: 1.08, letterSpacing: '-0.03em', margin: 0, color: '#fff',
            }}>
                {title}
            </h1>
            <p style={{
                fontSize: 14, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5,
                marginTop: 8, maxWidth: 600,
            }}>
                {subtitle}
            </p>
        </div>
    );
}
