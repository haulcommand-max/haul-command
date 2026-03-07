'use client';

/**
 * ReputationCard — Full public reputation display
 * Layer A: Universal Trust Score (8 categories)
 * Layer B: Role-Specific Capability Modules
 * Adapts based on claimed/unclaimed state
 */

import type { TrustTier, CapabilityModule, BadgeType } from '@/lib/reputation-engine';
import { CAPABILITY_LABELS, BADGE_RULES } from '@/lib/reputation-engine';

// ── Types ──
interface CategoryScore {
    label: string;
    score: number;
    maxScore: number;
    icon: string;
}

interface CapabilityScore {
    module: CapabilityModule;
    score: number;
}

interface BadgeDisplay {
    type: BadgeType;
    label: string;
}

interface ReputationCardProps {
    claimed: boolean;
    businessName: string;
    claimUrl?: string;
    // Universal (Layer A)
    overallScore?: number;
    tier?: TrustTier;
    categories?: CategoryScore[];
    // Capabilities (Layer B)
    capabilities?: CapabilityScore[];
    // Badges
    badges?: BadgeDisplay[];
    // Operator dashboard mode
    showPrivate?: boolean;
    improvements?: { action: string; points: number; difficulty: string }[];
}

const TIER_STYLES: Record<TrustTier, { color: string; bg: string; border: string; label: string }> = {
    elite: { color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.4)', label: 'Elite' },
    strong: { color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.4)', label: 'Strong' },
    verified: { color: '#3B82F6', bg: 'rgba(59,130,246,0.12)', border: 'rgba(59,130,246,0.4)', label: 'Verified' },
    basic: { color: '#9CA3AF', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.3)', label: 'Basic' },
    unverified: { color: '#6B7280', bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)', label: 'Unverified' },
};

const DEFAULT_CATEGORIES: CategoryScore[] = [
    { label: 'Identity & Ownership', score: 0, maxScore: 10, icon: '🪪' },
    { label: 'Profile Strength', score: 0, maxScore: 15, icon: '📋' },
    { label: 'Verification & Compliance', score: 0, maxScore: 20, icon: '✅' },
    { label: 'Responsiveness', score: 0, maxScore: 10, icon: '⚡' },
    { label: 'Reliability', score: 0, maxScore: 15, icon: '🎯' },
    { label: 'Freshness', score: 0, maxScore: 10, icon: '🔄' },
    { label: 'Territory Coverage', score: 0, maxScore: 10, icon: '🗺️' },
    { label: 'Dispatch Readiness', score: 0, maxScore: 10, icon: '🚀' },
];

export default function ReputationCard({
    claimed,
    businessName,
    claimUrl,
    overallScore,
    tier,
    categories,
    capabilities,
    badges,
    showPrivate = false,
    improvements,
}: ReputationCardProps) {

    // ── UNCLAIMED: Locked state ──
    if (!claimed) {
        return (
            <div className="rep-card locked">
                <div className="rep-header">
                    <h3>Trust Report Card</h3>
                    <span className="rep-tier-badge" style={{ background: TIER_STYLES.unverified.bg, color: TIER_STYLES.unverified.color, borderColor: TIER_STYLES.unverified.border }}>
                        Locked
                    </span>
                </div>

                {/* Locked overall score */}
                <div className="rep-score-ring locked">
                    <span className="rep-score-num">—</span>
                    <span className="rep-score-label">Trust Score</span>
                </div>

                {/* Locked universal categories */}
                <div className="rep-categories">
                    {DEFAULT_CATEGORIES.map(c => (
                        <div key={c.label} className="rep-cat-row">
                            <div className="rep-cat-left">
                                <span className="rep-cat-icon">{c.icon}</span>
                                <span className="rep-cat-label">{c.label}</span>
                            </div>
                            <div className="rep-cat-right">
                                <div className="rep-bar-track">
                                    <div className="rep-bar-fill locked" style={{ width: '0%' }} />
                                </div>
                                <span className="rep-cat-status locked">🔒</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Locked capabilities */}
                <div className="rep-section">
                    <h4 className="rep-section-title">Role Capabilities</h4>
                    <div className="rep-caps-locked">
                        {Object.entries(CAPABILITY_LABELS).map(([key, label]) => (
                            <div key={key} className="rep-cap-item locked">
                                <span>{label}</span>
                                <span className="locked-text">🔒 Claim to activate</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="rep-cta">
                    <p className="rep-cta-text">Claim your listing to activate your Trust Report Card and start building reputation.</p>
                    {claimUrl && (
                        <a href={claimUrl} className="rep-cta-btn">Claim This Listing</a>
                    )}
                </div>

                <style jsx>{`${CARD_STYLES}`}</style>
            </div>
        );
    }

    // ── CLAIMED: Live state ──
    const activeTier = tier || 'unverified';
    const tierStyle = TIER_STYLES[activeTier];
    const score = overallScore ?? 0;
    const cats = categories || DEFAULT_CATEGORIES;
    const caps = capabilities || [];
    const badgeList = badges || [];

    return (
        <div className="rep-card live">
            <div className="rep-header">
                <h3>Trust Report Card</h3>
                <span className="rep-tier-badge" style={{ background: tierStyle.bg, color: tierStyle.color, borderColor: tierStyle.border }}>
                    {tierStyle.label}
                </span>
            </div>

            {/* Overall score ring */}
            <div className="rep-score-ring live">
                <span className="rep-score-num" style={{ color: tierStyle.color }}>{score}</span>
                <span className="rep-score-label">Trust Score</span>
            </div>

            {/* Universal categories */}
            <div className="rep-categories">
                {cats.map(c => {
                    const pct = c.maxScore > 0 ? Math.round((c.score / c.maxScore) * 100) : 0;
                    const barColor = pct >= 70 ? '#10B981' : pct >= 40 ? '#F59E0B' : '#EF4444';
                    return (
                        <div key={c.label} className="rep-cat-row">
                            <div className="rep-cat-left">
                                <span className="rep-cat-icon">{c.icon}</span>
                                <span className="rep-cat-label">{c.label}</span>
                            </div>
                            <div className="rep-cat-right">
                                <div className="rep-bar-track">
                                    <div className="rep-bar-fill" style={{ width: `${pct}%`, background: barColor }} />
                                </div>
                                <span className="rep-cat-score">{c.score}/{c.maxScore}</span>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Role Capabilities */}
            {caps.length > 0 && (
                <div className="rep-section">
                    <h4 className="rep-section-title">Role Capabilities</h4>
                    <div className="rep-caps-live">
                        {caps.map(cap => {
                            const label = CAPABILITY_LABELS[cap.module];
                            const barColor = cap.score >= 70 ? '#10B981' : cap.score >= 40 ? '#F59E0B' : '#EF4444';
                            return (
                                <div key={cap.module} className="rep-cap-item live">
                                    <div className="rep-cap-top">
                                        <span>{label}</span>
                                        <span style={{ color: barColor, fontWeight: 700 }}>{cap.score}</span>
                                    </div>
                                    <div className="rep-bar-track">
                                        <div className="rep-bar-fill" style={{ width: `${cap.score}%`, background: barColor }} />
                                    </div>
                                </div>
                            );
                        })}
                        {/* Not-offered roles */}
                        {Object.entries(CAPABILITY_LABELS)
                            .filter(([key]) => !caps.some(c => c.module === key))
                            .map(([key, label]) => (
                                <div key={key} className="rep-cap-item inactive">
                                    <span>{label}</span>
                                    <span className="inactive-text">Not Offered</span>
                                </div>
                            ))
                        }
                    </div>
                </div>
            )}

            {/* Badges */}
            {badgeList.length > 0 && (
                <div className="rep-section">
                    <h4 className="rep-section-title">Badges</h4>
                    <div className="rep-badges">
                        {badgeList.map(b => (
                            <span key={b.type} className="rep-badge" title={BADGE_RULES[b.type]?.requirement}>
                                {b.label}
                            </span>
                        ))}
                    </div>
                </div>
            )}

            {/* Private: Score Improvements (operator dashboard only) */}
            {showPrivate && improvements && improvements.length > 0 && (
                <div className="rep-section private">
                    <h4 className="rep-section-title">🔑 What Improves Your Score Fastest</h4>
                    <div className="rep-improvements">
                        {improvements.map((imp, i) => (
                            <div key={i} className="rep-imp-row">
                                <span className="rep-imp-action">{imp.action}</span>
                                <span className="rep-imp-points">+{imp.points} pts</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            <style jsx>{`${CARD_STYLES}`}</style>
        </div>
    );
}

// ── Shared styles ──
const CARD_STYLES = `
  .rep-card {
    background: linear-gradient(135deg, rgba(11,17,32,0.97), rgba(15,23,42,0.97));
    border-radius: 12px;
    padding: 24px;
    border: 1px solid rgba(255,255,255,0.08);
  }
  .rep-card.locked { border-color: rgba(239,68,68,0.2); }
  .rep-card.live { border-color: rgba(16,185,129,0.2); }
  .rep-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
  .rep-header h3 { font-size: 16px; font-weight: 700; color: #F9FAFB; margin: 0; }
  .rep-tier-badge {
    font-size: 11px; font-weight: 700; letter-spacing: 0.1em;
    text-transform: uppercase; padding: 4px 10px; border-radius: 6px;
    border: 1px solid;
  }
  .rep-score-ring {
    text-align: center; margin-bottom: 20px; padding: 16px 0;
  }
  .rep-score-num { display: block; font-size: 36px; font-weight: 800; }
  .rep-score-ring.locked .rep-score-num { color: #4B5563; }
  .rep-score-label { font-size: 12px; color: #6B7280; text-transform: uppercase; letter-spacing: 0.1em; }
  .rep-categories { display: flex; flex-direction: column; gap: 8px; }
  .rep-cat-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.04);
  }
  .rep-cat-left { display: flex; align-items: center; gap: 8px; flex: 0 0 180px; }
  .rep-cat-icon { font-size: 14px; }
  .rep-cat-label { font-size: 13px; color: #D1D5DB; }
  .rep-cat-right { display: flex; align-items: center; gap: 8px; flex: 1; }
  .rep-bar-track {
    flex: 1; height: 6px; background: rgba(255,255,255,0.06);
    border-radius: 3px; overflow: hidden;
  }
  .rep-bar-fill {
    height: 100%; border-radius: 3px;
    transition: width 0.5s ease;
  }
  .rep-bar-fill.locked { width: 0; }
  .rep-cat-score { font-size: 12px; color: #9CA3AF; min-width: 36px; text-align: right; }
  .rep-cat-status { font-size: 14px; min-width: 36px; text-align: right; }
  .rep-cat-status.locked { color: #6B7280; }
  .rep-section { margin-top: 20px; padding-top: 16px; border-top: 1px solid rgba(255,255,255,0.06); }
  .rep-section.private { border-top-color: rgba(245,158,11,0.2); }
  .rep-section-title { font-size: 13px; font-weight: 700; color: #D1D5DB; margin: 0 0 12px; }
  .rep-caps-locked, .rep-caps-live { display: flex; flex-direction: column; gap: 8px; }
  .rep-cap-item {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; border-radius: 8px; font-size: 13px;
  }
  .rep-cap-item.locked { background: rgba(255,255,255,0.03); color: #6B7280; }
  .locked-text { font-size: 12px; color: #4B5563; }
  .rep-cap-item.live { flex-direction: column; align-items: stretch; gap: 6px; background: rgba(255,255,255,0.03); }
  .rep-cap-top { display: flex; justify-content: space-between; font-size: 13px; color: #D1D5DB; }
  .rep-cap-item.inactive {
    background: rgba(255,255,255,0.02); color: #4B5563;
  }
  .inactive-text { font-size: 12px; font-style: italic; }
  .rep-badges { display: flex; flex-wrap: wrap; gap: 6px; }
  .rep-badge {
    font-size: 11px; padding: 4px 10px; border-radius: 6px;
    background: rgba(245,158,11,0.1); border: 1px solid rgba(245,158,11,0.25);
    color: #F59E0B; font-weight: 600; cursor: help;
  }
  .rep-improvements { display: flex; flex-direction: column; gap: 6px; }
  .rep-imp-row {
    display: flex; justify-content: space-between; align-items: center;
    padding: 8px 12px; background: rgba(245,158,11,0.06); border-radius: 8px;
    border: 1px solid rgba(245,158,11,0.12);
  }
  .rep-imp-action { font-size: 13px; color: #D1D5DB; }
  .rep-imp-points { font-size: 13px; font-weight: 700; color: #10B981; }
  .rep-cta {
    margin-top: 20px; padding-top: 16px; text-align: center;
    border-top: 1px solid rgba(255,255,255,0.06);
  }
  .rep-cta-text { font-size: 13px; color: #9CA3AF; margin: 0 0 12px; }
  .rep-cta-btn {
    display: inline-block; background: #F59E0B; color: #030712;
    font-weight: 700; padding: 12px 28px; border-radius: 8px;
    text-decoration: none; font-size: 14px; transition: all 0.2s;
  }
  .rep-cta-btn:hover { background: #D97706; transform: translateY(-1px); }
  @media (max-width: 480px) {
    .rep-cat-left { flex: 0 0 140px; }
    .rep-cat-label { font-size: 12px; }
  }
`;
