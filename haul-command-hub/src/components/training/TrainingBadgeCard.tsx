'use client';

import { BADGE_META } from '@/lib/training/types';
import type { TrainingBadgeSlug, TrainingBadgeStatus } from '@/lib/training/types';
import { getBadgeDisplayState } from '@/lib/training/badges';
import { BADGE_DISCLAIMER } from '@/lib/training/badges';
import { ShieldCheck, Clock, AlertTriangle } from 'lucide-react';

interface TrainingBadgeCardProps {
  badgeSlug: TrainingBadgeSlug;
  status: TrainingBadgeStatus;
  issuedAt?: string;
  expiresAt?: string;
  reviewDueAt?: string;
  /** Show disclaimer beneath card */
  showDisclaimer?: boolean;
  /** Compact variant for profile strips */
  compact?: boolean;
}

export default function TrainingBadgeCard({
  badgeSlug,
  status,
  issuedAt,
  expiresAt,
  reviewDueAt,
  showDisclaimer = false,
  compact = false,
}: TrainingBadgeCardProps) {
  const meta = BADGE_META[badgeSlug];
  const state = getBadgeDisplayState({ badge_slug: badgeSlug, status, issued_at: issuedAt ?? '', expires_at: expiresAt, review_due_at: reviewDueAt });

  const Icon = state.isExpired
    ? AlertTriangle
    : state.isReviewDue
    ? Clock
    : ShieldCheck;

  if (compact) {
    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${state.colorClass}`}>
        <Icon size={11} />
        {state.label}
        {!state.isActive && (
          <span className="opacity-70">• {state.stateLabel}</span>
        )}
      </span>
    );
  }

  return (
    <div className="border border-white/10 rounded-xl p-5 bg-white/[0.03] hover:border-white/20 transition-colors">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center border ${state.colorClass}`}>
            <Icon size={20} />
          </div>
          <div>
            <div className="font-bold text-white text-sm">{meta?.label ?? badgeSlug}</div>
            <div className={`text-xs ${state.isActive ? 'text-green-400' : 'text-orange-400'}`}>
              {state.stateLabel}
            </div>
          </div>
        </div>
        <span className={`text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded border ${state.colorClass}`}>
          Level {meta?.level ?? '—'}
        </span>
      </div>

      <p className="text-xs text-gray-400 leading-relaxed mb-3">
        {meta?.description}
      </p>

      {(issuedAt || expiresAt || reviewDueAt) && (
        <div className="border-t border-white/5 pt-3 space-y-1">
          {issuedAt && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Issued</span>
              <span className="text-gray-300">{new Date(issuedAt).toLocaleDateString()}</span>
            </div>
          )}
          {expiresAt && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Expires</span>
              <span className={state.isExpired ? 'text-red-400' : 'text-gray-300'}>
                {new Date(expiresAt).toLocaleDateString()}
              </span>
            </div>
          )}
          {reviewDueAt && !expiresAt && (
            <div className="flex justify-between text-[11px]">
              <span className="text-gray-500">Review due</span>
              <span className={state.isReviewDue ? 'text-orange-400' : 'text-gray-300'}>
                {new Date(reviewDueAt).toLocaleDateString()}
              </span>
            </div>
          )}
        </div>
      )}

      {showDisclaimer && (
        <p className="mt-3 text-[10px] text-gray-600 leading-relaxed border-t border-white/5 pt-3">
          {BADGE_DISCLAIMER}
        </p>
      )}
    </div>
  );
}
