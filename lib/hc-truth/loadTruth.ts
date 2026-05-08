import { getAdgridIntentTags } from './adgridIntent';
import { getPayerRiskCopy } from './truthCopy';
import { getTruthLevel, normalizeTruthCard, scoreFromImpacts } from './truthScoring';
import type { HCLoadTruthInput, HCTruthCard, HCTruthSignal } from './truthTypes';

const HIGH_DEADHEAD_MILES = 250;
const LOW_RATE_MARKET_RATIO = 0.85;

export function buildLoadTruthCard(input: HCLoadTruthInput): HCTruthCard {
  const signals: HCTruthSignal[] = [];
  const missingRequirements: string[] = [];
  const suggestedActions = new Set<string>();
  const suggestedQuestions = new Set<string>();
  const monetizationTriggers = new Set<string>();

  if (input.rateCents !== null && input.marketRateCents !== null && input.marketRateCents > 0) {
    const marketRatio = input.rateCents / input.marketRateCents;
    if (marketRatio < LOW_RATE_MARKET_RATIO) {
      signals.push({
        key: 'rate_below_market',
        label: 'Rate below market signal',
        level: 'risk',
        scoreImpact: -24,
        publicSummary: 'The posted rate appears below the current market reference for similar work.',
        sourceTable: 'hc_rate_benchmarks',
        evidenceCount: 1,
      });
      suggestedActions.add('Set or review your rate floor before accepting this load.');
      suggestedQuestions.add(
        'Is deadhead, hotel, no-go, detention, and layover pay written into the rate confirmation?',
      );
      monetizationTriggers.add('rate-floor-calculator');
    }
  }

  if ((input.deadheadMiles ?? 0) >= HIGH_DEADHEAD_MILES) {
    signals.push({
      key: 'deadhead_high',
      label: 'High deadhead burden',
      level: 'risk',
      scoreImpact: -18,
      publicSummary: 'Deadhead miles may pressure net profit unless they are priced into the job.',
      sourceTable: 'deadhead_cost_estimates',
      evidenceCount: input.estimatedDeadheadCostCents === null ? 0 : 1,
    });
    suggestedActions.add('Run the deadhead cost check before committing.');
    suggestedQuestions.add(
      'Is deadhead, hotel, no-go, detention, and layover pay written into the rate confirmation?',
    );
    monetizationTriggers.add('deadhead-calculator');
  }

  if (input.payerReliabilityScore === null) {
    signals.push({
      key: 'payer_limited_history',
      label: 'Limited payer history',
      level: 'watch',
      scoreImpact: -16,
      publicSummary: getPayerRiskCopy('unknown'),
      sourceTable: 'hc_broker_risk_scores',
      evidenceCount: 0,
    });
    suggestedActions.add('Request written payment terms before dispatch.');
    suggestedQuestions.add('Will the payer fund escrow, deposit, or fast-pay protection before dispatch?');
    monetizationTriggers.add('escrow-payment-protection');
  } else if (input.payerReliabilityScore < 55) {
    signals.push({
      key: 'payer_risk_signal',
      label: 'Payer risk signal',
      level: 'risk',
      scoreImpact: -20,
      publicSummary: getPayerRiskCopy('slowPay'),
      sourceTable: 'hc_broker_risk_scores',
      evidenceCount: 1,
    });
    suggestedActions.add('Request written payment terms before dispatch.');
    suggestedQuestions.add('Will the payer fund escrow, deposit, or fast-pay protection before dispatch?');
    monetizationTriggers.add('escrow-payment-protection');
  } else if (input.payerReliabilityScore >= 80) {
    signals.push({
      key: 'payer_verified_signal',
      label: 'Stronger payer signal',
      level: 'good',
      scoreImpact: 8,
      publicSummary: getPayerRiskCopy('verified'),
      sourceTable: 'hc_broker_risk_scores',
      evidenceCount: 1,
    });
  }

  if (!input.depositFunded && input.escrowAvailable) {
    signals.push({
      key: 'escrow_available_not_funded',
      label: 'Payment protection available',
      level: 'watch',
      scoreImpact: -6,
      publicSummary: 'Payment protection appears available but not funded yet.',
      sourceTable: 'hc_escrow_rush_loads',
      evidenceCount: 1,
    });
    suggestedActions.add('Ask whether escrow or deposit can be funded before dispatch.');
    monetizationTriggers.add('escrow-payment-protection');
  }

  if (!input.credentialMatched) {
    missingRequirements.push('Credential match needs review before dispatch.');
    signals.push({
      key: 'credential_missing',
      label: 'Credential match missing',
      level: 'blocked',
      scoreImpact: -32,
      publicSummary: 'Credential match is missing or unverified for this load.',
      sourceTable: 'hc_credential_wallet',
      evidenceCount: 0,
    });
    suggestedActions.add('Upload or verify the credential required for this load.');
    monetizationTriggers.add('credential-training');
  }

  if (!input.equipmentMatched) {
    missingRequirements.push('Equipment proof needs review before dispatch.');
    signals.push({
      key: 'equipment_missing',
      label: 'Equipment match missing',
      level: 'blocked',
      scoreImpact: -28,
      publicSummary: 'Equipment match is missing or unverified for this load.',
      sourceTable: 'hc_equipment',
      evidenceCount: 0,
    });
    suggestedActions.add('Update equipment proof before accepting this load.');
    monetizationTriggers.add('routeready-equipment');
  }

  if (input.routeRiskLevel === 'risk' || input.routeRiskLevel === 'blocked') {
    signals.push({
      key: 'route_risk_signal',
      label: 'Route risk signal',
      level: input.routeRiskLevel,
      scoreImpact: input.routeRiskLevel === 'blocked' ? -30 : -16,
      publicSummary: 'Route, permit, or corridor risk needs review before dispatch.',
      sourceTable: 'hc_corridor_risk_scores',
      evidenceCount: 1,
    });
    suggestedActions.add('Review the corridor risk notes before accepting.');
  }

  if (signals.length === 0) {
    signals.push({
      key: 'load_fit_available',
      label: 'Load fit available',
      level: 'good',
      scoreImpact: 8,
      publicSummary: 'No major takeability warnings were found from the supplied signals.',
    });
  }

  const rawScore = scoreFromImpacts(86, signals.map((signal) => signal.scoreImpact));
  const hasBlockingSignal = signals.some((signal) => signal.level === 'blocked');
  const score = hasBlockingSignal ? rawScore : Math.max(rawScore, 25);
  const level = getTruthLevel(score);

  const card: HCTruthCard = {
    entityType: 'load',
    entityId: input.loadId,
    score,
    level,
    headline: getLoadHeadline(level),
    summary: getLoadSummary(level),
    signals,
    missingRequirements,
    suggestedActions: [...suggestedActions],
    suggestedQuestions: [...suggestedQuestions],
    monetizationTriggers: [...monetizationTriggers],
    adgridIntentTags: getAdgridIntentTags(signals),
    lastComputedAt: input.computedAt ?? new Date().toISOString(),
  };

  return normalizeTruthCard(card);
}

function getLoadHeadline(level: HCTruthCard['level']): string {
  if (level === 'excellent') return 'Strong load fit';
  if (level === 'good') return 'Good load fit';
  if (level === 'watch') return 'Review details before accepting this load';
  if (level === 'risk') return 'Proceed carefully before accepting this load';
  if (level === 'blocked') return 'Do not dispatch until blockers are resolved';
  return 'Not enough evidence to score this load';
}

function getLoadSummary(level: HCTruthCard['level']): string {
  if (level === 'excellent' || level === 'good') {
    return 'This load has stronger takeability signals than the supplied risk inputs.';
  }

  if (level === 'watch') {
    return 'This load may still be workable, but the operator should confirm terms, requirements, and payment protection.';
  }

  if (level === 'risk') {
    return 'This load has signals that may pressure profit, payment confidence, or dispatch readiness.';
  }

  if (level === 'blocked') {
    return 'This load has unresolved readiness or safety blockers that should be fixed before dispatch.';
  }

  return 'Haul Command does not yet have enough evidence to score this load confidently.';
}
