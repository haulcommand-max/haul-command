import type { HCTruthCard, HCTruthLevel } from './truthTypes';

const DEFAULT_SAFE_ACTION =
  'Review the evidence, confirm terms in writing, and choose the safest available next step.';

export function clampTruthScore(score: number): number {
  if (Number.isNaN(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score)));
}

export function getTruthLevel(score: number | null | undefined): HCTruthLevel {
  if (score === null || score === undefined || Number.isNaN(score)) return 'unknown';

  const normalized = clampTruthScore(score);
  if (normalized >= 90) return 'excellent';
  if (normalized >= 75) return 'good';
  if (normalized >= 55) return 'watch';
  if (normalized >= 25) return 'risk';
  return 'blocked';
}

export function normalizeTruthCard(card: HCTruthCard): HCTruthCard {
  const level = card.level === 'unknown' ? getTruthLevel(card.score) : card.level;
  const score = card.score === null ? null : clampTruthScore(card.score);
  const suggestedActions =
    card.suggestedActions.length > 0 || level === 'excellent' || level === 'good'
      ? card.suggestedActions
      : [DEFAULT_SAFE_ACTION];

  return {
    ...card,
    score,
    level,
    suggestedActions,
  };
}

export function scoreFromImpacts(baseScore: number, impacts: number[]): number {
  return clampTruthScore(impacts.reduce((score, impact) => score + impact, baseScore));
}
