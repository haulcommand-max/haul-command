'use client';

/**
 * MobileFieldConsole — Band C Rank 7
 * 
 * One-thumb action bar and field shortcuts for daily mobile use.
 * Provides fast access to highest-value actions without scrolling.
 * 
 * Components:
 *   - FieldActionBar:       Sticky bottom action bar (post, search, rescue, claim, inbox)
 *   - NearbyNowModule:      Nearby loads, operators, support
 *   - SavedShortcutsModule: Favorite corridors, markets, saved searches
 *   - UrgentShortcuts:      Rescue now, urgent offers, contact operator
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

/* ── Field Action Bar ── */
export function FieldActionBar({
    unreadCount = 0,
    hasRescue = false,
}: {
    unreadCount?: number;
    hasRescue?: boolean;
}) {
    const actions = [
        { key: 'post', label: 'Post', icon: '➕', href: '/loads/post', color: '#F1A91B' },
        { key: 'search', label: 'Search', icon: '🔍', href: '/directory', color: '#3B82F6' },
        {
            key: 'rescue', label: 'Rescue', icon: '🚨', href: '/loads',
            color: hasRescue ? '#EF4444' : '#888',
            badge: hasRescue ? '!' : undefined,
        },
        { key: 'claim', label: 'Claim', icon: '✓', href: '/claim', color: '#22C55E' },
        {
            key: 'inbox', label: 'Inbox', icon: '📥', href: '#inbox',
            color: '#8B5CF6',
            badge: unreadCount > 0 ? String(unreadCount) : undefined,
        },
    ];

    return (
        <div style={{
            position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 60,
            padding: '8px 12px calc(env(safe-area-inset-bottom, 0px) + 8px)',
            background: 'rgba(6,11,18,0.95)', backdropFilter: 'blur(20px)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
        }}>
            <div style={{
                display: 'grid', gridTemplateColumns: `repeat(${actions.length}, 1fr)`, gap: 4,
                maxWidth: 400, margin: '0 auto',
            }}>
                {actions.map(a => (
                    <Link aria-label="Navigation Link"
                        key={a.key}
                        href={a.href}
                        onClick={() => {
                            track('field_action_tapped' as any, { metadata: { action: a.key } });
                        }}
                        style={{
                            display: 'flex', flexDirection: 'column', alignItems: 'center',
                            padding: '8px 4px', borderRadius: 10, textDecoration: 'none',
                            position: 'relative',
                        }}
                    >
                        <span style={{ fontSize: 20 }}>{a.icon}</span>
                        <span style={{ fontSize: 9, fontWeight: 700, color: a.color, marginTop: 2 }}>
                            {a.label}
                        </span>
                        {a.badge && (
                            <span style={{
                                position: 'absolute', top: 2, right: '20%',
                                width: 14, height: 14, borderRadius: '50%',
                                background: '#EF4444', color: '#fff',
                                fontSize: 8, fontWeight: 900,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                                {a.badge}
                            </span>
                        )}
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ── Nearby Now Module ── */
interface NearbyItem {
    id: string;
    label: string;
    detail: string;
    type: 'load' | 'operator' | 'support';
    color: string;
    icon: string;
}

export function NearbyNowModule({
    state,
}: {
    state?: string;
}) {
    const [items, setItems] = useState<NearbyItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const params = new URLSearchParams();
        if (state) params.set('state', state);

        fetch(`/api/market/heartbeat?${params}`)
            .then(r => r.ok ? r.json() : null)
            .then(data => {
                if (data) {
                    const nearbyItems: NearbyItem[] = [];
                    if (data.active_loads > 0) {
                        nearbyItems.push({
                            id: 'loads', label: `${data.active_loads} Active Loads`, detail: 'Open right now',
                            type: 'load', color: '#22C55E', icon: '📋',
                        });
                    }
                    if (data.verified_operators > 0) {
                        nearbyItems.push({
                            id: 'ops', label: `${data.verified_operators} Verified Operators`, detail: 'Ready to work',
                            type: 'operator', color: '#3B82F6', icon: '🚘',
                        });
                    }
                    setItems(nearbyItems);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, [state]);

    if (loading || items.length === 0) return null;

    return (
        <div>
            <div style={{
                fontSize: 10, fontWeight: 900, color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8,
            }}>
                Nearby Now
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {items.map(item => (
                    <div key={item.id} style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '10px 14px', borderRadius: 12,
                        background: `${item.color}05`, border: `1px solid ${item.color}10`,
                    }}>
                        <span style={{ fontSize: 16 }}>{item.icon}</span>
                        <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#fff' }}>{item.label}</div>
                            <div style={{ fontSize: 10, color: '#888' }}>{item.detail}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

/* ── Saved Shortcuts Module ── */
export function SavedShortcutsModule({
    shortcuts,
}: {
    shortcuts?: { label: string; href: string; icon: string }[];
}) {
    const defaultShortcuts = [
        { label: 'TX Loads', href: '/market/TX', icon: '🤠' },
        { label: 'Southeast Corridor', href: '/corridor/southeast-to-midwest', icon: '🛣' },
        { label: 'Directory', href: '/directory', icon: '📖' },
    ];

    const items = shortcuts && shortcuts.length > 0 ? shortcuts : defaultShortcuts;

    return (
        <div>
            <div style={{
                fontSize: 10, fontWeight: 900, color: '#888',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8,
            }}>
                Quick Access
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', scrollbarWidth: 'none' }}>
                {items.map(s => (
                    <Link aria-label="Navigation Link" key={s.href} href={s.href} style={{
                        flex: '0 0 auto', padding: '10px 16px', borderRadius: 12,
                        background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)',
                        textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <span style={{ fontSize: 14 }}>{s.icon}</span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#fff', whiteSpace: 'nowrap' }}>{s.label}</span>
                    </Link>
                ))}
            </div>
        </div>
    );
}

/* ── Urgent Shortcuts ── */
export function UrgentShortcuts({
    rescueCount = 0,
    urgentOffers = 0,
}: {
    rescueCount?: number;
    urgentOffers?: number;
}) {
    if (rescueCount === 0 && urgentOffers === 0) return null;

    return (
        <div>
            <div style={{
                fontSize: 10, fontWeight: 900, color: '#EF4444',
                textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 8,
            }}>
                ● Needs Attention
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {rescueCount > 0 && (
                    <Link aria-label="Navigation Link" href="/loads" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.12)',
                        textDecoration: 'none',
                    }}>
                        <span style={{ fontSize: 16 }}>🚨</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#EF4444' }}>
                                {rescueCount} load{rescueCount > 1 ? 's' : ''} need rescue
                            </div>
                            <div style={{ fontSize: 10, color: '#888' }}>Aging posts with low response</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#888' }}>→</span>
                    </Link>
                )}
                {urgentOffers > 0 && (
                    <Link aria-label="Navigation Link" href="#inbox" style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '12px 14px', borderRadius: 12,
                        background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.12)',
                        textDecoration: 'none',
                    }}>
                        <span style={{ fontSize: 16 }}>📥</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: '#F1A91B' }}>
                                {urgentOffers} pending offer{urgentOffers > 1 ? 's' : ''}
                            </div>
                            <div style={{ fontSize: 10, color: '#888' }}>Review before they expire</div>
                        </div>
                        <span style={{ fontSize: 12, color: '#888' }}>→</span>
                    </Link>
                )}
            </div>
        </div>
    );
}
