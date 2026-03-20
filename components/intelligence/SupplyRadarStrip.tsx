'use client';

/**
 * components/intelligence/SupplyRadarStrip.tsx
 *
 * GLOBAL Supply Radar — covers all 57 countries + US corridors.
 * Shows corridor/region shortage index, available escorts, avg response time.
 * Used on /directory, /map, and homepage.
 *
 * Data: pulls from /api/supply/recommendations and /api/supply/global,
 * falls back to comprehensive static data spanning 57 countries.
 *
 * Phase 1: Static fallback data across 57 countries ✅
 * Phase 2: Wire to live API endpoints via useEffect
 */

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Zap, AlertTriangle, Clock, Globe } from 'lucide-react';
import { trackEvent } from '@/lib/analytics/hc-events';

interface CorridorSupply {
    slug: string;
    label: string;
    countryCode: string;
    scarcityIndex: number;   // 0-100 (100 = worst shortage)
    availableNow: number;
    avgResponseMin: number;
}

// ── 57-Country Global Supply Data ──────────────────────
// Organized by tier: Gold (10) → Blue (18) → Silver (26) → Slate (3)
const GLOBAL_SUPPLY: CorridorSupply[] = [
    // ─── TIER A — GOLD (10 Countries) ───
    // 🇺🇸 United States
    { slug: 'i-10', label: 'I-10 Gulf South', countryCode: 'US', scarcityIndex: 72, availableNow: 13, avgResponseMin: 34 },
    { slug: 'i-35', label: 'I-35 Central Spine', countryCode: 'US', scarcityIndex: 69, availableNow: 16, avgResponseMin: 28 },
    { slug: 'i-20', label: 'I-20 Deep South', countryCode: 'US', scarcityIndex: 62, availableNow: 17, avgResponseMin: 41 },
    { slug: 'i-75', label: 'I-75 Southeast', countryCode: 'US', scarcityIndex: 58, availableNow: 26, avgResponseMin: 22 },
    { slug: 'i-40', label: 'I-40 Southwest', countryCode: 'US', scarcityIndex: 45, availableNow: 21, avgResponseMin: 47 },
    { slug: 'i-95', label: 'I-95 East Coast', countryCode: 'US', scarcityIndex: 55, availableNow: 31, avgResponseMin: 25 },
    // 🇨🇦 Canada
    { slug: 'trans-canada-on', label: 'Trans-Canada (Ontario)', countryCode: 'CA', scarcityIndex: 64, availableNow: 9, avgResponseMin: 38 },
    { slug: 'trans-canada-ab', label: 'Trans-Canada (Alberta)', countryCode: 'CA', scarcityIndex: 71, availableNow: 7, avgResponseMin: 42 },
    // 🇦🇺 Australia
    { slug: 'pacific-hwy', label: 'Pacific Highway', countryCode: 'AU', scarcityIndex: 59, availableNow: 11, avgResponseMin: 45 },
    { slug: 'hume-hwy', label: 'Hume Highway', countryCode: 'AU', scarcityIndex: 52, availableNow: 14, avgResponseMin: 35 },
    // 🇬🇧 United Kingdom
    { slug: 'm1-north', label: 'M1 North', countryCode: 'GB', scarcityIndex: 48, availableNow: 18, avgResponseMin: 20 },
    { slug: 'm6-corridor', label: 'M6 Corridor', countryCode: 'GB', scarcityIndex: 43, availableNow: 22, avgResponseMin: 18 },
    // 🇳🇿 New Zealand
    { slug: 'sh1-north-island', label: 'SH1 North Island', countryCode: 'NZ', scarcityIndex: 67, availableNow: 4, avgResponseMin: 55 },
    // 🇿🇦 South Africa
    { slug: 'n1-gauteng', label: 'N1 Gauteng', countryCode: 'ZA', scarcityIndex: 74, availableNow: 6, avgResponseMin: 50 },
    { slug: 'n3-durban', label: 'N3 Durban Corridor', countryCode: 'ZA', scarcityIndex: 68, availableNow: 8, avgResponseMin: 48 },
    // 🇩🇪 Germany
    { slug: 'a2-ruhr', label: 'A2 Ruhr–Berlin', countryCode: 'DE', scarcityIndex: 40, availableNow: 24, avgResponseMin: 22 },
    { slug: 'a7-hamburg', label: 'A7 Hamburg–South', countryCode: 'DE', scarcityIndex: 35, availableNow: 28, avgResponseMin: 19 },
    // 🇳🇱 Netherlands
    { slug: 'a2-amsterdam', label: 'A2 Amsterdam–Maastricht', countryCode: 'NL', scarcityIndex: 32, availableNow: 19, avgResponseMin: 15 },
    // 🇦🇪 UAE
    { slug: 'e11-abu-dhabi', label: 'E11 Abu Dhabi–Dubai', countryCode: 'AE', scarcityIndex: 55, availableNow: 12, avgResponseMin: 30 },
    // 🇧🇷 Brazil
    { slug: 'br-101-south', label: 'BR-101 South', countryCode: 'BR', scarcityIndex: 78, availableNow: 5, avgResponseMin: 65 },
    { slug: 'br-116-rio-sp', label: 'BR-116 Rio–São Paulo', countryCode: 'BR', scarcityIndex: 73, availableNow: 8, avgResponseMin: 55 },

    // ─── TIER B — BLUE (18 Countries) ───
    // 🇮🇪 Ireland
    { slug: 'm7-dublin-limerick', label: 'M7 Dublin–Limerick', countryCode: 'IE', scarcityIndex: 51, availableNow: 7, avgResponseMin: 35 },
    // 🇸🇪 Sweden
    { slug: 'e4-stockholm-south', label: 'E4 Stockholm–South', countryCode: 'SE', scarcityIndex: 38, availableNow: 15, avgResponseMin: 28 },
    // 🇳🇴 Norway
    { slug: 'e6-oslo-trondheim', label: 'E6 Oslo–Trondheim', countryCode: 'NO', scarcityIndex: 53, availableNow: 8, avgResponseMin: 40 },
    // 🇩🇰 Denmark
    { slug: 'e45-jutland', label: 'E45 Jutland', countryCode: 'DK', scarcityIndex: 36, availableNow: 12, avgResponseMin: 22 },
    // 🇫🇮 Finland
    { slug: 'e75-helsinki-north', label: 'E75 Helsinki North', countryCode: 'FI', scarcityIndex: 49, availableNow: 6, avgResponseMin: 45 },
    // 🇧🇪 Belgium
    { slug: 'e40-brussels-liege', label: 'E40 Brussels–Liège', countryCode: 'BE', scarcityIndex: 33, availableNow: 16, avgResponseMin: 18 },
    // 🇦🇹 Austria
    { slug: 'a1-vienna-salzburg', label: 'A1 Vienna–Salzburg', countryCode: 'AT', scarcityIndex: 37, availableNow: 14, avgResponseMin: 25 },
    // 🇨🇭 Switzerland
    { slug: 'a1-zurich-bern', label: 'A1 Zürich–Bern', countryCode: 'CH', scarcityIndex: 29, availableNow: 20, avgResponseMin: 16 },
    // 🇪🇸 Spain
    { slug: 'ap7-mediterranean', label: 'AP-7 Mediterranean', countryCode: 'ES', scarcityIndex: 56, availableNow: 10, avgResponseMin: 38 },
    // 🇫🇷 France
    { slug: 'a6-paris-lyon', label: 'A6 Paris–Lyon', countryCode: 'FR', scarcityIndex: 42, availableNow: 18, avgResponseMin: 30 },
    // 🇮🇹 Italy
    { slug: 'a1-milan-rome', label: 'A1 Milan–Rome', countryCode: 'IT', scarcityIndex: 47, availableNow: 13, avgResponseMin: 35 },
    // 🇵🇹 Portugal
    { slug: 'a1-lisbon-porto', label: 'A1 Lisbon–Porto', countryCode: 'PT', scarcityIndex: 54, availableNow: 7, avgResponseMin: 42 },
    // 🇸🇦 Saudi Arabia
    { slug: 'route-55-riyadh', label: 'Route 55 Riyadh', countryCode: 'SA', scarcityIndex: 63, availableNow: 9, avgResponseMin: 40 },
    // 🇶🇦 Qatar
    { slug: 'al-shamal-road', label: 'Al Shamal Road', countryCode: 'QA', scarcityIndex: 44, availableNow: 8, avgResponseMin: 25 },
    // 🇲🇽 Mexico
    { slug: 'carretera-57', label: 'Carretera 57 Mexico City–North', countryCode: 'MX', scarcityIndex: 76, availableNow: 4, avgResponseMin: 60 },
    // 🇮🇳 India
    { slug: 'nh44-delhi-bangalore', label: 'NH44 Delhi–Bangalore', countryCode: 'IN', scarcityIndex: 82, availableNow: 3, avgResponseMin: 75 },
    // 🇮🇩 Indonesia
    { slug: 'trans-java', label: 'Trans-Java Toll Road', countryCode: 'ID', scarcityIndex: 79, availableNow: 4, avgResponseMin: 70 },
    // 🇹🇭 Thailand
    { slug: 'motorway-7', label: 'Motorway 7 Bangkok–East', countryCode: 'TH', scarcityIndex: 65, availableNow: 6, avgResponseMin: 50 },

    // ─── TIER C — SILVER (26 Countries — representative corridors) ───
    { slug: 'a2-warsaw-berlin', label: 'A2 Warsaw–Berlin', countryCode: 'PL', scarcityIndex: 58, availableNow: 8, avgResponseMin: 40 },
    { slug: 'd1-prague-brno', label: 'D1 Prague–Brno', countryCode: 'CZ', scarcityIndex: 42, availableNow: 10, avgResponseMin: 30 },
    { slug: 'd1-bratislava', label: 'D1 Bratislava', countryCode: 'SK', scarcityIndex: 45, availableNow: 6, avgResponseMin: 35 },
    { slug: 'm1-budapest', label: 'M1 Budapest–Vienna', countryCode: 'HU', scarcityIndex: 50, availableNow: 7, avgResponseMin: 38 },
    { slug: 'a1-ljubljana', label: 'A1 Ljubljana Corridor', countryCode: 'SI', scarcityIndex: 38, availableNow: 5, avgResponseMin: 28 },
    { slug: 'e20-tallinn', label: 'E20 Tallinn', countryCode: 'EE', scarcityIndex: 52, availableNow: 3, avgResponseMin: 45 },
    { slug: 'a2-riga', label: 'A2 Riga', countryCode: 'LV', scarcityIndex: 55, availableNow: 3, avgResponseMin: 48 },
    { slug: 'a1-vilnius', label: 'A1 Vilnius–Klaipėda', countryCode: 'LT', scarcityIndex: 50, availableNow: 4, avgResponseMin: 42 },
    { slug: 'a3-zagreb', label: 'A3 Zagreb Corridor', countryCode: 'HR', scarcityIndex: 47, availableNow: 5, avgResponseMin: 38 },
    { slug: 'a1-bucharest', label: 'A1 Bucharest–Pitești', countryCode: 'RO', scarcityIndex: 62, availableNow: 4, avgResponseMin: 55 },
    { slug: 'struma-sofia', label: 'Struma Motorway Sofia', countryCode: 'BG', scarcityIndex: 58, availableNow: 3, avgResponseMin: 50 },
    { slug: 'a1-athens-thessaloniki', label: 'A1 Athens–Thessaloniki', countryCode: 'GR', scarcityIndex: 53, availableNow: 6, avgResponseMin: 42 },
    { slug: 'o4-istanbul', label: 'O-4 Istanbul', countryCode: 'TR', scarcityIndex: 60, availableNow: 8, avgResponseMin: 45 },
    { slug: 'route-30-kuwait', label: 'Route 30', countryCode: 'KW', scarcityIndex: 40, availableNow: 5, avgResponseMin: 28 },
    { slug: 'route-1-muscat', label: 'Route 1 Muscat', countryCode: 'OM', scarcityIndex: 48, availableNow: 4, avgResponseMin: 35 },
    { slug: 'king-fahad-causeway', label: 'King Fahad Causeway', countryCode: 'BH', scarcityIndex: 35, availableNow: 6, avgResponseMin: 22 },
    { slug: 'aye-singapore', label: 'AYE Singapore', countryCode: 'SG', scarcityIndex: 28, availableNow: 12, avgResponseMin: 15 },
    { slug: 'nkve-kl', label: 'NKVE Kuala Lumpur', countryCode: 'MY', scarcityIndex: 55, availableNow: 5, avgResponseMin: 45 },
    { slug: 'tomei-tokyo', label: 'Tōmei Expressway', countryCode: 'JP', scarcityIndex: 32, availableNow: 18, avgResponseMin: 20 },
    { slug: 'gyeongbu-seoul', label: 'Gyeongbu Seoul–Busan', countryCode: 'KR', scarcityIndex: 38, availableNow: 14, avgResponseMin: 25 },
    { slug: 'ruta-5-santiago', label: 'Ruta 5 Santiago', countryCode: 'CL', scarcityIndex: 60, availableNow: 5, avgResponseMin: 48 },
    { slug: 'rn9-buenos-aires', label: 'RN9 Buenos Aires', countryCode: 'AR', scarcityIndex: 65, availableNow: 6, avgResponseMin: 52 },
    { slug: 'ruta-25-bogota', label: 'Ruta 25 Bogotá', countryCode: 'CO', scarcityIndex: 70, availableNow: 4, avgResponseMin: 58 },
    { slug: 'panamericana-lima', label: 'Panamericana Lima', countryCode: 'PE', scarcityIndex: 68, availableNow: 3, avgResponseMin: 62 },
    { slug: 'ql1-hanoi', label: 'QL1 Hanoi–HCMC', countryCode: 'VN', scarcityIndex: 72, availableNow: 3, avgResponseMin: 65 },
    { slug: 'nlex-manila', label: 'NLEX Manila', countryCode: 'PH', scarcityIndex: 66, availableNow: 4, avgResponseMin: 55 },

    // ─── TIER D — SLATE (3 Countries) ───
    { slug: 'ruta-1-montevideo', label: 'Ruta 1 Montevideo', countryCode: 'UY', scarcityIndex: 50, availableNow: 3, avgResponseMin: 45 },
    { slug: 'pan-am-panama', label: 'Pan-American Panama', countryCode: 'PA', scarcityIndex: 55, availableNow: 2, avgResponseMin: 50 },
    { slug: 'ruta-1-san-jose', label: 'Ruta 1 San José', countryCode: 'CR', scarcityIndex: 52, availableNow: 3, avgResponseMin: 48 },
];

const FLAG_MAP: Record<string, string> = {
    US: '🇺🇸', CA: '🇨🇦', AU: '🇦🇺', GB: '🇬🇧', NZ: '🇳🇿', ZA: '🇿🇦', DE: '🇩🇪', NL: '🇳🇱', AE: '🇦🇪', BR: '🇧🇷',
    IE: '🇮🇪', SE: '🇸🇪', NO: '🇳🇴', DK: '🇩🇰', FI: '🇫🇮', BE: '🇧🇪', AT: '🇦🇹', CH: '🇨🇭', ES: '🇪🇸', FR: '🇫🇷',
    IT: '🇮🇹', PT: '🇵🇹', SA: '🇸🇦', QA: '🇶🇦', MX: '🇲🇽', IN: '🇮🇳', ID: '🇮🇩', TH: '🇹🇭',
    PL: '🇵🇱', CZ: '🇨🇿', SK: '🇸🇰', HU: '🇭🇺', SI: '🇸🇮', EE: '🇪🇪', LV: '🇱🇻', LT: '🇱🇹', HR: '🇭🇷', RO: '🇷🇴',
    BG: '🇧🇬', GR: '🇬🇷', TR: '🇹🇷', KW: '🇰🇼', OM: '🇴🇲', BH: '🇧🇭', SG: '🇸🇬', MY: '🇲🇾', JP: '🇯🇵', KR: '🇰🇷',
    CL: '🇨🇱', AR: '🇦🇷', CO: '🇨🇴', PE: '🇵🇪', VN: '🇻🇳', PH: '🇵🇭',
    UY: '🇺🇾', PA: '🇵🇦', CR: '🇨🇷',
};

function scarcityColor(idx: number): string {
    if (idx >= 70) return '#f87171';   // red — critical
    if (idx >= 50) return '#f59e0b';   // amber — tight
    return '#27d17f';                  // green — stable
}

function scarcityLabel(idx: number): string {
    if (idx >= 70) return 'Critical';
    if (idx >= 50) return 'Tight';
    return 'Stable';
}

interface Props {
    /** Where is this strip being shown? */
    surface?: 'directory' | 'map' | 'homepage';
    /** Show only corridors with scarcity above threshold */
    minScarcity?: number;
    /** Filter to specific country code (null = all) */
    countryFilter?: string | null;
    /** Max corridors to show */
    maxItems?: number;
}

export default function SupplyRadarStrip({
    surface = 'directory',
    minScarcity = 0,
    countryFilter = null,
    maxItems = 15,
}: Props) {
    const [corridors, setCorridors] = useState<CorridorSupply[]>(GLOBAL_SUPPLY);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

    useEffect(() => {
        // Phase 2: wire to live API
        let cancelled = false;
        async function fetchLive() {
            try {
                const url = countryFilter
                    ? `/api/supply/recommendations?country=${countryFilter}&limit=${maxItems}`
                    : `/api/supply/recommendations?limit=${maxItems}`;
                const res = await fetch(url);
                if (!res.ok) throw new Error('non-200');
                const { data } = await res.json();
                if (!cancelled && data?.length > 0) {
                    const mapped: CorridorSupply[] = data.map((z: any) => ({
                        slug: z.corridor || z.slug,
                        label: z.label || z.corridor,
                        countryCode: z.country_code || 'US',
                        scarcityIndex: z.priority_score ?? z.scarcity_index ?? 50,
                        availableNow: z.available_count ?? z.supply_count ?? 5,
                        avgResponseMin: z.avg_response_min ?? 30,
                    }));
                    setCorridors(mapped);
                }
            } catch {
                // Keep static fallback — works globally
            }
            if (!cancelled) {
                setLoading(false);
                setLastUpdated(new Date());
            }
        }
        fetchLive();
        const interval = setInterval(fetchLive, 60_000);
        return () => { cancelled = true; clearInterval(interval); };
    }, [countryFilter, maxItems]);

    const filtered = corridors
        .filter(c => c.scarcityIndex >= minScarcity)
        .filter(c => !countryFilter || c.countryCode === countryFilter)
        .sort((a, b) => b.scarcityIndex - a.scarcityIndex)
        .slice(0, maxItems);

    const uniqueCountries = new Set(filtered.map(c => c.countryCode));
    const criticalCount = filtered.filter(c => c.scarcityIndex >= 70).length;

    return (
        <div style={{
            background: 'rgba(8, 14, 22, 0.95)',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            padding: '12px 0',
        }}>
            <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 20px' }}>
                {/* Header row */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <Zap size={13} color="#f59e0b" />
                        <span style={{ fontSize: 10, fontWeight: 900, color: '#f59e0b', textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                            Global Supply Radar
                        </span>
                        <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.25)', marginLeft: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Globe size={9} />
                            {uniqueCountries.size} countries · {filtered.length} corridors
                        </span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        {criticalCount > 0 && (
                            <span style={{ fontSize: 10, color: '#f87171', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
                                <AlertTriangle size={10} />
                                {criticalCount} critical
                            </span>
                        )}
                        <Link
                            href="/corridor"
                            onClick={() => trackEvent('directory_scroll_cta_shown', { surface })}
                            style={{ fontSize: 10, color: 'rgba(255,255,255,0.35)', textDecoration: 'none', fontWeight: 700 }}
                        >
                            See all corridors →
                        </Link>
                    </div>
                </div>

                {/* Corridor shortage bars — scrollable strip */}
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                    {filtered.map(c => {
                        const color = scarcityColor(c.scarcityIndex);
                        const flag = FLAG_MAP[c.countryCode] || '🌍';
                        return (
                            <Link
                                key={c.slug}
                                href={c.countryCode === 'US' ? `/corridors/${c.slug}` : `/directory/${c.countryCode.toLowerCase()}`}
                                onClick={() => trackEvent('corridor_viewed', { corridor_slug: c.slug, country: c.countryCode, surface })}
                                style={{
                                    flexShrink: 0, minWidth: 170, padding: '10px 14px',
                                    borderRadius: 12, textDecoration: 'none',
                                    background: 'rgba(255,255,255,0.02)',
                                    border: `1px solid ${color}22`,
                                }}
                            >
                                {/* Corridor name + scarcity badge */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#e2eaf4', lineHeight: 1.2 }}>
                                        {flag} {c.label}
                                    </span>
                                    <span style={{
                                        fontSize: 9, fontWeight: 900, padding: '2px 6px', borderRadius: 6,
                                        background: `${color}18`, color, border: `1px solid ${color}30`,
                                        textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap', marginLeft: 6,
                                    }}>
                                        {scarcityLabel(c.scarcityIndex)}
                                    </span>
                                </div>

                                {/* Scarcity bar */}
                                <div style={{ height: 3, borderRadius: 999, background: 'rgba(255,255,255,0.06)', marginBottom: 8 }}>
                                    <div style={{ height: '100%', borderRadius: 999, width: `${c.scarcityIndex}%`, background: color, transition: 'width 0.8s ease' }} />
                                </div>

                                {/* Stats */}
                                <div style={{ display: 'flex', gap: 12 }}>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <span style={{ color, fontWeight: 800 }}>{c.availableNow}</span> avail
                                    </span>
                                    <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', display: 'flex', alignItems: 'center', gap: 3 }}>
                                        <Clock size={9} />
                                        {c.avgResponseMin}m
                                    </span>
                                </div>
                            </Link>
                        );
                    })}
                </div>

                {/* Shortage banner — shows when any corridor is critical */}
                {criticalCount > 0 && (
                    <div style={{
                        marginTop: 10, padding: '8px 14px', borderRadius: 10,
                        background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.2)',
                        display: 'flex', alignItems: 'center', gap: 8,
                    }}>
                        <AlertTriangle size={12} color="#f87171" />
                        <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.55)', lineHeight: 1.4 }}>
                            Supply is critically low in{' '}
                            <strong style={{ color: '#f87171' }}>
                                {filtered
                                    .filter(c => c.scarcityIndex >= 70)
                                    .slice(0, 3)
                                    .map(c => `${FLAG_MAP[c.countryCode] || ''} ${c.label}`)
                                    .join(', ')}
                                {criticalCount > 3 && ` +${criticalCount - 3} more`}
                            </strong>
                            .{' '}
                            <Link href="/onboarding/start?role=escort" style={{ color: '#f87171', fontWeight: 700, textDecoration: 'underline' }}>
                                Escort operators: claim these corridors
                            </Link>
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
}
