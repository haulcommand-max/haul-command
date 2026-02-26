'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import { createClient } from '@/utils/supabase/client';
import { RecentlyFilledStrip } from '@/components/load-board/RecentlyFilledStrip';
import { ScanModeCard } from '@/components/load-board/ScanModeCard';

// ══════════════════════════════════════════════════════════════
// HAUL COMMAND — 2026 COMMAND CENTER MAP BOARD
// Dark freight theme · Full-viewport map · Control-tower aesthetic
// ══════════════════════════════════════════════════════════════

// ─── Design tokens
const T = {
    bg: '#060b12',
    bgElevated: '#0f1720',
    bgCard: '#121a24',
    bgPanel: 'rgba(15,23,32,0.92)',
    border: 'rgba(255,255,255,0.08)',
    borderStrong: 'rgba(255,255,255,0.14)',
    textPrimary: '#ffffff',
    textBody: '#cfd8e3',
    textSecondary: '#8fa3b8',
    textLabel: '#9fb3c8',
    gold: '#f5b942',
    blue: '#3ba4ff',
    green: '#27d17f',
    red: '#f87171',
    amber: '#f59e0b',
} as const;

interface LoadRow {
    load_id: string;
    posted_at: string;
    origin_city: string; origin_state: string;
    dest_city: string; dest_state: string;
    origin_lat?: number; origin_lng?: number;
    dest_lat?: number; dest_lng?: number;
    service_required: string;
    rate_amount: number;
    urgency: 'hot' | 'warm' | 'planned' | 'flex';
    status: string;
    is_boosted: boolean;
    fill_probability_60m: number | null;
    hard_fill_label: string | null;
    load_quality_grade: string | null;
    lane_badges: string[] | null;
    load_rank: number | null;
    broker_trust_score: number | null;
    carvenum_color?: 'green' | 'yellow' | 'orange' | 'red' | 'unknown';
    rate_per_mile?: number;
}

const URGENCY_COLORS: Record<string, string> = {
    hot: '#f87171', warm: '#f59e0b', planned: '#3ba4ff', flex: '#8fa3b8',
};

const supabase = createClient();

function timeSince(dateStr: string) {
    const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
    if (s < 60) return `${s}s`;
    if (s < 3600) return `${Math.floor(s / 60)}m`;
    if (s < 86400) return `${Math.floor(s / 3600)}h`;
    return `${Math.floor(s / 86400)}d`;
}

// ─── Skeleton
function LoadSkeleton() {
    return (
        <div style={{ background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 12, padding: '14px 16px', marginBottom: 8 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: 10 }}>
                <div className="skeleton" style={{ width: 140, height: 14, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 20, height: 14, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 120, height: 14, borderRadius: 6 }} />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
                <div className="skeleton" style={{ width: 56, height: 20, borderRadius: 6 }} />
                <div className="skeleton" style={{ width: 72, height: 20, borderRadius: 6 }} />
            </div>
        </div>
    );
}

// ─── Value Arrow chip
function ValueArrow({ color, label }: { color: 'green' | 'yellow' | 'orange' | 'red' | 'unknown'; label?: string }) {
    const cfg: Record<string, { bg: string; border: string; text: string; arrow: string; lbl: string }> = {
        green: { bg: 'rgba(39,209,127,0.1)', border: 'rgba(39,209,127,0.25)', text: T.green, arrow: '↑', lbl: 'Strong Pay' },
        yellow: { bg: 'rgba(245,185,66,0.1)', border: 'rgba(245,185,66,0.25)', text: T.gold, arrow: '→', lbl: 'Market Rate' },
        orange: { bg: 'rgba(245,158,11,0.1)', border: 'rgba(245,158,11,0.25)', text: T.amber, arrow: '↘', lbl: 'Below Median' },
        red: { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.25)', text: T.red, arrow: '↓', lbl: 'Below Market' },
        unknown: { bg: 'rgba(143,163,184,0.08)', border: 'rgba(143,163,184,0.15)', text: T.textSecondary, arrow: '–', lbl: 'No Data' },
    };
    const c = cfg[color] ?? cfg.unknown;
    return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 9px', borderRadius: 8, background: c.bg, border: `1px solid ${c.border}` }}>
            <span style={{ fontSize: 13, fontWeight: 900, color: c.text, lineHeight: 1 }}>{c.arrow}</span>
            <span style={{ fontSize: 10, fontWeight: 700, color: c.text, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label || c.lbl}</span>
        </div>
    );
}

// ─── Corridor Stress chip
type CorridorStatus = 'healthy' | 'tightening' | 'at_risk' | 'critical';
const CORRIDOR_STYLES: Record<CorridorStatus, { bg: string; color: string; border: string; label: string }> = {
    healthy: { bg: 'rgba(39,209,127,0.12)', color: '#27d17f', border: 'rgba(39,209,127,0.35)', label: 'Healthy' },
    tightening: { bg: 'rgba(245,185,66,0.12)', color: '#f5b942', border: 'rgba(245,185,66,0.35)', label: 'Tightening' },
    at_risk: { bg: 'rgba(248,113,113,0.12)', color: '#f87171', border: 'rgba(248,113,113,0.35)', label: 'At Risk' },
    critical: { bg: 'rgba(248,113,113,0.18)', color: '#fca5a5', border: 'rgba(248,113,113,0.45)', label: 'Critical' },
};
function CorridorChip({ status }: { status: CorridorStatus }) {
    const s = CORRIDOR_STYLES[status];
    return (
        <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, background: s.bg, color: s.color, border: `1px solid ${s.border}`, fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
            {s.label}
        </span>
    );
}

// ─── Filter Chips
interface Filters { urgency: string; payMin: number; boostedOnly: boolean; search: string; }
function FilterBar({ filters, onChange, count }: { filters: Filters; onChange: (f: Filters) => void; count: number }) {
    const urgOpts = ['all', 'hot', 'warm', 'planned', 'flex'];
    const payOpts = [{ label: 'Any Rate', min: 0 }, { label: '$200+', min: 200 }, { label: '$500+', min: 500 }, { label: '$1k+', min: 1000 }];

    const chip = (active: boolean, color: string = T.gold) => ({
        padding: '5px 13px', borderRadius: 20, fontSize: 11, fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
        background: active ? `${color}18` : 'rgba(255,255,255,0.04)',
        border: `1px solid ${active ? `${color}45` : T.border}`,
        color: active ? color : T.textSecondary,
        textTransform: 'uppercase' as const, letterSpacing: '0.05em',
    });

    return (
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch', paddingBottom: 4, scrollbarWidth: 'none' }}>
            {urgOpts.map(u => (
                <button key={u} onClick={() => onChange({ ...filters, urgency: u })}
                    style={{ ...chip(filters.urgency === u, URGENCY_COLORS[u] ?? T.gold), flexShrink: 0 }}>
                    {u === 'all' ? `All (${count})` : u}
                </button>
            ))}
            <div style={{ width: 1, height: 18, background: T.border, margin: '0 2px', flexShrink: 0 }} />
            {payOpts.map(p => (
                <button key={p.label} onClick={() => onChange({ ...filters, payMin: p.min })}
                    style={{ ...chip(filters.payMin === p.min, T.green), flexShrink: 0 }}>
                    {p.label}
                </button>
            ))}
            <div style={{ width: 1, height: 18, background: T.border, margin: '0 2px', flexShrink: 0 }} />
            <button onClick={() => onChange({ ...filters, boostedOnly: !filters.boostedOnly })}
                style={{ ...chip(filters.boostedOnly, '#a78bfa'), flexShrink: 0 }}>
                ⚡ Boosted
            </button>
        </div>
    );
}

// ─── Load Card (list view) — 2026 Marketplace Upgrade
function LoadCard({ load, isNew }: { load: LoadRow; isNew?: boolean }) {
    const fillP = load.fill_probability_60m;
    const fillColor = fillP != null ? (fillP >= 0.7 ? T.green : fillP >= 0.4 ? T.amber : T.red) : T.textSecondary;
    const urgColor = URGENCY_COLORS[load.urgency] ?? T.textSecondary;

    return (
        <Link href={`/loads/${load.load_id}`} style={{ textDecoration: 'none', display: 'block' }}>
            <div style={{
                position: 'relative',
                background: load.is_boosted ? 'rgba(167,139,250,0.05)' : T.bgCard,
                border: `1px solid ${load.is_boosted ? 'rgba(167,139,250,0.22)' : T.border}`,
                borderRadius: 14, padding: '14px 18px 14px 22px',
                minHeight: 68,
                display: 'flex', flexDirection: 'column', gap: 0,
                transition: 'all 0.18s', cursor: 'pointer',
                animation: isNew ? 'slide-up-fade 0.4s ease-out' : undefined,
                overflow: 'hidden',
            }}
                onMouseEnter={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = `${T.gold}40`; el.style.transform = 'translateY(-2px)'; el.style.boxShadow = `0 8px 32px rgba(0,0,0,0.4), 0 0 0 1px ${T.gold}12`; }}
                onMouseLeave={e => { const el = e.currentTarget as HTMLElement; el.style.borderColor = load.is_boosted ? 'rgba(167,139,250,0.22)' : T.border; el.style.transform = ''; el.style.boxShadow = ''; }}
            >
                {/* Urgency accent bar — left edge */}
                <div style={{
                    position: 'absolute', left: 0, top: 10, bottom: 10,
                    width: 3, borderRadius: '0 3px 3px 0',
                    background: urgColor, opacity: 0.7,
                }} />

                {/* Route + Price row */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap', marginBottom: 4 }}>
                            <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary }}>{load.origin_city}, {load.origin_state}</span>
                            <span style={{ color: T.gold, fontSize: 13, fontWeight: 600 }}>→</span>
                            <span style={{ fontSize: 15, fontWeight: 800, color: T.textPrimary }}>{load.dest_city}, {load.dest_state}</span>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                            <span style={{ fontSize: 12, color: T.textSecondary, fontWeight: 500 }}>
                                {(() => {
                                    const typeMap: Record<string, string> = {
                                        pevo_lead_chase: "Lead Chase",
                                        pevo_pilot: "Pilot Car",
                                        pevo_high_pole: "High Pole",
                                        pevo_steersman: "Steersman",
                                        pevo_route_survey: "Route Survey",
                                        pevo_superload: "Superload",
                                        escort: "Escort",
                                        pilot_car: "Pilot Car",
                                        high_pole: "High Pole",
                                        steersman: "Steersman"
                                    };
                                    return typeMap[load.service_required] || load.service_required;
                                })()} · {timeSince(load.posted_at)} ago
                            </span>
                            {load.urgency && <span className={`urgency-chip urgency-chip--${load.urgency}`}>{load.urgency}</span>}
                            {load.is_boosted && <span style={{ padding: '1px 7px', borderRadius: 5, fontSize: 9, fontWeight: 800, background: 'rgba(167,139,250,0.18)', color: '#a78bfa', border: '1px solid rgba(167,139,250,0.3)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>⚡ Boosted</span>}
                        </div>
                    </div>
                    {/* Price — maximum visual weight */}
                    <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: 16 }}>
                        <div style={{ fontSize: 22, fontWeight: 900, color: T.gold, fontFamily: "'JetBrains Mono', 'Courier New', monospace", lineHeight: 1, letterSpacing: '-0.02em' }}>
                            ${(load.rate_amount ?? 0).toLocaleString()}
                        </div>
                        {load.rate_per_mile && <div style={{ fontSize: 11, color: T.textSecondary, fontFamily: 'monospace', marginTop: 3 }}>${load.rate_per_mile.toFixed(2)}/mi</div>}
                    </div>
                </div>

                {/* Fill probability bar */}
                {fillP != null && (
                    <div style={{ marginBottom: 10 }}>
                        <div style={{ height: 3, borderRadius: 2, background: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
                            <div style={{ height: '100%', width: `${Math.round(fillP * 100)}%`, borderRadius: 2, background: fillColor, transition: 'width 0.4s ease' }} />
                        </div>
                    </div>
                )}

                {/* Intel chips row */}
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <ValueArrow color={load.carvenum_color ?? 'unknown'} />
                    {fillP != null && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 8, background: `${fillColor}12`, border: `1px solid ${fillColor}25` }}>
                            <div style={{ width: 5, height: 5, borderRadius: '50%', background: fillColor, flexShrink: 0 }} />
                            <span style={{ fontSize: 10, fontWeight: 700, color: fillColor }}>{Math.round(fillP * 100)}% fill</span>
                        </div>
                    )}
                    {load.load_quality_grade && <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 700, background: 'rgba(59,164,255,0.1)', color: T.blue, border: '1px solid rgba(59,164,255,0.25)' }}>Grade {load.load_quality_grade}</span>}
                    {load.broker_trust_score != null && <span style={{ padding: '3px 8px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: load.broker_trust_score >= 70 ? 'rgba(39,209,127,0.08)' : 'rgba(245,185,66,0.08)', color: load.broker_trust_score >= 70 ? T.green : T.gold, border: `1px solid ${load.broker_trust_score >= 70 ? 'rgba(39,209,127,0.22)' : 'rgba(245,185,66,0.22)'}` }}>Trust {Math.round(load.broker_trust_score)}</span>}
                </div>
            </div>
        </Link>
    );
}

// ─── Sidebar panel (selected load detail)
function MapSidebar({ selected, totalLoads, hotCount, stateCount }: { selected: LoadRow | null; totalLoads: number; hotCount: number; stateCount: number }) {
    const corridorStatus: CorridorStatus = selected
        ? selected.urgency === 'hot' ? 'critical'
            : (selected.fill_probability_60m ?? 0) >= 0.7 ? 'tightening'
                : (selected.fill_probability_60m ?? 0) >= 0.4 ? 'at_risk'
                    : 'healthy'
        : 'healthy';

    const label = (text: string) => (
        <p style={{ margin: '0 0 4px', fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.13em', color: T.textLabel }}>{text}</p>
    );

    return (
        <div style={{
            width: 260, minWidth: 240, maxWidth: 280,
            flexShrink: 0, overflowX: 'hidden', overflowY: 'auto',
            background: T.bgPanel,
            backdropFilter: 'blur(16px)',
            borderLeft: `1px solid ${T.border}`,
            padding: 14,
            display: 'flex', flexDirection: 'column', gap: 12,
            zIndex: 30, position: 'relative',
        }}>

            {/* ── Stats header ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {[
                    { val: totalLoads, lbl: 'Active', color: T.gold },
                    { val: hotCount, lbl: 'Hot', color: T.red },
                    { val: stateCount, lbl: 'States', color: T.blue },
                ].map(({ val, lbl, color }) => (
                    <div key={lbl} style={{ textAlign: 'center', padding: '8px 4px', borderRadius: 10, background: T.bgCard, border: `1px solid ${T.border}` }}>
                        <div style={{ fontSize: 18, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>{val}</div>
                        <div style={{ fontSize: 9, color: T.textLabel, textTransform: 'uppercase', letterSpacing: '0.1em', marginTop: 2 }}>{lbl}</div>
                    </div>
                ))}
            </div>

            <div style={{ height: 1, background: T.border }} />

            {!selected ? (
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: 10, padding: '20px 0' }}>
                    <div style={{ fontSize: 34, opacity: 0.25 }}>📍</div>
                    <p style={{ fontSize: 12, color: T.textSecondary, lineHeight: 1.6, margin: 0 }}>
                        Click a cluster dot on the map to inspect a load
                    </p>
                </div>
            ) : (
                <>
                    {/* Route */}
                    <div>
                        {label('Selected Load')}
                        <p style={{ margin: '0 0 2px', fontSize: 14, fontWeight: 800, color: T.textPrimary, lineHeight: 1.3 }}>
                            {selected.origin_city}, {selected.origin_state}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3 }}>
                            <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, ${T.gold}60, transparent)` }} />
                            <span style={{ fontSize: 10, color: T.gold, fontWeight: 700 }}>→</span>
                            <div style={{ height: 1, flex: 1, background: `linear-gradient(90deg, transparent, ${T.gold}60)` }} />
                        </div>
                        <p style={{ margin: '3px 0 0', fontSize: 14, fontWeight: 800, color: T.textPrimary, lineHeight: 1.3 }}>
                            {selected.dest_city}, {selected.dest_state}
                        </p>
                    </div>

                    {/* Rate */}
                    <div style={{ padding: '11px 13px', borderRadius: 11, background: 'rgba(245,185,66,0.07)', border: `1px solid rgba(245,185,66,0.2)` }}>
                        {label('Rate')}
                        <p style={{ margin: 0, fontSize: 24, fontWeight: 900, color: T.gold, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1 }}>
                            ${(selected.rate_amount ?? 0).toLocaleString()}
                        </p>
                        {selected.rate_per_mile && (
                            <p style={{ margin: '4px 0 0', fontSize: 11, color: T.textSecondary, fontFamily: 'monospace' }}>
                                ${selected.rate_per_mile.toFixed(2)}/mi
                            </p>
                        )}
                    </div>

                    {/* Details */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {([
                            ['Service', selected.service_required],
                            ['Urgency', selected.urgency?.toUpperCase()],
                            ['Trust Score', selected.broker_trust_score != null ? `${Math.round(selected.broker_trust_score)}/100` : '—'],
                            ['Fill Prob.', selected.fill_probability_60m != null ? `${Math.round(selected.fill_probability_60m * 100)}%` : '—'],
                        ] as [string, string | undefined][]).filter(([, v]) => v).map(([lbl, val]) => (
                            <div key={lbl} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span style={{ fontSize: 11, color: T.textLabel }}>{lbl}</span>
                                <span style={{ fontSize: 12, fontWeight: 700, color: T.textBody }}>{val}</span>
                            </div>
                        ))}
                    </div>

                    <div style={{ height: 1, background: T.border }} />

                    {/* Corridor stress */}
                    <div>
                        {label('Corridor Stress')}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                            <CorridorChip status={corridorStatus} />
                            {selected.load_quality_grade && (
                                <span style={{ display: 'inline-block', padding: '3px 10px', borderRadius: 999, fontSize: 10, fontWeight: 800, background: `rgba(59,164,255,0.12)`, color: T.blue, border: `1px solid rgba(59,164,255,0.3)`, textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                                    Grade {selected.load_quality_grade}
                                </span>
                            )}
                        </div>
                    </div>

                    {/* CTA */}
                    <a href={`/loads/${selected.load_id}`} style={{
                        display: 'block', textAlign: 'center', padding: '11px 16px',
                        borderRadius: 11, background: `linear-gradient(135deg, ${T.gold}, #d97706)`,
                        color: '#0a0f16', fontWeight: 900, fontSize: 12,
                        textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.07em',
                        boxShadow: `0 3px 16px rgba(245,185,66,0.28)`,
                        marginTop: 'auto',
                    }}>
                        View Full Load →
                    </a>
                </>
            )}
        </div>
    );
}

// ─── Map Canvas (US cluster dots)
const STATE_COORDS: Record<string, [number, number]> = {
    TX: [31.97, -99.90], FL: [27.99, -81.76], CA: [36.78, -119.42],
    OH: [40.42, -82.91], PA: [41.20, -77.19], GA: [32.17, -82.90],
    NC: [35.76, -79.02], IL: [40.63, -89.40], NY: [42.17, -74.95],
    LA: [30.98, -91.96], OK: [35.01, -97.09], AZ: [34.05, -111.09],
    MI: [44.31, -85.60], VA: [37.43, -78.66], WA: [47.75, -120.74],
    IN: [40.27, -86.13], TN: [35.52, -86.58], MO: [37.96, -91.83],
    WI: [43.78, -88.79], MN: [46.73, -94.69], AL: [32.32, -86.90],
    SC: [33.84, -81.16], KY: [37.84, -84.27], OR: [43.80, -120.55],
    NV: [38.80, -116.42], NJ: [40.06, -74.41], CO: [39.55, -105.78],
    AR: [35.20, -91.83], IA: [41.88, -93.10], MS: [32.35, -89.40],
    KS: [39.01, -98.48], NE: [41.49, -99.90], NM: [34.52, -105.87],
    WV: [38.60, -80.45], ID: [44.07, -114.74], UT: [39.32, -111.09],
    MT: [46.88, -110.36], ND: [47.55, -101.00], SD: [43.97, -99.90],
    AB: [53.93, -116.58], ON: [51.25, -85.32], BC: [53.73, -127.65],
    QC: [52.94, -73.55], MB: [53.76, -98.81],
};

function MapCanvas({ loads, onSelect }: { loads: LoadRow[]; onSelect: (l: LoadRow) => void }) {
    const clusters = useMemo(() => {
        const map: Record<string, { state: string; loads: LoadRow[]; lat: number; lng: number }> = {};
        loads.forEach(l => {
            const key = l.origin_state;
            if (!map[key]) {
                const coords = STATE_COORDS[key] ?? [39.8, -98.5];
                map[key] = { state: key, loads: [], lat: coords[0], lng: coords[1] };
            }
            map[key].loads.push(l);
        });
        return Object.values(map).sort((a, b) => b.loads.length - a.loads.length);
    }, [loads]);

    const maxLoads = Math.max(...clusters.map(c => c.loads.length), 1);

    // Corridor lines between top clusters
    const topClusters = clusters.slice(0, 8);
    const corridorPairs = topClusters.slice(0, 5).map((a, i) => [a, topClusters[(i + 1) % topClusters.length]] as const);

    function toXY(lat: number, lng: number) {
        const x = ((lng + 130) / 70) * 100;
        const y = ((55 - lat) / 30) * 100;
        return { x: Math.max(3, Math.min(97, x)), y: Math.max(3, Math.min(92, y)) };
    }

    return (
        <div style={{
            flex: 1, minWidth: 0,
            height: 'clamp(420px, 70vh, 780px)',
            background: '#0b0f14',
            position: 'relative',
            overflow: 'hidden',
        }}>
            {/* Grid overlay for command-center feel */}
            <div style={{
                position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 0,
                backgroundImage: `
                    linear-gradient(rgba(59,164,255,0.04) 1px, transparent 1px),
                    linear-gradient(90deg, rgba(59,164,255,0.04) 1px, transparent 1px)
                `,
                backgroundSize: '48px 48px',
            }} />

            {/* Subtle radial glow center */}
            <div style={{
                position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none',
                background: 'radial-gradient(ellipse 70% 60% at 45% 55%, rgba(59,164,255,0.05) 0%, transparent 70%)',
            }} />

            {/* US outline — SVG-based continental silhouette */}
            <svg
                viewBox="0 0 840 480"
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 1, opacity: 0.18 }}
                preserveAspectRatio="xMidYMid meet"
            >
                {/* Continental outline */}
                <path
                    d="M120,160 Q140,100 220,90 Q310,70 420,100 Q500,80 590,95 Q670,80 720,130 L740,200 Q760,240 730,280 Q700,310 680,330 L700,350 Q720,370 680,390 Q640,410 590,380 Q550,390 510,370 L490,390 Q470,410 440,390 Q410,400 380,380 Q350,400 310,380 Q270,400 240,370 Q210,390 180,360 Q150,380 130,340 Q100,310 90,270 Q80,240 90,200 Z"
                    fill="#1a2430" stroke="#2b3a4d" strokeWidth="1.5"
                />
                {/* Alaska hint */}
                <path d="M80,380 Q100,360 130,370 Q160,380 150,400 Q130,420 100,410 Z" fill="#1a2430" stroke="#2b3a4d" strokeWidth="1" />
                {/* Hawaii hint */}
                <ellipse cx="220" cy="430" rx="18" ry="8" fill="#1a2430" stroke="#2b3a4d" strokeWidth="1" />
                <ellipse cx="200" cy="438" rx="10" ry="5" fill="#1a2430" stroke="#2b3a4d" strokeWidth="1" />
                {/* Canada partial */}
                <path d="M120,160 Q200,120 300,110 Q400,80 520,90 Q620,70 720,130 L720,80 Q620,40 500,50 Q380,30 280,60 Q180,70 100,120 Z" fill="#111d29" stroke="#243040" strokeWidth="1" opacity="0.6" />
            </svg>

            {/* Corridor lines between active clusters */}
            <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', zIndex: 2, pointerEvents: 'none' }}>
                {corridorPairs.map(([a, b], i) => {
                    const pa = toXY(a.lat, a.lng);
                    const pb = toXY(b.lat, b.lng);
                    const isActive = a.loads.some(l => l.urgency === 'hot');
                    const color = isActive ? T.gold : T.blue;
                    return (
                        <g key={i}>
                            {/* Glow effect */}
                            <line
                                x1={`${pa.x}%`} y1={`${pa.y}%`}
                                x2={`${pb.x}%`} y2={`${pb.y}%`}
                                stroke={color} strokeWidth="6" strokeOpacity="0.08"
                                strokeDasharray="none"
                            />
                            {/* Core line */}
                            <line
                                x1={`${pa.x}%`} y1={`${pa.y}%`}
                                x2={`${pb.x}%`} y2={`${pb.y}%`}
                                stroke={color} strokeWidth="1.5" strokeOpacity="0.35"
                                strokeDasharray="6 4"
                            />
                        </g>
                    );
                })}
            </svg>

            {/* Load clusters */}
            {clusters.map(cluster => {
                const { x, y } = toXY(cluster.lat, cluster.lng);
                const size = 16 + (cluster.loads.length / maxLoads) * 34;
                const hasHot = cluster.loads.some(l => l.urgency === 'hot');
                const color = hasHot ? T.red : cluster.loads.length >= 5 ? T.gold : T.green;

                return (
                    <div key={cluster.state}
                        onClick={() => { if (cluster.loads[0]) onSelect(cluster.loads[0]); }}
                        title={`${cluster.state}: ${cluster.loads.length} loads`}
                        style={{
                            position: 'absolute',
                            left: `${x}%`, top: `${y}%`,
                            transform: 'translate(-50%, -50%)',
                            zIndex: 10, cursor: 'pointer',
                        }}
                    >
                        {/* Outer pulse ring */}
                        <div style={{
                            position: 'absolute',
                            inset: -8, borderRadius: '50%',
                            border: `1.5px solid ${color}35`,
                            animation: hasHot ? 'pulse-gold 2s infinite' : 'pulse-slow 4s infinite ease-in-out',
                        }} />
                        {/* Mid ring */}
                        <div style={{ position: 'absolute', inset: -3, borderRadius: '50%', border: `1px solid ${color}25` }} />
                        {/* Core dot */}
                        <div style={{
                            width: size, height: size, borderRadius: '50%',
                            background: `radial-gradient(circle at 35% 35%, ${color}90 0%, ${color}30 60%, ${color}08 100%)`,
                            border: `1.5px solid ${color}70`,
                            boxShadow: `0 0 ${size}px ${color}35, 0 0 4px ${color}60`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            transition: 'all 0.25s',
                        }}>
                            <span style={{ fontSize: size > 32 ? 11 : 9, fontWeight: 900, color: '#fff', textShadow: `0 0 6px ${color}` }}>
                                {cluster.loads.length}
                            </span>
                        </div>
                        {/* State label */}
                        <div style={{
                            position: 'absolute', top: '100%', left: '50%', transform: 'translateX(-50%)',
                            marginTop: 3, fontSize: 8, fontWeight: 700, color: T.textLabel,
                            textTransform: 'uppercase', letterSpacing: '0.1em', whiteSpace: 'nowrap',
                        }}>{cluster.state}</div>
                    </div>
                );
            })}

            {/* Live badge — top left */}
            <div style={{
                position: 'absolute', top: 14, left: 14, zIndex: 20,
                display: 'flex', alignItems: 'center', gap: 7,
                padding: '6px 13px',
                background: 'rgba(6,11,18,0.8)', backdropFilter: 'blur(12px)',
                border: `1px solid rgba(39,209,127,0.3)`,
                borderRadius: 8,
            }}>
                <div style={{ width: 7, height: 7, borderRadius: '50%', background: T.green, boxShadow: `0 0 8px ${T.green}`, animation: 'pulse-slow 2s infinite' }} />
                <span style={{ fontSize: 10, fontWeight: 800, color: T.green, textTransform: 'uppercase', letterSpacing: '0.12em' }}>Live Market</span>
                <span style={{ fontSize: 10, color: T.textSecondary }}>· 20s</span>
            </div>

            {/* Controls — top right */}
            <div style={{ position: 'absolute', top: 14, right: 14, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
                {[
                    { icon: '🌡', label: 'Heat', active: true },
                    { icon: '🚛', label: 'Drivers', active: false },
                    { icon: '📡', label: 'Radius', active: false },
                ].map(ctrl => (
                    <button key={ctrl.label} style={{
                        padding: '5px 11px',
                        display: 'flex', alignItems: 'center', gap: 6,
                        borderRadius: 8, fontSize: 10, fontWeight: 700,
                        background: ctrl.active ? `rgba(245,185,66,0.14)` : 'rgba(6,11,18,0.75)',
                        border: `1px solid ${ctrl.active ? 'rgba(245,185,66,0.4)' : T.border}`,
                        color: ctrl.active ? T.gold : T.textSecondary,
                        cursor: 'pointer', backdropFilter: 'blur(10px)', transition: 'all 0.15s',
                    }}>
                        <span>{ctrl.icon}</span><span>{ctrl.label}</span>
                    </button>
                ))}
            </div>

            {/* Corridor heat bar — bottom left */}
            <div style={{
                position: 'absolute', bottom: 14, left: 14, zIndex: 20,
                padding: '8px 13px',
                background: 'rgba(6,11,18,0.82)', backdropFilter: 'blur(12px)',
                border: `1px solid ${T.border}`,
                borderRadius: 10, minWidth: 180,
            }}>
                <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.textLabel, marginBottom: 6 }}>Corridor Heat</div>
                <div style={{ height: 6, borderRadius: 3, background: `linear-gradient(90deg, ${T.green}, ${T.gold}, ${T.red})`, marginBottom: 5 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 9, color: T.green }}>Cool</span>
                    <span style={{ fontSize: 9, color: T.textLabel }}>Market</span>
                    <span style={{ fontSize: 9, color: T.red }}>Hot</span>
                </div>
            </div>

            <style>{`
                @keyframes pulse-slow {
                    0%, 100% { opacity: 1; }
                    50% { opacity: 0.5; }
                }
                @keyframes pulse-gold {
                    0%, 100% { opacity: 1; transform: scale(1); }
                    50% { opacity: 0.4; transform: scale(1.08); }
                }
                @keyframes slide-up-fade {
                    from { opacity: 0; transform: translateY(8px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                .skeleton {
                    background: linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.09) 50%, rgba(255,255,255,0.04) 75%);
                    background-size: 200% 100%;
                    animation: shimmer 1.6s infinite;
                    border-radius: 6px;
                }
                @keyframes shimmer {
                    0% { background-position: 200% 0; }
                    100% { background-position: -200% 0; }
                }
            `}</style>
        </div>
    );
}

// ─── Empty state
function EmptyState({ filtered }: { filtered: boolean }) {
    return (
        <div style={{ textAlign: 'center', padding: '3rem 2rem', background: T.bgCard, border: `1px dashed ${T.border}`, borderRadius: 16 }}>
            <div style={{ fontSize: 44, marginBottom: 14 }}>📡</div>
            <h3 style={{ fontSize: 17, fontWeight: 700, color: T.textPrimary, margin: '0 0 8px', letterSpacing: '0.01em' }}>
                {filtered ? 'No loads match your filters' : 'Coverage Building'}
            </h3>
            <p style={{ fontSize: 14, color: T.textSecondary, maxWidth: 380, margin: '0 auto 20px', lineHeight: 1.6 }}>
                {filtered ? 'Adjust filters — new loads post every few minutes.' : 'Early operators gain priority positioning.'}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
                <Link href="/loads/post" style={{ padding: '10px 22px', borderRadius: 10, background: `linear-gradient(135deg, ${T.gold}, #d97706)`, color: '#0a0f16', fontSize: 13, fontWeight: 900, textDecoration: 'none' }}>
                    Post a Load
                </Link>
                {!filtered && (
                    <button style={{ padding: '10px 22px', borderRadius: 10, background: T.bgElevated, border: `1px solid ${T.border}`, color: T.textBody, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                        Join Early Network
                    </button>
                )}
            </div>
        </div>
    );
}

// ═══════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════
export default function MapFirstLoadboard() {
    const [loads, setLoads] = useState<LoadRow[]>([]);
    const [loading, setLoading] = useState(true);
    const [viewMode, setViewMode] = useState<'map' | 'list' | 'scan'>('map');
    const [filters, setFilters] = useState<Filters>({ urgency: 'all', payMin: 0, boostedOnly: false, search: '' });
    const [newLoadIds, setNewLoadIds] = useState<Set<string>>(new Set());
    const [selectedLoad, setSelectedLoad] = useState<LoadRow | null>(null);
    const refreshRef = useRef<ReturnType<typeof setInterval> | null>(null);

    useEffect(() => {
        const saved = window.localStorage.getItem('loadboard_view');
        if (saved === 'scan' || saved === 'list') setViewMode(saved as 'scan' | 'list');
    }, []);
    useEffect(() => { window.localStorage.setItem('loadboard_view', viewMode); }, [viewMode]);

    const fetchLoads = useCallback(async () => {
        const { data, error } = await supabase
            .from('directory_active_loads_view')
            .select('*')
            .order('load_rank', { ascending: false, nullsFirst: false })
            .order('posted_at', { ascending: false })
            .limit(200);
        if (!error && data) setLoads(data as LoadRow[]);
        setLoading(false);
    }, []);

    useEffect(() => {
        fetchLoads();
        refreshRef.current = setInterval(fetchLoads, 20000);
        const channel = supabase.channel('loadboard-live-v3')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'loads' }, (payload) => {
                const nl = payload.new as LoadRow;
                setLoads(prev => [nl, ...prev]);
                setNewLoadIds(prev => new Set([...prev, nl.load_id]));
                setTimeout(() => setNewLoadIds(prev => { const n = new Set(prev); n.delete(nl.load_id); return n; }), 3000);
            })
            .subscribe();
        return () => { if (refreshRef.current) clearInterval(refreshRef.current); supabase.removeChannel(channel); };
    }, [fetchLoads]);

    const filtered = useMemo(() => {
        return loads.filter(l => {
            if (filters.urgency !== 'all' && l.urgency !== filters.urgency) return false;
            if (filters.payMin > 0 && (l.rate_amount ?? 0) < filters.payMin) return false;
            if (filters.boostedOnly && !l.is_boosted) return false;
            if (filters.search) {
                const s = filters.search.toLowerCase();
                if (!`${l.origin_city} ${l.origin_state} ${l.dest_city} ${l.dest_state} ${l.service_required}`.toLowerCase().includes(s)) return false;
            }
            return true;
        });
    }, [loads, filters]);

    const hotCount = loads.filter(l => l.urgency === 'hot').length;
    const stateSet = new Set(loads.map(l => l.origin_state));
    const isFiltered = filters.urgency !== 'all' || filters.payMin > 0 || filters.boostedOnly || filters.search !== '';

    return (
        <div style={{ background: T.bg, minHeight: '100vh' }}>
            <div className="hc-container" style={{ paddingTop: 20, paddingBottom: 20 }}>

                {/* ── Page Header — 2026 Upgrade */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
                    <div>
                        <h1 style={{ margin: 0, fontSize: 30, fontWeight: 800, color: T.textPrimary, letterSpacing: '-0.01em', lineHeight: 1, fontFamily: "var(--font-display, 'Space Grotesk', system-ui)" }}>
                            Load Board
                        </h1>
                        <p style={{ margin: '6px 0 0', fontSize: 14, color: T.textSecondary, lineHeight: 1.5, display: 'flex', alignItems: 'center', gap: 6 }}>
                            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                <span style={{ width: 6, height: 6, borderRadius: '50%', background: T.green, boxShadow: `0 0 6px ${T.green}` }} />
                                <span style={{ color: T.green, fontWeight: 700 }}>{filtered.length}</span>
                            </span>
                            <span>active escorts</span>
                            <span style={{ color: T.textLabel }}>· Live refresh every 20s</span>
                        </p>
                    </div>
                    {/* View toggle */}
                    <div style={{ display: 'flex', gap: 3, background: T.bgCard, border: `1px solid ${T.border}`, borderRadius: 10, padding: 3 }}>
                        {(['map', 'list', 'scan'] as const).map(v => (
                            <button key={v} onClick={() => setViewMode(v)} style={{
                                padding: '7px 18px', borderRadius: 8, fontSize: 11, fontWeight: 700,
                                background: viewMode === v ? T.bgElevated : 'transparent',
                                border: `1px solid ${viewMode === v ? T.borderStrong : 'transparent'}`,
                                color: viewMode === v ? T.textPrimary : T.textSecondary,
                                cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.06em',
                                transition: 'all 0.15s',
                            }}>
                                {v === 'map' ? '🗺 Map' : v === 'list' ? '≡ List' : '⚡ Scan'}
                            </button>
                        ))}
                    </div>
                </div>

                {/* ── Search + Filters */}
                <div style={{ marginBottom: 14 }}>
                    <input
                        type="text" placeholder="Search city, state, or service type…"
                        value={filters.search}
                        onChange={e => setFilters(p => ({ ...p, search: e.target.value }))}
                        style={{
                            width: '100%', padding: '10px 14px', borderRadius: 10,
                            background: T.bgCard, border: `1px solid ${T.border}`,
                            color: T.textPrimary, fontSize: 14, outline: 'none',
                            boxSizing: 'border-box', marginBottom: 10,
                            fontFamily: "'Inter', system-ui",
                            transition: 'border-color 0.15s',
                        }}
                        onFocus={e => (e.target.style.borderColor = `${T.gold}55`)}
                        onBlur={e => (e.target.style.borderColor = T.border)}
                    />
                    <FilterBar filters={filters} onChange={setFilters} count={filtered.length} />
                </div>

                {/* ── Content */}
                {loading ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {Array.from({ length: 6 }).map((_, i) => <LoadSkeleton key={i} />)}
                    </div>
                ) : (
                    <>
                        {/* MAP VIEW */}
                        {viewMode === 'map' && (
                            <div style={{
                                borderRadius: 14,
                                border: `1px solid ${T.border}`,
                                boxShadow: '0 20px 60px rgba(0,0,0,0.45)',
                                overflow: 'hidden',
                                display: 'flex',
                                flexDirection: 'row',
                                marginBottom: 20,
                            }}>
                                <MapCanvas loads={filtered} onSelect={setSelectedLoad} />
                                <MapSidebar
                                    selected={selectedLoad}
                                    totalLoads={filtered.length}
                                    hotCount={hotCount}
                                    stateCount={stateSet.size}
                                />
                            </div>
                        )}

                        {/* Recently filled strip */}
                        <RecentlyFilledStrip className="mb-5" />

                        {/* Load list — always visible below map, primary in list mode */}
                        {filtered.length === 0 ? (
                            <EmptyState filtered={isFiltered} />
                        ) : viewMode === 'scan' ? (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                                {filtered.map(load => (
                                    <ScanModeCard key={load.load_id} card={{
                                        id: load.load_id,
                                        origin_city: load.origin_city, origin_state: load.origin_state,
                                        destination_city: load.dest_city, destination_state: load.dest_state,
                                        service_required: load.service_required,
                                        move_date: new Date(load.posted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                                        rate_amount: load.rate_amount,
                                        status: (load.status as any) ?? 'open',
                                    }} />
                                ))}
                            </div>
                        ) : (
                            <div style={{
                                display: 'flex', flexDirection: 'column', gap: 12,
                                maxHeight: viewMode === 'map' ? 420 : undefined,
                                overflowY: viewMode === 'map' ? 'auto' : undefined,
                            }}>
                                {viewMode === 'map' && (
                                    <div style={{ fontSize: 10, fontWeight: 700, color: T.textLabel, textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 4 }}>
                                        All Loads ({filtered.length})
                                    </div>
                                )}
                                {filtered.map(load => (
                                    <LoadCard key={load.load_id} load={load} isNew={newLoadIds.has(load.load_id)} />
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}
