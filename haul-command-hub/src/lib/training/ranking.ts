/**
 * Haul Command — Training Ranking Integration
 * Defines how training/badges feed into the profile rank formula.
 * Follows the training_monetization_engine spec.
 */
import type { TrainingBadgeSlug, TrainingUserBadge } from './types';
import { BADGE_META } from './types';
import { getHighestActiveBadge, getBadgeDisplayState } from './badges';

// ─── Rank weight caps per badge tier ────────────────────────
// These values combine with other rank signals (proof, freshness, response, local)
// Training alone never outranks stronger proof/trust signals.
export const TRAINING_RANK_WEIGHTS: Record<TrainingBadgeSlug, number> = {
  road_ready: 0.10,
  certified:  0.25,
  elite:      0.45,
  av_ready:   0.35,
};

// Max contribution of training to overall rank (safety cap)
export const TRAINING_MAX_RANK_CONTRIBUTION = 0.45;

// ─── Compute training rank component ────────────────────────
export interface TrainingRankComponent {
  raw_boost: number;          // before expiry/review penalties
  effective_boost: number;    // after expiry/review penalties
  badge_slug: TrainingBadgeSlug | null;
  is_capped: boolean;
  rank_explanation: string;
  upgrade_prompt: string | null;
}

export function computeTrainingRankComponent(badges: TrainingUserBadge[]): TrainingRankComponent {
  const highest = getHighestActiveBadge(badges);

  if (!highest) {
    return {
      raw_boost: 0,
      effective_boost: 0,
      badge_slug: null,
      is_capped: false,
      rank_explanation: 'No training completed.',
      upgrade_prompt: 'Complete Road Ready training to begin building rank advantage.',
    };
  }

  const state = getBadgeDisplayState(highest);
  const raw = TRAINING_RANK_WEIGHTS[highest.badge_slug] ?? 0;
  const effective = state.isExpired ? 0 : state.isReviewDue ? raw * 0.5 : raw;
  const capped = Math.min(effective, TRAINING_MAX_RANK_CONTRIBUTION);
  const meta = BADGE_META[highest.badge_slug];

  let upgrade: string | null = null;
  if (highest.badge_slug === 'road_ready') {
    upgrade = 'Upgrade to Certified to unlock broker-visible badges and higher directory placement.';
  } else if (highest.badge_slug === 'certified') {
    upgrade = 'Upgrade to Elite for maximum rank weighting and expanded broker trust cards.';
  }

  return {
    raw_boost: raw,
    effective_boost: capped,
    badge_slug: highest.badge_slug,
    is_capped: effective > TRAINING_MAX_RANK_CONTRIBUTION,
    rank_explanation: state.isExpired
      ? `${meta?.label} badge expired — rank boost removed. Renew to restore.`
      : state.isReviewDue
      ? `${meta?.label} badge review due — rank boost at 50%. Refresh training to restore full boost.`
      : `${meta?.label} badge active — contributing ${(capped * 100).toFixed(0)}% rank weight.`,
    upgrade_prompt: upgrade,
  };
}

// ─── Rank surfaces affected by training ─────────────────────
export const TRAINING_RANK_SURFACES = [
  'directory_search',
  'local_results',
  'category_results',
  'claim_recovery_prompts',
  'premium_filters',
  'broker_match_surfaces',
  'leaderboards',
] as const;

// ─── User-facing rank explanation bullets ───────────────────
export function getTrainingRankBullets(badge_slug: TrainingBadgeSlug | null): string[] {
  if (!badge_slug) {
    return [
      'Complete training to increase your visibility in directory search.',
      'Earn a badge to unlock broker-side filter eligibility.',
      'Training is one of the fastest ways to improve your profile rank.',
    ];
  }
  const meta = BADGE_META[badge_slug];
  const weight = TRAINING_RANK_WEIGHTS[badge_slug];
  return [
    `Your ${meta?.label} badge contributes up to ${(weight * 100).toFixed(0)}% rank weight.`,
    'Expired training reduces your rank contribution — keep it current.',
    badge_slug === 'elite'
      ? 'Elite badge provides maximum training rank weight across all surfaces.'
      : `Upgrade to the next tier to increase your rank contribution further.`,
  ];
}
