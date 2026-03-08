/**
 * Engine Barrel Export
 * 
 * Single import point for all HAUL COMMAND engines.
 * Usage: import { computeFreshness, routeModel, scanForRecovery } from '@/lib/engines';
 */

// Core Engines
export { computeFreshness, type FreshnessInput, type FreshnessResult, type FreshnessAlert } from './freshness';
export { scanForRecovery, estimateTotalRecovery, HOOKS, type RecoverySignal, type RecoveryType } from './recovery-revenue';
export { routeModel, estimateCost, quickRoute, type TaskType, type ModelTier, type ModelSelection } from './model-router';
export { getFeatureState, getCountryGates, isFeatureEnabled, isFeatureSimulated, getCountryTier, type GatedFeature, type FeatureState } from './country-gate';
export { matchSponsors, PAGE_SLOTS, type SponsorCandidate, type SponsorMatch, type PageClass } from './sponsor-relevance';
export { computeClaimReadiness, type ClaimReadinessInput, type ClaimReadinessResult, type OutreachState } from './claim-readiness';
export { scoreSurfaceUtility, type SurfaceUtilityInput, type SurfaceUtilityResult, type PageVerdict } from './surface-utility';
export { decideInstallPrompt, type InstallContext, type InstallDecision, type PromptType } from './install-conversion';

// Advanced Engines
export { scoreOperatorFit, rankOperatorsForLoad, buildShortlist, type LoadProfile, type OperatorProfile, type FitResult } from './load-fit';
export { computeRanking, computeRankingFromOperator, type RankingSignals, type RankingResult } from './ranking-brain';
export { assessMarketReadiness, type MarketSnapshot, type ReadinessResult } from './dispatcher-readiness';

// Notification Brain
export { decideNotification, NOVU_WORKFLOWS, type NotificationPayload, type NotificationChannel, type NotificationPriority, type NotificationDecision } from './notification-brain';
