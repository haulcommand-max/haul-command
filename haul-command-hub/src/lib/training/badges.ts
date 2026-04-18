/**
 * Haul Command — Training Badge Engine
 * Badge issuance, state evaluation, and display logic.
 */
import type { TrainingBadgeSlug, TrainingBadgeStatus, TrainingUserBadge, TrainingRankContribution } from './types';
import { BADGE_META } from './types';

// ─── Badge state evaluation ──────────────────────────────────

export function getBadgeDisplayState(badge: TrainingUserBadge): {
  isActive: boolean;
  isExpired: boolean;
  isReviewDue: boolean;
  label: string;
  stateLabel: string;
  colorClass: string;
} {
  const now = new Date();
  const isExpired = badge.status === 'expired' || (badge.expires_at ? new Date(badge.expires_at) < now : false);
  const isReviewDue = badge.status === 'review_due' || (badge.review_due_at ? new Date(badge.review_due_at) < now : false);
  const isActive = badge.status === 'active' && !isExpired;

  const meta = BADGE_META[badge.badge_slug];
  let stateLabel = 'Active';
  let colorClass = 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';

  if (isExpired) {
    stateLabel = 'Expired';
    colorClass = 'text-red-400 border-red-400/30 bg-red-400/10';
  } else if (isReviewDue) {
    stateLabel = 'Review Due';
    colorClass = 'text-orange-400 border-orange-400/30 bg-orange-400/10';
  }

  return {
    isActive,
    isExpired,
    isReviewDue,
    label: meta?.label ?? badge.badge_slug,
    stateLabel,
    colorClass,
  };
}

// ─── Highest active badge for a user ────────────────────────
export function getHighestActiveBadge(badges: TrainingUserBadge[]): TrainingUserBadge | null {
  const active = badges.filter(b => b.status === 'active');
  if (!active.length) return null;
  return active.sort((a, b) => {
    const la = BADGE_META[a.badge_slug]?.level ?? 0;
    const lb = BADGE_META[b.badge_slug]?.level ?? 0;
    return lb - la;
  })[0] ?? null;
}

// ─── Rank contribution from training ─────────────────────────
export function calculateTrainingRankContribution(
  badges: TrainingUserBadge[],
  rankWeights: Record<TrainingBadgeSlug, number>,
): TrainingRankContribution {
  const highest = getHighestActiveBadge(badges);

  if (!highest) {
    return {
      badge_slug: null,
      badge_status: null,
      rank_boost: 0,
      is_expired: false,
      explanation: 'No completed training. Complete training to improve directory rank.',
    };
  }

  const state = getBadgeDisplayState(highest);
  const weight = rankWeights[highest.badge_slug] ?? 0;
  const effectiveBoost = state.isExpired ? 0 : state.isReviewDue ? weight * 0.5 : weight;

  return {
    badge_slug: highest.badge_slug,
    badge_status: highest.status,
    rank_boost: effectiveBoost,
    is_expired: state.isExpired,
    explanation: state.isExpired
      ? `${state.label} badge expired. Renew training to restore rank boost.`
      : state.isReviewDue
      ? `${state.label} badge review due. Refresh training to maintain full rank boost.`
      : `${state.label} badge active. Contributing +${(effectiveBoost * 100).toFixed(0)}% rank weight.`,
  };
}

// ─── Badge chip component data ───────────────────────────────
export interface BadgeChipData {
  slug: TrainingBadgeSlug;
  label: string;
  status: TrainingBadgeStatus;
  isActive: boolean;
  colorClass: string;
  description: string;
}

export function buildBadgeChipData(badge: TrainingUserBadge): BadgeChipData {
  const state = getBadgeDisplayState(badge);
  const meta = BADGE_META[badge.badge_slug];
  return {
    slug: badge.badge_slug,
    label: `${meta?.label ?? badge.badge_slug}${!state.isActive ? ` (${state.stateLabel})` : ''}`,
    status: badge.status,
    isActive: state.isActive,
    colorClass: state.colorClass,
    description: meta?.description ?? '',
  };
}

// ─── Badge requirement copy ──────────────────────────────────
export const BADGE_REQUIREMENTS: Record<TrainingBadgeSlug, string[]> = {
  road_ready: [
    'Complete 4-module foundational training',
    'Pass knowledge checks',
  ],
  certified: [
    'Complete 8-module core certification path',
    'Pass all knowledge checks',
    'Maintain active profile',
  ],
  elite: [
    'Complete 14-module advanced pathway',
    'Maintain training recency (annual)',
    'Meet profile completeness standards',
  ],
  av_ready: [
    'Complete AV-specific 6-module path',
    'Pass associated training assessments',
  ],
};

// ─── On-platform legal disclaimer ────────────────────────────
export const BADGE_DISCLAIMER =
  'Haul Command badges are on-platform credentials awarded for completing Haul Command training modules. ' +
  'They indicate training completion within the Haul Command platform and do not constitute or imply ' +
  'legal certification, licensing, or jurisdictional recognition unless explicitly stated. ' +
  'Check applicable state, provincial, or national regulations for legal requirements in your jurisdiction.';
