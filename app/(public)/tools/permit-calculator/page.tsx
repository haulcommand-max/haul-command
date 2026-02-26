'use client';

import React, { useState, useMemo } from 'react';
import { Shield, Calculator, Zap, AlertTriangle, CheckCircle2, XCircle, Info, ChevronDown } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { estimateEscortCost } from '@/lib/data/corridors';

// ── Types ────────────────────────────────────────────────────────────────────

interface LoadDimensions {
    widthFt: number;
    heightFt: number;
    lengthFt: number;
    weightLbs: number;
}

interface StateResult {
    state: string;
    code: string;
    escortsRequired: string;
    policeRequired: boolean;
    nightMovement: 'allowed' | 'restricted' | 'prohibited';
    notes: string;
    escortCostEstimate: { low: number; high: number };
}

// ── Per-state rules (simplified — shows the logic model) ─────────────────────

const STATE_RULES: Record<string, {
    name: string;
    escortWidthFt: number;      // civilian escort triggers here
    policeWidthFt: number;
    nightWidthFt: number | null; // prohibited above this, null = restricted
    escortConfig: (w: number) => string;
    notes: (d: LoadDimensions) => string;
}> = {
    TX: { name: "Texas", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (w) => w >= 18 ? "2 Front + 2 Rear" : "1 Front + 1 Rear", notes: (d) => d.widthFt >= 18 ? "Superload: route survey + structural clearance required." : "TxDOT ePermit required. 48hr processing standard." },
    FL: { name: "Florida", escortWidthFt: 14, policeWidthFt: 16, nightWidthFt: 16, escortConfig: (w) => w >= 16 ? "2 Front + 2 Rear" : "1 Front + 1 Rear", notes: (d) => d.widthFt >= 14 ? "Rush hour restrictions in Miami-Dade and Broward. FDOT ePPermit required." : "Standard permit. No escort required under 14ft wide." },
    LA: { name: "Louisiana", escortWidthFt: 14, policeWidthFt: 16, nightWidthFt: 14, escortConfig: (_) => "1 Front + 1 Rear", notes: (d) => d.widthFt >= 14 ? "Night movement PROHIBITED for loads wider than 14ft." : "DOTD permit portal required." },
    GA: { name: "Georgia", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (d) => d.widthFt >= 16 ? "Pre-move route notification required for loads >16ft wide." : "GDOT ePPermitting." },
    OH: { name: "Ohio", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (d) => d.widthFt >= 18 ? "State police escort required. Schedule with local district." : "ODOT permit required." },
    MS: { name: "Mississippi", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Weekend restrictions on Pearl River bridges." },
    AL: { name: "Alabama", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "ALDOT online permit. Holiday blackouts apply Oct–Jan." },
    TN: { name: "Tennessee", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "TDOT permit. Spring weight restrictions Feb–Mar statewide." },
    KY: { name: "Kentucky", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Annual permits available for repeat routes." },
    OK: { name: "Oklahoma", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "ODOT permit. Turnpike-specific rules. Event period blackouts Sep." },
    KS: { name: "Kansas", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Annual permits available. Night movement allowed in rural areas." },
    MO: { name: "Missouri", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "MoDOT portal. KC metro has additional peak hour restrictions." },
    IA: { name: "Iowa", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Iowa DOT permit. Spring load restrictions April–May." },
    MN: { name: "Minnesota", escortWidthFt: 14, policeWidthFt: 16, nightWidthFt: null, escortConfig: (w) => w >= 16 ? "2 Front + 2 Rear" : "1 Front + 1 Rear", notes: (_) => "MNDOT 5-day processing for wide loads. Twin Cities metro restricted." },
    CA: { name: "California", escortWidthFt: 14, policeWidthFt: 20, nightWidthFt: null, escortConfig: (w) => w >= 16 ? "1 Front + 1 Rear + Route Survey" : "1 Front", notes: (d) => d.widthFt >= 16 ? "Route survey required for loads >16ft wide. Caltrans permit." : "Caltrans permit required." },
    AZ: { name: "Arizona", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "ADOT online portal. 24-48hr permit processing." },
    NM: { name: "New Mexico", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Annual permits available for repeat routes." },
    SC: { name: "South Carolina", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Port of Charleston specific routing requirements for port deliveries." },
    MI: { name: "Michigan", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "MDOT online permit. Annual superload permits for industrial shippers." },
    NC: { name: "North Carolina", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "NCDOT permit. Mountain routes require additional review." },
    VA: { name: "Virginia", escortWidthFt: 14, policeWidthFt: 18, nightWidthFt: null, escortConfig: (_) => "1 Front + 1 Rear", notes: (_) => "Virginia DOT permit portal." },
};

const US_STATES = Object.entries(STATE_RULES)
    .map(([code, r]) => ({ code, name: r.name }))
    .sort((a, b) => a.name.localeCompare(b.name));

// ── Calculation engine ────────────────────────────────────────────────────────

function computeStateResults(dims: LoadDimensions, states: string[], miles: number): StateResult[] {
    const milesPerState = miles / Math.max(states.length, 1);

    return states.map((code) => {
        const rule = STATE_RULES[code];
        if (!rule) return null;

        const needsEscort = dims.widthFt >= rule.escortWidthFt || dims.heightFt >= 14.5;
        const policeRequired = dims.widthFt >= rule.policeWidthFt;

        let nightMovement: 'allowed' | 'restricted' | 'prohibited' = 'allowed';
        if (rule.nightWidthFt !== null && dims.widthFt >= rule.nightWidthFt) {
            nightMovement = 'prohibited';
        } else if (needsEscort) {
            nightMovement = 'restricted';
        }

        const escortCount = needsEscort ? (rule.escortConfig(dims.widthFt).split('+').length) : 0;

        return {
            state: rule.name,
            code,
            escortsRequired: needsEscort ? rule.escortConfig(dims.widthFt) : "None",
            policeRequired,
            nightMovement,
            notes: rule.notes(dims),
            escortCostEstimate: needsEscort ? estimateEscortCost(milesPerState, escortCount) : { low: 0, high: 0 },
        } satisfies StateResult;
    }).filter((r): r is StateResult => r !== null);
}

// ── Small UI helpers ──────────────────────────────────────────────────────────

const T = {
    bg: '#060b12', panel: '#0d1520', card: '#111922',
    border: 'rgba(255,255,255,0.08)', gold: '#f5b942',
    green: '#27d17f', red: '#f87171', amber: '#f59e0b',
    blue: '#3ba4ff', text: '#e2eaf4', muted: '#8fa3b8',
} as const;

function inp(extra?: React.CSSProperties): React.CSSProperties {
    return {
        width: '100%', padding: '12px 14px', borderRadius: 12,
        background: T.panel, border: `1px solid ${T.border}`,
        color: T.text, fontSize: 15, fontFamily: "'JetBrains Mono', monospace",
        outline: 'none', boxSizing: 'border-box',
        ...extra,
    };
}

function NightBadge({ status }: { status: 'allowed' | 'restricted' | 'prohibited' }) {
    const cfg = {
        allowed: { bg: 'rgba(39,209,127,0.12)', color: T.green, border: 'rgba(39,209,127,0.3)', label: '✓ Night OK' },
        restricted: { bg: 'rgba(245,158,11,0.12)', color: T.amber, border: 'rgba(245,158,11,0.3)', label: '⚠ Night Restricted' },
        prohibited: { bg: 'rgba(248,113,113,0.12)', color: T.red, border: 'rgba(248,113,113,0.3)', label: '✗ Night Banned' },
    }[status];
    return (
        <span style={{ display: 'inline-block', padding: '2px 9px', borderRadius: 8, background: cfg.bg, color: cfg.color, border: `1px solid ${cfg.border}`, fontSize: 10, fontWeight: 800 }}>
            {cfg.label}
        </span>
    );
}

// ─────────────────────────────────────────────────────────────────────────────

export default function PermitCalculatorPage() {
    const [dims, setDims] = useState<LoadDimensions>({ widthFt: 14, heightFt: 14, lengthFt: 80, weightLbs: 120000 });
    const [miles, setMiles] = useState<number>(600);
    const [selectedStates, setSelectedStates] = useState<string[]>(['TX', 'LA', 'MS', 'AL', 'FL']);
    const [showResults, setShowResults] = useState(false);
    const [tier, setTier] = useState<'standard' | 'priority' | 'premium'>('standard');

    const results = useMemo(() => {
        if (!showResults) return [];
        return computeStateResults(dims, selectedStates, miles);
    }, [dims, selectedStates, miles, showResults, tier]);

    const totalCost = useMemo(() => {
        if (!results.length) return null;
        const low = results.reduce((s, r) => s + r.escortCostEstimate.low, 0);
        const high = results.reduce((s, r) => s + r.escortCostEstimate.high, 0);
        return { low, high };
    }, [results]);

    const maxEscorts = useMemo(() => {
        return results.reduce((max, r) => {
            const count = r.escortsRequired === 'None' ? 0 : (r.escortsRequired.split('+').length);
            return Math.max(max, count);
        }, 0);
    }, [results]);

    const policeStates = results.filter(r => r.policeRequired);
    const nightBanStates = results.filter(r => r.nightMovement === 'prohibited');

    function toggleState(code: string) {
        setSelectedStates(prev =>
            prev.includes(code) ? prev.filter(c => c !== code) : [...prev, code]
        );
    }

    const needsEscort = dims.widthFt >= 14 || dims.heightFt >= 14.5;

    return (
        <div style={{ background: T.bg, minHeight: '100vh', color: T.text }}>
            <div style={{ maxWidth: 1100, margin: '0 auto', padding: '28px 18px' }}>

                {/* Header */}
                <div style={{ textAlign: 'center', marginBottom: 36 }}>
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 14px', borderRadius: 20, background: 'rgba(245,185,66,0.1)', border: '1px solid rgba(245,185,66,0.25)', color: T.gold, fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>
                        <Zap size={12} /> Free Broker Intelligence Tool
                    </div>
                    <h1 style={{ fontSize: 'clamp(28px, 5vw, 52px)', fontWeight: 900, color: '#fff', margin: '0 0 12px', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
                        Oversize Load <span style={{ color: T.gold }}>Permit Matrix</span>
                    </h1>
                    <p style={{ fontSize: 16, color: T.muted, maxWidth: 640, margin: '0 auto' }}>
                        Calculate escort configurations, police triggers, night movement restrictions,
                        and estimated costs for any multi-state route — instantly.
                    </p>
                </div>

                <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>

                    {/* ── Input Panel ── */}
                    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, marginBottom: 20 }}>
                            <Calculator size={14} style={{ display: 'inline', marginRight: 6 }} /> Load Dimensions
                        </h2>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                            {([
                                ['Width (ft)', 'widthFt', dims.widthFt, 1, 30],
                                ['Height (ft)', 'heightFt', dims.heightFt, 1, 25],
                                ['Length (ft)', 'lengthFt', dims.lengthFt, 10, 300],
                                ['Gross Weight (lbs)', 'weightLbs', dims.weightLbs, 1000, 2000000],
                            ] as const).map(([label, key, val, min, max]) => (
                                <label key={key} style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>{label}</span>
                                    <input
                                        type="number"
                                        min={min} max={max}
                                        value={val}
                                        onChange={e => setDims(d => ({ ...d, [key]: Number(e.target.value) }))}
                                        style={{ ...inp(), fontSize: 20, fontWeight: 900 }}
                                    />
                                </label>
                            ))}
                        </div>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>Route Miles (total)</span>
                            <input type="number" min={1} max={5000} value={miles} onChange={e => setMiles(Number(e.target.value))} style={{ ...inp(), fontSize: 20, fontWeight: 900 }} />
                        </label>

                        <label style={{ display: 'flex', flexDirection: 'column', gap: 6, marginTop: 14 }}>
                            <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: T.muted }}>Rate Tier</span>
                            <select value={tier} onChange={e => setTier(e.target.value as any)} style={inp({ appearance: 'auto' })}>
                                <option value="standard">Standard ($2.60/mi base)</option>
                                <option value="priority">Priority ($3.20/mi base)</option>
                                <option value="premium">Premium ($3.80/mi base)</option>
                            </select>
                        </label>

                        {/* Dimension alert */}
                        {dims.widthFt >= 14 && (
                            <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.22)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <AlertTriangle size={14} color={T.amber} style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ fontSize: 12, color: T.amber, lineHeight: 1.5 }}>
                                    <strong>Oversize load detected:</strong> width ≥14ft triggers pilot car requirements in all 50 states. Select states below to see per-state breakdown.
                                </div>
                            </div>
                        )}
                        {dims.widthFt >= 18 && (
                            <div style={{ marginTop: 8, padding: '10px 14px', borderRadius: 12, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                                <AlertTriangle size={14} color={T.red} style={{ marginTop: 2, flexShrink: 0 }} />
                                <div style={{ fontSize: 12, color: T.red, lineHeight: 1.5 }}>
                                    <strong>Superload:</strong> width ≥18ft triggers police escort requirements in TX, OH, MN and others. Route surveys likely required.
                                </div>
                            </div>
                        )}
                    </div>

                    {/* ── State Selector ── */}
                    <div style={{ background: T.panel, border: `1px solid ${T.border}`, borderRadius: 20, padding: 24 }}>
                        <h2 style={{ fontSize: 15, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: T.muted, marginBottom: 8 }}>
                            States On Route
                        </h2>
                        <p style={{ fontSize: 12, color: T.muted, marginBottom: 14 }}>Select all states your load will pass through.</p>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, maxHeight: 260, overflowY: 'auto' }}>
                            {US_STATES.map(({ code, name }) => {
                                const active = selectedStates.includes(code);
                                return (
                                    <button key={code} onClick={() => toggleState(code)} style={{
                                        padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all 0.12s',
                                        background: active ? 'rgba(245,185,66,0.15)' : 'rgba(255,255,255,0.03)',
                                        border: `1px solid ${active ? 'rgba(245,185,66,0.4)' : T.border}`,
                                        color: active ? T.gold : T.muted,
                                    }}>
                                        {code}
                                    </button>
                                );
                            })}
                        </div>
                        <p style={{ margin: '10px 0 0', fontSize: 11, color: T.muted }}>{selectedStates.length} states selected</p>

                        <button
                            onClick={() => { setShowResults(true); window.scrollTo({ top: 999, behavior: 'smooth' }); }}
                            disabled={selectedStates.length === 0}
                            style={{
                                width: '100%', marginTop: 20, padding: 16, borderRadius: 14,
                                background: selectedStates.length === 0 ? T.border : `linear-gradient(135deg, ${T.gold}, #d97706)`,
                                color: '#000', fontWeight: 900, fontSize: 14,
                                textTransform: 'uppercase', letterSpacing: '0.06em',
                                border: 'none', cursor: selectedStates.length === 0 ? 'not-allowed' : 'pointer',
                                boxShadow: selectedStates.length > 0 ? '0 0 24px rgba(245,185,66,0.25)' : 'none',
                                transition: 'all 0.2s',
                            }}
                        >
                            Run Compliance Check →
                        </button>
                    </div>
                </div>

                {/* ── Results ── */}
                {showResults && results.length > 0 && (
                    <div style={{ marginTop: 28 }}>

                        {/* Summary bar */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 20 }}>
                            {[
                                { label: 'Max Escorts', val: maxEscorts + (maxEscorts === 0 ? '' : ' units'), color: maxEscorts >= 3 ? T.red : maxEscorts >= 2 ? T.amber : T.green },
                                { label: 'States w/ Police', val: policeStates.length > 0 ? policeStates.map(r => r.code).join(', ') : '—', color: policeStates.length > 0 ? T.red : T.green },
                                { label: 'Night Bans', val: nightBanStates.length > 0 ? nightBanStates.map(r => r.code).join(', ') : '— None', color: nightBanStates.length > 0 ? T.amber : T.green },
                                { label: 'Est. Total Cost', val: totalCost ? `$${totalCost.low.toLocaleString()} – $${totalCost.high.toLocaleString()}` : '—', color: T.gold },
                            ].map(({ label, val, color }) => (
                                <div key={label} style={{ background: T.card, border: `1px solid ${T.border}`, borderRadius: 14, padding: '14px 16px' }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: T.muted, marginBottom: 6 }}>{label}</div>
                                    <div style={{ fontSize: 15, fontWeight: 900, color, fontFamily: "'JetBrains Mono', monospace", lineHeight: 1.2 }}>{val}</div>
                                </div>
                            ))}
                        </div>

                        {/* Per-state cards */}
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                            {results.map(r => (
                                <div key={r.code} style={{ background: T.card, border: `1px solid ${r.policeRequired ? 'rgba(248,113,113,0.3)' : T.border}`, borderRadius: 14, padding: '14px 18px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8 }}>
                                        <div>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                                                <span style={{ fontSize: 15, fontWeight: 900, color: '#fff' }}>{r.state}</span>
                                                {r.policeRequired && (
                                                    <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 10, fontWeight: 800, background: 'rgba(248,113,113,0.15)', color: T.red, border: '1px solid rgba(248,113,113,0.3)', textTransform: 'uppercase' }}>
                                                        🚔 Police Required
                                                    </span>
                                                )}
                                                <NightBadge status={r.nightMovement} />
                                            </div>
                                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                                                <span style={{ fontSize: 12, color: T.muted }}><strong style={{ color: T.text }}>Escorts:</strong> {r.escortsRequired}</span>
                                                {r.escortCostEstimate.low > 0 && (
                                                    <span style={{ fontSize: 12, color: T.muted }}>
                                                        · <strong style={{ color: T.gold }}>${r.escortCostEstimate.low.toLocaleString()}–${r.escortCostEstimate.high.toLocaleString()}</strong> est.
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <p style={{ margin: '8px 0 0', fontSize: 12, color: T.muted, lineHeight: 1.5 }}>{r.notes}</p>
                                </div>
                            ))}
                        </div>

                        {/* CTA hook */}
                        <div style={{ marginTop: 24, padding: 24, borderRadius: 20, background: 'rgba(245,185,66,0.06)', border: '1px solid rgba(245,185,66,0.2)', display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <div style={{ fontSize: 16, fontWeight: 900, color: T.gold }}>Need these escorts right now?</div>
                            <p style={{ margin: 0, fontSize: 13, color: T.muted, lineHeight: 1.6 }}>
                                Post to the Haul Command network — 847 certified escort operators across{' '}
                                {results.map(r => r.state).join(', ')} and beyond. Average fill time: <strong style={{ color: T.text }}>8 minutes</strong> for active loads.
                            </p>
                            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                                <Link href="/loads/new" style={{ padding: '12px 24px', borderRadius: 12, background: `linear-gradient(135deg, ${T.gold}, #d97706)`, color: '#000', fontWeight: 900, fontSize: 13, textDecoration: 'none', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                    Post Load → Get Quotes
                                </Link>
                                <Link href="/directory" style={{ padding: '12px 24px', borderRadius: 12, background: 'transparent', border: `1px solid ${T.border}`, color: T.text, fontWeight: 700, fontSize: 13, textDecoration: 'none' }}>
                                    Browse Escort Directory
                                </Link>
                            </div>
                        </div>

                        {/* Disclaimer */}
                        <div style={{ marginTop: 16, padding: '10px 14px', borderRadius: 10, background: 'rgba(255,255,255,0.02)', border: `1px solid ${T.border}` }}>
                            <p style={{ margin: 0, fontSize: 11, color: T.muted, lineHeight: 1.6 }}>
                                <Info size={11} style={{ display: 'inline', marginRight: 4 }} />
                                Estimates are for planning purposes only. Requirements change frequently — always confirm with each state DOT before move.
                                Cost estimates assume {tier} tier operators and do not include permit fees, fuel surcharges, or police overtime rates.
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
