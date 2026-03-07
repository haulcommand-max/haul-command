'use client';

/**
 * Profile Strength Meter — The 10× Completion Engine
 *
 * UI Copy (exact spec):
 *   Header: "profile strength"
 *   Subtext: "complete profiles show up higher in broker searches."
 *   Progress: "you're at {score}%"
 *   Next-step: single action, not list
 *   Milestones: 20/40/60/80/100 with toasts
 *   Visibility: "search visibility: {Low/Medium/High}"
 *   Loss-aversion: "you may be missing broker searches"
 *   Leaderboard gate: "complete 60% to appear on the leaderboard"
 *   Peer comparison: "operators in your region average: 72%"
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';

// ── Types ────────────────────────────────────────────────────────────────────

interface ProfileSection {
    key: string;
    label: string;
    section: string;
    present: boolean;
    visibility_gain: number;
}

interface SectionBreakdown {
    score: number;
    max: number;
    fields: ProfileSection[];
}

interface CompletionData {
    total: number;
    raw_total: number;
    sections: Record<string, SectionBreakdown>;
    gates_applied: string[];
    milestone_reached: number | null;
    milestones_passed: number[];
    visibility_level: 'high' | 'medium' | 'low' | 'hidden';
    next_best_step: { field: string; label: string; visibility_gain: number; section: string } | null;
    peer_avg: number | null;
}

interface MilestoneToast {
    milestone: number;
    message: string;
    boost_granted: string | null;
}

// ── Copy Constants ───────────────────────────────────────────────────────────

const MILESTONE_COPY: Record<number, { message: string; emoji: string }> = {
    20: { message: "nice — you're live. keep going.", emoji: '🟢' },
    40: { message: 'good. you just unlocked a small visibility boost (24h).', emoji: '🚀' },
    60: { message: "you're now eligible for full leaderboard ranking.", emoji: '🏆' },
    80: { message: 'strong profile. brokers trust this.', emoji: '💪' },
    100: { message: "perfect. you're fully optimized.", emoji: '✨' },
};

const SECTION_LABELS: Record<string, { label: string; emoji: string }> = {
    identity: { label: 'Identity', emoji: '👤' },
    coverage: { label: 'Coverage', emoji: '🗺️' },
    equipment: { label: 'Equipment', emoji: '🚗' },
    availability: { label: 'Availability', emoji: '📱' },
    trust: { label: 'Trust', emoji: '🛡️' },
    performance: { label: 'Performance', emoji: '📊' },
};

// ── Component ────────────────────────────────────────────────────────────────

export function ProfileStrengthMeter({
    userId,
    onAction,
    compact = false,
}: {
    userId: string;
    onAction?: (field: string) => void;
    compact?: boolean;
}) {
    const [data, setData] = useState<CompletionData | null>(null);
    const [animatedPct, setAnimatedPct] = useState(0);
    const [showSections, setShowSections] = useState(false);
    const [activeToast, setActiveToast] = useState<{ message: string; emoji: string } | null>(null);
    const prevScore = useRef(0);

    useEffect(() => {
        async function load() {
            try {
                const res = await fetch(`/api/operator/completion-score?userId=${userId}`);
                if (!res.ok) return;
                const json = await res.json();
                setData(json);

                // Check for new milestone toast
                if (json.milestone_reached && MILESTONE_COPY[json.milestone_reached]) {
                    setActiveToast(MILESTONE_COPY[json.milestone_reached]);
                    setTimeout(() => setActiveToast(null), 5000);
                }
            } catch { }
        }
        load();
    }, [userId]);

    // Animate progress bar
    useEffect(() => {
        if (!data) return;
        const target = data.total;
        const start = prevScore.current;
        let current = start;
        const step = Math.max(1, (target - start) / 40);
        const interval = setInterval(() => {
            current += step;
            if (current >= target) {
                current = target;
                clearInterval(interval);
            }
            setAnimatedPct(Math.round(current));
        }, 20);
        prevScore.current = target;
        return () => clearInterval(interval);
    }, [data]);

    if (!data) {
        return (
            <div style={{ background: '#0f172a', border: '1px solid #1e293b', borderRadius: 16, padding: 24 }}>
                <div style={{ height: 16, background: '#1e293b', borderRadius: 6, marginBottom: 12, width: '40%' }} />
                <div style={{ height: 10, background: '#1e293b', borderRadius: 4, width: '100%', marginBottom: 8 }} />
                <div style={{ height: 12, background: '#1e293b', borderRadius: 4, width: '60%' }} />
            </div>
        );
    }

    const pct = data.total;
    const barColor = pct >= 80 ? '#22c55e' : pct >= 50 ? '#fbbf24' : pct >= 25 ? '#f97316' : '#ef4444';
    const visColor = data.visibility_level === 'high' ? '#22c55e' : data.visibility_level === 'medium' ? '#fbbf24' : data.visibility_level === 'low' ? '#f97316' : '#ef4444';

    return (
        <div style={{
            background: '#0f172a', border: '1px solid #1e293b',
            borderRadius: 16, overflow: 'hidden', position: 'relative',
            fontFamily: "'Inter', system-ui, sans-serif",
        }}>
            {/* Milestone Toast */}
            {activeToast && (
                <div style={{
                    position: 'absolute', top: 0, left: 0, right: 0,
                    padding: '12px 20px',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.15), rgba(34,197,94,0.05))',
                    borderBottom: '1px solid rgba(34,197,94,0.2)',
                    display: 'flex', alignItems: 'center', gap: 10,
                    animation: 'slideDown 0.3s ease-out',
                    zIndex: 10,
                }}>
                    <span style={{ fontSize: 20 }}>{activeToast.emoji}</span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: '#22c55e' }}>{activeToast.message}</span>
                </div>
            )}

            {/* Main */}
            <div style={{ padding: activeToast ? '56px 24px 20px' : '20px 24px' }}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                    <div>
                        <div style={{ fontSize: 11, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            profile strength
                        </div>
                        <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
                            complete profiles show up higher in broker searches.
                        </div>
                    </div>

                    {/* Visibility badge */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                        <div style={{ fontSize: 9, fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.08em' }}>
                            search visibility
                        </div>
                        <div style={{
                            fontSize: 12, fontWeight: 800, color: visColor,
                            padding: '3px 10px', borderRadius: 6, marginTop: 3,
                            background: `${visColor}12`, border: `1px solid ${visColor}25`,
                            textTransform: 'capitalize',
                        }}>
                            {data.visibility_level}
                        </div>
                    </div>
                </div>

                {/* Score + Progress Bar */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
                    <span style={{ fontSize: 32, fontWeight: 900, color: barColor, fontFeatureSettings: '"tnum"' }}>
                        {animatedPct}%
                    </span>
                    <div style={{ flex: 1, height: 10, background: '#1e293b', borderRadius: 5, overflow: 'hidden' }}>
                        <div style={{
                            width: `${animatedPct}%`, height: '100%',
                            background: `linear-gradient(90deg, ${barColor}, ${barColor}cc)`,
                            borderRadius: 5, transition: 'width 0.3s ease-out',
                            boxShadow: `0 0 8px ${barColor}40`,
                        }} />
                    </div>
                </div>

                {/* Milestone markers */}
                <div style={{
                    display: 'flex', justifyContent: 'space-between', marginBottom: 14,
                    padding: '0 4px',
                }}>
                    {[20, 40, 60, 80, 100].map(m => (
                        <div key={m} style={{
                            fontSize: 9, fontWeight: 700,
                            color: data.milestones_passed.includes(m) ? '#22c55e' : '#334155',
                            textAlign: 'center',
                        }}>
                            {data.milestones_passed.includes(m) ? '●' : '○'} {m}
                        </div>
                    ))}
                </div>

                {/* Gate warnings */}
                {data.gates_applied.length > 0 && (
                    <div style={{
                        padding: '8px 12px', marginBottom: 12,
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.15)',
                        borderRadius: 8, fontSize: 11, color: '#f87171',
                    }}>
                        {data.gates_applied.includes('min_identity_gate') && (
                            <div>⚠️ add your name and phone to unlock above 35%</div>
                        )}
                        {data.gates_applied.includes('coverage_gate') && (
                            <div>⚠️ add coverage states to unlock above 55%</div>
                        )}
                    </div>
                )}

                {/* Loss-aversion nudge (incomplete + under 60) */}
                {pct < 60 && (
                    <div style={{
                        padding: '10px 14px', marginBottom: 12,
                        background: 'rgba(249,115,22,0.06)',
                        border: '1px solid rgba(249,115,22,0.15)',
                        borderRadius: 10, fontSize: 12, color: '#fb923c', fontWeight: 600,
                    }}>
                        your profile is {pct}% — you may be missing broker searches in your area.
                    </div>
                )}

                {/* Leaderboard gate (under 60) */}
                {pct < 60 && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 10,
                        padding: '8px 12px', marginBottom: 12,
                        background: 'rgba(99,102,241,0.06)',
                        border: '1px solid rgba(99,102,241,0.15)',
                        borderRadius: 8,
                    }}>
                        <span style={{ fontSize: 16 }}>🏆</span>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 11, fontWeight: 700, color: '#818cf8' }}>
                                complete 60% to appear on the leaderboard.
                            </div>
                            <div style={{ fontSize: 10, color: '#6366f1' }}>
                                {60 - pct}% to go
                            </div>
                        </div>
                        <button
                            onClick={() => onAction?.('coverage_states')}
                            style={{
                                padding: '5px 12px', borderRadius: 6, border: 'none',
                                background: '#6366f1', color: '#fff', fontSize: 10,
                                fontWeight: 800, cursor: 'pointer',
                            }}
                        >
                            get to 60%
                        </button>
                    </div>
                )}

                {/* Smart Next-Step (single action CTA) */}
                {data.next_best_step && (
                    <button
                        onClick={() => onAction?.(data.next_best_step!.field)}
                        style={{
                            width: '100%', padding: '14px 16px',
                            background: 'linear-gradient(135deg, rgba(249,115,22,0.08), rgba(249,115,22,0.02))',
                            border: '1px solid rgba(249,115,22,0.2)',
                            borderRadius: 12, cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: 12,
                            textAlign: 'left', transition: 'all 0.2s',
                            marginBottom: 12,
                        }}
                    >
                        <div style={{
                            width: 40, height: 40, borderRadius: 10,
                            background: 'rgba(249,115,22,0.12)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 18, flexShrink: 0,
                        }}>
                            🎯
                        </div>
                        <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 12, fontWeight: 800, color: '#fb923c' }}>
                                next best step: {data.next_best_step.label.toLowerCase()}
                            </div>
                            <div style={{ fontSize: 10, color: '#92846a' }}>
                                estimated visibility gain: +{data.next_best_step.visibility_gain}%
                            </div>
                        </div>
                        <div style={{
                            padding: '6px 14px', borderRadius: 8, border: 'none',
                            background: '#f97316', color: '#fff', fontSize: 11,
                            fontWeight: 800,
                        }}>
                            add now
                        </div>
                    </button>
                )}

                {/* Peer comparison */}
                {data.peer_avg !== null && (
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 12px', background: '#0a0f1e',
                        borderRadius: 8, border: '1px solid #1e293b',
                        marginBottom: 12,
                    }}>
                        <span style={{ fontSize: 12 }}>
                            {pct >= data.peer_avg ? '📈' : '📉'}
                        </span>
                        <span style={{ fontSize: 11, color: '#94a3b8' }}>
                            operators in your region average: <strong style={{ color: '#e2e8f0' }}>{data.peer_avg}%</strong>
                            {pct < data.peer_avg && (
                                <span style={{ color: '#f87171' }}> — you: {pct}%</span>
                            )}
                        </span>
                    </div>
                )}

                {/* Section toggle */}
                <button
                    onClick={() => setShowSections(!showSections)}
                    style={{
                        background: 'none', border: 'none', cursor: 'pointer',
                        fontSize: 11, fontWeight: 700, color: '#64748b',
                        display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                    }}
                >
                    {showSections ? '▾' : '▸'} {showSections ? 'hide' : 'show'} breakdown
                </button>
            </div>

            {/* Section breakdown */}
            {showSections && (
                <div style={{ padding: '0 24px 20px', borderTop: '1px solid #1e293b', paddingTop: 16 }}>
                    {Object.entries(data.sections).map(([key, section]) => {
                        const meta = SECTION_LABELS[key] ?? { label: key, emoji: '📋' };
                        return (
                            <div key={key} style={{ marginBottom: 14 }}>
                                <div style={{
                                    display: 'flex', justifyContent: 'space-between',
                                    alignItems: 'center', marginBottom: 6,
                                }}>
                                    <span style={{ fontSize: 11, fontWeight: 800, color: '#94a3b8' }}>
                                        {meta.emoji} {meta.label}
                                    </span>
                                    <span style={{
                                        fontSize: 10, fontWeight: 800,
                                        color: section.score >= section.max ? '#22c55e' : '#64748b',
                                        fontFeatureSettings: '"tnum"',
                                    }}>
                                        {section.score}/{section.max}
                                    </span>
                                </div>
                                {/* Mini progress bar */}
                                <div style={{
                                    width: '100%', height: 4, background: '#1e293b',
                                    borderRadius: 2, overflow: 'hidden', marginBottom: 6,
                                }}>
                                    <div style={{
                                        width: `${section.max > 0 ? (section.score / section.max) * 100 : 0}%`,
                                        height: '100%',
                                        background: section.score >= section.max ? '#22c55e' : '#f97316',
                                        borderRadius: 2,
                                    }} />
                                </div>
                                {/* Fields */}
                                {section.fields.map((f: ProfileSection) => (
                                    <div key={f.key} style={{
                                        display: 'flex', alignItems: 'center', gap: 8,
                                        padding: '3px 0', fontSize: 11,
                                    }}>
                                        <span style={{ color: f.present ? '#22c55e' : '#334155', fontSize: 10 }}>
                                            {f.present ? '✓' : '○'}
                                        </span>
                                        <span style={{
                                            color: f.present ? '#64748b' : '#e2e8f0',
                                            fontWeight: f.present ? 400 : 600,
                                            flex: 1,
                                        }}>
                                            {f.label}
                                        </span>
                                        {!f.present && (
                                            <button
                                                onClick={() => onAction?.(f.key)}
                                                style={{
                                                    fontSize: 9, fontWeight: 800, color: '#f97316',
                                                    background: 'none', border: 'none', cursor: 'pointer',
                                                    padding: 0,
                                                }}
                                            >
                                                +{f.visibility_gain}%
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                </div>
            )}

            {/* Elite banner (80%+) */}
            {pct >= 80 && (
                <div style={{
                    padding: '10px 24px',
                    background: 'linear-gradient(135deg, rgba(34,197,94,0.08), rgba(34,197,94,0.02))',
                    borderTop: '1px solid rgba(34,197,94,0.15)',
                    fontSize: 12, fontWeight: 700, color: '#22c55e', textAlign: 'center',
                }}>
                    {pct >= 100 ? "✨ perfect. you're fully optimized." : '💪 strong profile. brokers trust this.'}
                </div>
            )}

            <style>{`
                @keyframes slideDown { from { transform: translateY(-100%); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            `}</style>
        </div>
    );
}

export default ProfileStrengthMeter;
