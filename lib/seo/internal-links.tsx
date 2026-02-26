// ══════════════════════════════════════════════════════════════
// INTERNAL LINKING ENGINE — Hub Pages + Smart Link Blocks
// Implements hc-seo-seed-v3 authority stack rules
// ══════════════════════════════════════════════════════════════
'use client';

import React from 'react';
import Link from 'next/link';
import { PRIORITY_CITIES, getCitiesInState, STATE_NAMES_US, PROVINCE_NAMES_CA } from './city-data';

// ─── Hub Links (appear on every money page) ─────────────────
const HUB_LINKS = [
    { label: 'Pilot Car Services', href: '/directory/us', desc: 'Browse verified pilots' },
    { label: 'Pilot Car Jobs', href: '/jobs', desc: 'Find work near you' },
    { label: 'Pilot Car Directory', href: '/directory', desc: 'Full network directory' },
    { label: 'Load Board', href: '/loads', desc: 'Active loads now' },
    { label: 'Requirements by State', href: '/tools/state-requirements', desc: 'Compliance cheatsheet' },
];

export function HubLinks({ compact = false }: { compact?: boolean }) {
    if (compact) {
        return (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                {HUB_LINKS.map(l => (
                    <Link key={l.href} href={l.href} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 10, fontWeight: 700, textDecoration: 'none', background: 'rgba(241,169,27,0.08)', border: '1px solid rgba(241,169,27,0.15)', color: '#F1A91B' }}>{l.label}</Link>
                ))}
            </div>
        );
    }
    return (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 8 }}>
            {HUB_LINKS.map(l => (
                <Link key={l.href} href={l.href} style={{ display: 'block', padding: '10px 14px', borderRadius: 12, textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)', transition: 'border-color 0.15s' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: '#d1d5db', marginBottom: 2 }}>{l.label}</div>
                    <div style={{ fontSize: 10, color: '#4b5563' }}>{l.desc}</div>
                </Link>
            ))}
        </div>
    );
}

// ─── Nearby Cities Block (city → nearby cities rule) ─────────
export function NearbyCities({ currentCity, state }: { currentCity: string; state: string }) {
    const nearby = getCitiesInState(state, currentCity);
    if (nearby.length === 0) return null;
    const isCA = PROVINCE_NAMES_CA[state] !== undefined;
    const country = isCA ? 'ca' : 'us';

    return (
        <section>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Nearby Cities</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {nearby.map(c => (
                    <Link key={c.slug} href={`/directory/${country}/${state.toLowerCase()}/${c.slug}`} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: '#6b7280' }}>{c.city}</Link>
                ))}
            </div>
        </section>
    );
}

// ─── Top Cities in State (state → top cities rule) ───────────
export function TopCitiesInState({ state, country = 'us' }: { state: string; country?: 'us' | 'ca' }) {
    const stName = state.toUpperCase();
    const cities = PRIORITY_CITIES.filter(c => c.state === stName && c.isMetro).slice(0, 8);
    if (cities.length === 0) return null;

    return (
        <section>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>Top Cities in {STATE_NAMES_US[stName] || PROVINCE_NAMES_CA[stName] || stName}</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {cities.map(c => (
                    <Link key={c.slug} href={`/directory/${country}/${state.toLowerCase()}/${c.slug}`} style={{ padding: '4px 12px', borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none', background: 'rgba(241,169,27,0.06)', border: '1px solid rgba(241,169,27,0.15)', color: '#F1A91B' }}>{c.city}</Link>
                ))}
            </div>
        </section>
    );
}

// ─── Rural Radius Satellites (60mi expansion) ─────────────────
export function RuralSatellites({ satellites, state, country = 'us' }: { satellites: string[]; state: string; country?: 'us' | 'ca' }) {
    if (!satellites || satellites.length === 0) return null;

    return (
        <section>
            <h3 style={{ fontSize: 11, fontWeight: 700, color: '#4b5563', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 8 }}>Also Serving Nearby Areas</h3>
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {satellites.map((s, i) => {
                    const [satelliteCity, satelliteState] = s.split(' ');
                    const slug = satelliteCity.toLowerCase().replace(/\s+/g, '-');
                    return (
                        <Link key={i} href={`/directory/${country}/${(satelliteState || state).toLowerCase()}/${slug}`} style={{ padding: '3px 10px', borderRadius: 6, fontSize: 10, fontWeight: 600, textDecoration: 'none', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: '#4b5563' }}>{s}</Link>
                    );
                })}
            </div>
        </section>
    );
}

// ─── Authority Links (rules → services, services → jobs) ─────
export function AuthorityLinks({ type }: { type: 'money' | 'rules' | 'directory' | 'loadboard' }) {
    const maps: Record<string, { label: string; href: string }[]> = {
        money: [
            { label: 'View State Requirements', href: '/tools/state-requirements' },
            { label: 'Wide Load Laws by State', href: '/requirements' },
        ],
        rules: [
            { label: 'Find Pilot Car Services', href: '/directory' },
            { label: 'Browse Available Escorts', href: '/loads' },
        ],
        directory: [
            { label: 'Find Loads Near You', href: '/loads' },
            { label: 'Pilot Car Jobs', href: '/jobs' },
        ],
        loadboard: [
            { label: 'Become a Pilot Car Driver', href: '/jobs' },
            { label: 'Join the Directory', href: '/start' },
        ],
    };

    const links = maps[type] ?? [];
    return (
        <div style={{ display: 'flex', gap: 8 }}>
            {links.map(l => (
                <Link key={l.href} href={l.href} style={{ padding: '6px 14px', borderRadius: 8, fontSize: 11, fontWeight: 700, textDecoration: 'none', background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)', color: '#9ca3af' }}>{l.label} →</Link>
            ))}
        </div>
    );
}
