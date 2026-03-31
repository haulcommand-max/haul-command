'use client';

/**
 * RouteSupportEngine — Band D Rank 3
 * Contextual infrastructure in job/route flows.
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { track } from '@/lib/telemetry';

interface SupportLocation {
    id: string; name: string; category: string; city: string; state: string;
    services: string[]; oversize_friendly: boolean;
}

const catIcons: Record<string, { icon: string; color: string; label: string }> = {
    staging_yard: { icon: '🏗', color: '#F59E0B', label: 'Staging' },
    secure_parking: { icon: '🅿️', color: '#3B82F6', label: 'Parking' },
    escort_meetup: { icon: '📍', color: '#22C55E', label: 'Meetup' },
    oversize_hotel: { icon: '🏨', color: '#8B5CF6', label: 'Hotel' },
    installer: { icon: '🔧', color: '#14B8A6', label: 'Installer' },
    truck_repair: { icon: '🔩', color: '#EF4444', label: 'Repair' },
};

export function NearbySupportModule({ state, corridor, limit = 6, title = 'Route Support Nearby' }: {
    state?: string; corridor?: string; limit?: number; title?: string;
}) {
    const [locations, setLocations] = useState<SupportLocation[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const p = new URLSearchParams();
        if (state) p.set('state', state);
        if (corridor) p.set('corridor', corridor);
        p.set('limit', String(limit));
        fetch(`/api/infrastructure?${p}`)
            .then(r => r.ok ? r.json() : { locations: [] })
            .then(d => { setLocations(d.locations || []); setLoading(false); })
            .catch(() => setLoading(false));
    }, [state, corridor, limit]);

    useEffect(() => {
        if (!loading) track('route_support_seen' as any, { metadata: { state, corridor, count: locations.length } });
    }, [loading, locations.length, state, corridor]);

    if (loading || locations.length === 0) return null;

    return (
        <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, fontWeight: 900, color: '#fff' }}>{title}</div>
                <Link aria-label="Navigation Link" href="/infrastructure" style={{ fontSize: 10, fontWeight: 700, color: '#F1A91B', textDecoration: 'none' }}>View All →</Link>
            </div>
            <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '4px 0', scrollbarWidth: 'none' }}>
                {locations.slice(0, limit).map(loc => {
                    const cat = catIcons[loc.category] || { icon: '📍', color: '#888', label: loc.category };
                    return (
                        <div key={loc.id} style={{ flex: '0 0 auto', width: 150, padding: 12, borderRadius: 14, background: `${cat.color}04`, border: `1px solid ${cat.color}10` }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
                                <span style={{ fontSize: 14 }}>{cat.icon}</span>
                                <span style={{ fontSize: 9, fontWeight: 800, color: cat.color, textTransform: 'uppercase' }}>{cat.label}</span>
                            </div>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{loc.name}</div>
                            <div style={{ fontSize: 10, color: '#888', marginTop: 2 }}>{[loc.city, loc.state].filter(Boolean).join(', ')}</div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export function SupportBundleCTA({ bundleType = 'route', corridor, state }: {
    bundleType?: 'route' | 'preflight' | 'readiness'; corridor?: string; state?: string;
}) {
    const bundles: Record<string, { title: string; items: string[]; icon: string; color: string }> = {
        route: { title: 'Route Support Pack', icon: '🛣', color: '#6366F1', items: ['Staging yards', 'Secure parking', 'Escort meetup zones', 'Repair options'] },
        preflight: { title: 'Corridor Preflight', icon: '✈️', color: '#22C55E', items: ['State requirements', 'Installer locations', 'Escort availability', 'Rate intel'] },
        readiness: { title: 'Operator Readiness', icon: '⚡', color: '#F59E0B', items: ['Equipment check', 'Cert verification', 'Insurance status', 'Market visibility'] },
    };
    const b = bundles[bundleType];
    return (
        <div style={{ padding: '16px 18px', borderRadius: 16, background: `${b.color}04`, border: `1px solid ${b.color}10` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{ fontSize: 20 }}>{b.icon}</span>
                <div>
                    <div style={{ fontSize: 13, fontWeight: 900, color: '#fff' }}>{b.title}</div>
                    <div style={{ fontSize: 10, color: '#888' }}>{corridor ? `For ${corridor}` : state ? `In ${state}` : 'Your route'}</div>
                </div>
            </div>
            {b.items.map(item => (
                <div key={item} style={{ display: 'flex', gap: 6, alignItems: 'center', marginBottom: 2 }}>
                    <span style={{ color: b.color, fontSize: 10, fontWeight: 900 }}>›</span>
                    <span style={{ fontSize: 11, color: '#bbb' }}>{item}</span>
                </div>
            ))}
            <Link aria-label="Navigation Link" href={`/infrastructure${state ? `?state=${state}` : ''}`} onClick={() => track('support_bundle_clicked' as any, { metadata: { bundleType, corridor, state } })}
                style={{ display: 'inline-flex', marginTop: 10, padding: '8px 16px', borderRadius: 10, background: `${b.color}10`, border: `1px solid ${b.color}20`, color: b.color, fontWeight: 800, fontSize: 11, textDecoration: 'none' }}>
                Browse Support →
            </Link>
        </div>
    );
}
