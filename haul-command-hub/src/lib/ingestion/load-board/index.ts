/**
 * Haul Command Load Board Ingestion v3 — Public API
 */

export { ingestLoadBoardBatch } from './engine';
export { parseLine } from './parser';
export { parseStructuredListings, isStructuredListingFormat } from './structured-parser';
export { segmentBatch } from './segmenter';
export type { BatchSegment, SegmentType, SegmentationResult } from './segmenter';
export { BrokerSurfaceBuilder } from './broker-surface';
export type { BrokerSurface, BrokerSurfaceSummary, AcquisitionStatus } from './broker-surface';
export { IdentityGraph, scoreEntity } from './entity-resolution';
export {
  CorridorIntelligence,
  scoreCorridor,
  buildDailyVolume,
  calculateBoardVelocity,
  buildPricingSummary,
} from './corridor-intelligence';
export type {
  IngestionBatch,
  IngestionConfig,
  ParsedObservation,
  PricingObservation,
  ObservationTags,
  BatchOutputSummary,
  ServiceType,
  UrgencyLevel,
  PaymentTerm,
  ActorRole,
  RoleCandidate,
  ReputationSignal,
  OrganizationCandidate,
  ContactCandidate,
  PhoneRecord,
  AliasRecord,
  CorridorRecord,
  CorridorScores,
  EntityScores,
  ScoreBand,
  DailyVolume,
  SourceType,
  TrustLevel,
  RoleDistribution,
} from './types';
