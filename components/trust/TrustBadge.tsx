'use client';

import React from 'react';

// ═══════════════════════════════════════════════════════════════
// TRUST BADGE — Visual trust signal for directory cards
//
// Purpose: Show operators' trustworthiness at a glance.
// Tiers based on composite trust score (0-100):
//   90+  = Command Elite (gold)
//   75+  = Verified Pro (emerald)
//   50+  = Active (blue)
//   25+  = Emerging (silver)
//   <25  = New (no badge — avoid negative signaling)
//
// Also supports legacy 'level' prop for backward compatibility.
//
// Inputs: composite_score and optional confidence level
// The badge is designed to:
//   1. Reward verified/active operators visually
//   2. Incentivize claims ("Claim to earn your badge")
//   3. Give brokers instant quality signals
// ═══════════════════════════════════════════════════════════════

export type TrustTier = 'elite' | 'pro' | 'active' | 'emerging' | 'new';

export interface TrustBadgeProps {
  /** Composite trust score 0-100 from CompositeTradeEngine */
  score?: number | null;
  /** Backward-compat: legacy tier level */
  level?: 'verified' | 'top_rated' | 'new';
  confidence?: 'low' | 'medium' | 'high' | 'very_high';
  isEmerging?: boolean;
  size?: 'sm' | 'md' | 'lg';
  showScore?: boolean;
  showLabel?: boolean;
}

const TIER_CONFIG: Record<TrustTier, {
  label: string;
  color: string;
  bg: string;
  border: string;
  glow: string;
  icon: string;
}> = {
  elite: {
    label: 'Command Elite',
    color: '#E4B872',
    bg: 'rgba(198,146,58,0.12)',
    border: 'rgba(198,146,58,0.35)',
    glow: '0 0 8px rgba(198,146,58,0.25)',
    icon: '⚡',
  },
  pro: {
    label: 'Verified Pro',
    color: '#34d399',
    bg: 'rgba(52,211,153,0.10)',
    border: 'rgba(52,211,153,0.25)',
    glow: '0 0 6px rgba(52,211,153,0.15)',
    icon: '✓',
  },
  active: {
    label: 'Active',
    color: '#60a5fa',
    bg: 'rgba(96,165,250,0.10)',
    border: 'rgba(96,165,250,0.22)',
    glow: 'none',
    icon: '●',
  },
  emerging: {
    label: 'Emerging',
    color: '#94a3b8',
    bg: 'rgba(148,163,184,0.08)',
    border: 'rgba(148,163,184,0.18)',
    glow: 'none',
    icon: '○',
  },
  new: {
    label: 'New',
    color: '#6b7280',
    bg: 'transparent',
    border: 'transparent',
    glow: 'none',
    icon: '',
  },
};

// Legacy level → tier mapping
const LEGACY_MAP: Record<string, TrustTier> = {
  verified: 'pro',
  top_rated: 'elite',
  new: 'emerging',
};

export function getTrustTier(score: number | null | undefined, legacyLevel?: string): TrustTier {
  // If legacy level provided and no score, use the mapping
  if ((score == null || score < 0) && legacyLevel) {
    return LEGACY_MAP[legacyLevel] || 'new';
  }
  if (score == null || score < 0) return 'new';
  if (score >= 90) return 'elite';
  if (score >= 75) return 'pro';
  if (score >= 50) return 'active';
  if (score >= 25) return 'emerging';
  return 'new';
}

export default function TrustBadge({
  score,
  level,
  confidence,
  isEmerging,
  size = 'sm',
  showScore = false,
  showLabel = true,
}: TrustBadgeProps) {
  const tier = getTrustTier(score, level);

  // Don't render anything for "new" tier — avoid negative signaling
  if (tier === 'new') return null;

  const cfg = TIER_CONFIG[tier];

  const sizes = {
    sm: { fontSize: 9, padding: '2px 7px', gap: 3, iconSize: 8 },
    md: { fontSize: 11, padding: '3px 10px', gap: 4, iconSize: 10 },
    lg: { fontSize: 13, padding: '5px 14px', gap: 5, iconSize: 13 },
  };

  const s = sizes[size];

  return (
    <span
      title={`Trust Score: ${score ?? '—'}/100${confidence ? ` (${confidence} confidence)` : ''}${isEmerging ? ' — Emerging operator' : ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: s.gap,
        fontSize: s.fontSize,
        fontWeight: 800,
        padding: s.padding,
        borderRadius: 6,
        background: cfg.bg,
        border: `1px solid ${cfg.border}`,
        color: cfg.color,
        textTransform: 'uppercase' as const,
        letterSpacing: '0.06em',
        boxShadow: cfg.glow,
        whiteSpace: 'nowrap' as const,
        lineHeight: 1.2,
        transition: 'all 0.2s ease',
      }}
    >
      {cfg.icon && (
        <span style={{ fontSize: s.iconSize, lineHeight: 1 }}>{cfg.icon}</span>
      )}
      {showLabel && cfg.label}
      {showScore && score != null && (
        <span style={{
          opacity: 0.7,
          fontSize: s.fontSize - 1,
          fontWeight: 700,
          fontVariantNumeric: 'tabular-nums',
        }}>
          {score}
        </span>
      )}
    </span>
  );
}

// ─── Trust Score Bar (for profile pages) ─────────────────────

export function TrustScoreBar({
  score,
  label,
}: {
  score: number | null | undefined;
  label?: string;
}) {
  const tier = getTrustTier(score);
  if (tier === 'new' || score == null) return null;
  const cfg = TIER_CONFIG[tier];
  const pct = Math.max(0, Math.min(100, score));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {label || 'Trust Score'}
        </span>
        <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color, fontVariantNumeric: 'tabular-nums' }}>
          {pct}/100
        </span>
      </div>
      <div style={{
        height: 6,
        borderRadius: 3,
        background: 'rgba(255,255,255,0.06)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: 3,
          background: `linear-gradient(90deg, ${cfg.color}, ${cfg.color}88)`,
          transition: 'width 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
          boxShadow: cfg.glow,
        }} />
      </div>
    </div>
  );
}
