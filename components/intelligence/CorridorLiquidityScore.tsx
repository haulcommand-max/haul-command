'use client';

/**
 * components/intelligence/CorridorLiquidityScore.tsx
 *
 * Displays a corridor's liquidity grade (A–F + numeric 0-100)
 * computed from supply, demand, fill time, coverage, and accept rate.
 *
 * Can be used inline on corridor pages, directory strips, and the map sidebar.
 *
 * Usage:
 *   <CorridorLiquidityScore
 *       supplyPct={28}
 *       demandScore={91}
 *       fillTimeMin={34}
 *       acceptRate={0.72}
 *   />
 */

import React from 'react';

interface LiquidityInputs {
    supplyPct: number;       // 0-100 (100 = abundant)
    demandScore: number;     // 0-100 (100 = max demand)
    fillTimeMin?: number;    // median minutes to fill — lower is better
    coverageDensity?: number; // escorts per 100mi radius (optional)
    acceptRate?: number;     // 0-1 acceptance rate (optional)
}

export interface LiquidityResult {
    score: number;           // 0-100
    grade: 'A' | 'B' | 'C' | 'D' | 'F';
    label: string;           // "Liquid" | "Active" | "Balanced" | "Thin" | "Critical"
    color: string;
    bgColor: string;
}

// ── Scoring formula ───────────────────────────────────────────
//
// Supply pressure (inverse — low supply = high pressure):
//   supply_pressure = (100 - supplyPct)              [0-100]
//
// Demand intensity:
//   demand_intensity = demandScore                   [0-100]
//
// Fill speed bonus (fillTimeMin < 60 = healthy):
//   fill_bonus = clamp(100 - fillTimeMin, 0, 40)     [0-40]
//
// Accept rate bonus:
//   accept_bonus = acceptRate * 20                   [0-20]
//
// Raw = (supply_pressure * 0.4) + (demand_intensity * 0.4) + (fill_bonus * 0.15) + (accept_bonus * 0.05)
// Score = clamp(100 - raw_imbalance, 0, 100) ... we want HIGH score = LIQUID
//
// Actually: liquid = supply high + demand moderate. Critical = supply low + demand high.
// Liquidity score: higher = better for operators (more work) + brokers (easier to fill)
//
// score = (supplyPct * 0.45) + ((100 - demandScore) * 0.20) + (fill_bonus * 0.25) + (accept_bonus * 0.10)
// Capped 0-100.

export function computeLiquidityScore(inputs: LiquidityInputs): LiquidityResult {
    const { supplyPct, demandScore, fillTimeMin = 60, acceptRate = 0.75 } = inputs;

    const supplyComponent = supplyPct * 0.45;
    const demandComponent = (100 - demandScore) * 0.20;
    const fillBonus = Math.max(0, Math.min(40, 100 - fillTimeMin)) * 0.25;
    const acceptBonus = Math.min(1, acceptRate) * 100 * 0.10;

    const raw = supplyComponent + demandComponent + fillBonus + acceptBonus;
    const score = Math.round(Math.max(0, Math.min(100, raw)));

    let grade: LiquidityResult['grade'];
    let label: string;
    let color: string;
    let bgColor: string;

    if (score >= 75) {
        grade = 'A'; label = 'Liquid'; color = '#27d17f'; bgColor = 'rgba(39,209,127,0.10)';
    } else if (score >= 60) {
        grade = 'B'; label = 'Active'; color = '#3ba4ff'; bgColor = 'rgba(59,164,255,0.10)';
    } else if (score >= 45) {
        grade = 'C'; label = 'Balanced'; color = '#f59e0b'; bgColor = 'rgba(245,158,11,0.10)';
    } else if (score >= 30) {
        grade = 'D'; label = 'Thin'; color = '#f97316'; bgColor = 'rgba(249,115,22,0.10)';
    } else {
        grade = 'F'; label = 'Critical'; color = '#f87171'; bgColor = 'rgba(248,113,113,0.10)';
    }

    return { score, grade, label, color, bgColor };
}

// ── Component ─────────────────────────────────────────────────

interface Props extends LiquidityInputs {
    /** "badge" = compact pill; "card" = full detail card; "inline" = just score+grade */
    variant?: 'badge' | 'card' | 'inline';
    corridorLabel?: string;
}

export default function CorridorLiquidityScore({
    supplyPct, demandScore, fillTimeMin, coverageDensity, acceptRate,
    variant = 'badge', corridorLabel,
}: Props) {
    const result = computeLiquidityScore({ supplyPct, demandScore, fillTimeMin, coverageDensity, acceptRate });

    if (variant === 'inline') {
        return (
            <span style={{ fontWeight: 900, color: result.color, fontSize: 13 }}>
                {result.grade} · {result.score}
            </span>
        );
    }

    if (variant === 'badge') {
        return (
            <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                padding: '3px 10px', borderRadius: 8,
                background: result.bgColor,
                border: `1px solid ${result.color}30`,
            }}>
                <span style={{ fontWeight: 900, color: result.color, fontSize: 11 }}>{result.grade}</span>
                <span style={{ fontSize: 10, color: result.color, fontWeight: 700 }}>{result.label}</span>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>{result.score}</span>
            </span>
        );
    }

    // Card variant
    return (
        <div style={{
            padding: '16px 20px', borderRadius: 16,
            background: result.bgColor, border: `1px solid ${result.color}25`,
        }}>
            {corridorLabel && (
                <div style={{ fontSize: 10, fontWeight: 800, color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 8 }}>
                    {corridorLabel}
                </div>
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <div>
                    <div style={{ fontSize: 42, fontWeight: 900, color: result.color, lineHeight: 1, fontFamily: 'JetBrains Mono, monospace' }}>
                        {result.grade}
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: result.color, marginTop: 2 }}>{result.label}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 28, fontWeight: 900, color: 'rgba(255,255,255,0.8)', lineHeight: 1 }}>{result.score}</div>
                    <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.3)' }}>Liquidity Score</div>
                </div>
            </div>

            {/* Score bar */}
            <div style={{ height: 4, borderRadius: 999, background: 'rgba(255,255,255,0.06)' }}>
                <div style={{
                    height: '100%', borderRadius: 999,
                    width: `${result.score}%`, background: result.color,
                    transition: 'width 1s ease',
                }} />
            </div>

            {/* Input breakdown */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 14 }}>
                {[
                    { label: 'Supply', value: `${supplyPct}%` },
                    { label: 'Demand', value: `${demandScore}/100` },
                    { label: 'Fill Time', value: fillTimeMin ? `${fillTimeMin}m` : '—' },
                    { label: 'Accept Rate', value: acceptRate ? `${Math.round(acceptRate * 100)}%` : '—' },
                ].map(({ label, value }) => (
                    <div key={label} style={{ fontSize: 11 }}>
                        <span style={{ color: 'rgba(255,255,255,0.35)', marginRight: 4 }}>{label}:</span>
                        <span style={{ color: 'rgba(255,255,255,0.7)', fontWeight: 700 }}>{value}</span>
                    </div>
                ))}
            </div>
        </div>
    );
}
