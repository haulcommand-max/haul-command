'use client';

import React from 'react';

/* ─── Trust Grade Tiers ──────────────────────────────────── */
type TrustGrade = 'A' | 'B' | 'C' | 'D' | 'F' | '—';

function computeGrade(score: number | null | undefined): TrustGrade {
  if (score == null || score <= 0) return '—';
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 40) return 'D';
  return 'F';
}

const gradeColors: Record<TrustGrade, { bg: string; border: string; text: string; glow: string }> = {
  A: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/40', text: 'text-emerald-400', glow: 'shadow-[0_0_16px_rgba(16,185,129,0.25)]' },
  B: { bg: 'bg-blue-500/10', border: 'border-blue-500/40', text: 'text-blue-400', glow: 'shadow-[0_0_16px_rgba(59,130,246,0.25)]' },
  C: { bg: 'bg-amber-500/10', border: 'border-amber-500/40', text: 'text-amber-400', glow: 'shadow-[0_0_16px_rgba(245,158,11,0.25)]' },
  D: { bg: 'bg-orange-500/10', border: 'border-orange-500/40', text: 'text-orange-400', glow: 'shadow-[0_0_12px_rgba(249,115,22,0.2)]' },
  F: { bg: 'bg-red-500/10', border: 'border-red-500/40', text: 'text-red-400', glow: 'shadow-[0_0_12px_rgba(239,68,68,0.2)]' },
  '—': { bg: 'bg-white/[0.03]', border: 'border-white/10', text: 'text-gray-500', glow: '' },
};

/* ─── Props ──────────────────────────────────────────────── */
interface TrustBadgeProps {
  overallTrustScore: number | null | undefined;
  aliveStatus: 'scraped' | 'claimed' | 'verified' | 'alive' | 'deactivated' | string;
  hcId?: string | null;
  /** compact = inline badge, full = card with breakdown */
  variant?: 'compact' | 'full';
  reliabilityScore?: number | null;
  complianceScore?: number | null;
  disputeRiskScore?: number | null;
  className?: string;
}

/* ─── Component ──────────────────────────────────────────── */
export default function TrustBadge({
  overallTrustScore,
  aliveStatus,
  hcId,
  variant = 'compact',
  reliabilityScore,
  complianceScore,
  disputeRiskScore,
  className = '',
}: TrustBadgeProps) {
  const grade = computeGrade(overallTrustScore);
  const colors = gradeColors[grade];
  const isVerified = aliveStatus === 'claimed' || aliveStatus === 'verified' || aliveStatus === 'alive';
  const statusLabel = isVerified ? 'Verified Haul Command Trust Score' : 'Estimated Score';

  if (variant === 'compact') {
    return (
      <div className={`inline-flex items-center gap-2 ${className}`}>
        {/* Grade Badge */}
        <div className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.border} border flex items-center justify-center ${colors.glow} transition-all`}>
          <span className={`font-black text-sm ${colors.text}`}>{grade}</span>
        </div>

        {/* HC-ID */}
        {hcId && (
          <span className="font-mono text-[10px] text-gray-500 bg-white/[0.04] border border-white/[0.06] px-1.5 py-0.5 rounded">
            {hcId}
          </span>
        )}

        {/* Status Indicator */}
        <div className="flex items-center gap-1">
          {isVerified ? (
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-1.5 h-1.5 rounded-full bg-gray-600" />
          )}
          <span className="text-[9px] text-gray-500 uppercase tracking-wider font-bold">
            {isVerified ? 'Verified' : 'Est.'}
          </span>
        </div>
      </div>
    );
  }

  /* ── Full Report Card Variant ──────────────────────────── */
  return (
    <div className={`${colors.bg} ${colors.border} border rounded-2xl p-5 ${colors.glow} transition-all ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl ${colors.bg} ${colors.border} border-2 flex items-center justify-center`}>
            <span className={`font-black text-2xl ${colors.text}`}>{grade}</span>
          </div>
          <div>
            <div className="text-white font-bold text-sm">{statusLabel}</div>
            {hcId && (
              <div className="font-mono text-[10px] text-gray-500 mt-0.5">{hcId}</div>
            )}
          </div>
        </div>

        {/* Status Chip */}
        <div className={`px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-wider ${
          isVerified
            ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
            : 'bg-white/[0.04] border border-white/10 text-gray-500'
        }`}>
          {isVerified ? '✓ Verified' : 'Estimated'}
        </div>
      </div>

      {/* Score Breakdown */}
      <div className="space-y-2">
        {[
          { label: 'Overall Trust', value: overallTrustScore },
          { label: 'Reliability', value: reliabilityScore },
          { label: 'Compliance', value: complianceScore },
          { label: 'Dispute Risk', value: disputeRiskScore, inverted: true },
        ].map((metric) => {
          const val = metric.value ?? 0;
          const displayVal = metric.inverted ? 100 - val : val;
          return (
            <div key={metric.label} className="flex items-center gap-3">
              <span className="text-[10px] text-gray-500 w-20 flex-shrink-0 uppercase tracking-wider">
                {metric.label}
              </span>
              <div className="flex-1 h-1.5 bg-white/[0.04] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    displayVal >= 75 ? 'bg-emerald-500' : displayVal >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(displayVal, 100)}%` }}
                />
              </div>
              <span className="text-[10px] text-gray-400 font-mono w-8 text-right">
                {val > 0 ? val : '—'}
              </span>
            </div>
          );
        })}
      </div>

      {/* Upgrade CTA for Scraped */}
      {!isVerified && (
        <div className="mt-4 pt-3 border-t border-white/[0.06]">
          <p className="text-[10px] text-gray-500 mb-2">
            This score is estimated from public data.
            Claim your profile to get a verified trust score.
          </p>
          <a
            href="/claim"
            className="inline-flex items-center gap-1.5 text-accent text-xs font-bold hover:underline"
          >
            Claim & Verify →
          </a>
        </div>
      )}
    </div>
  );
}

export { computeGrade, gradeColors };
export type { TrustGrade };
