/**
 * Haul Command — Training Monetization Engine
 * Core type system for training, badges, and ranking integration.
 */

// ─── Confidence / Freshness ──────────────────────────────────
export type TrainingConfidenceState =
  | 'verified_current'
  | 'verified_but_review_due'
  | 'partially_verified'
  | 'seeded_needs_review'
  | 'historical_reference_only';

export type TrainingFreshnessState =
  | 'current'
  | 'review_due'
  | 'stale'
  | 'seeded';

// ─── Badge slugs ────────────────────────────────────────────
export type TrainingBadgeSlug = 'road_ready' | 'certified' | 'elite' | 'av_ready';

export const BADGE_META: Record<TrainingBadgeSlug, {
  label: string;
  level: number;
  color: string;
  description: string;
}> = {
  road_ready: {
    label: 'Road Ready',
    level: 1,
    color: '#6B7280',
    description: 'Completed foundational Haul Command training. Basic platform credential.',
  },
  certified: {
    label: 'Certified',
    level: 2,
    color: '#D4A017',
    description: 'Completed core certification path on Haul Command. Broker-visible platform credential.',
  },
  elite: {
    label: 'Elite',
    level: 3,
    color: '#B8860B',
    description: 'Advanced mastery certification on Haul Command. Highest platform trust tier.',
  },
  av_ready: {
    label: 'AV-Ready',
    level: 4,
    color: '#3B82F6',
    description: 'Autonomous vehicle escort specialist certification on Haul Command.',
  },
};

// ─── Training Catalog ────────────────────────────────────────
export interface TrainingCatalogItem {
  id: string;
  node_id: string;
  training_type: 'foundational' | 'core' | 'advanced' | 'specialized';
  credential_level: TrainingBadgeSlug;
  module_count: number;
  hours_total: number;
  jurisdiction_scope: string;
  reciprocity_scope?: string;
  requirement_fit?: string;
  ranking_impact: number;
  trust_badge_effect?: string;
  pricing_json: TrainingPricing;
  confidence_state: TrainingConfidenceState;
  freshness_state: TrainingFreshnessState;
  reviewed_at?: string;
  next_review_due?: string;
}

export interface TrainingPricing {
  one_time?: number;
  subscription?: number;
  period?: 'month' | 'year';
  annual_refresh?: number;
  currency: string;
  seat_based?: boolean;
  min_seats?: number;
}

// ─── Training Level ──────────────────────────────────────────
export interface TrainingLevel {
  id: string;
  training_id: string;
  level_slug: string;
  level_name: string;
  description?: string;
  badge_slug: TrainingBadgeSlug;
  rank_weight: number;
  trust_weight: number;
  pricing_json: TrainingPricing;
}

// ─── Training Module ─────────────────────────────────────────
export interface TrainingModule {
  id: string;
  training_id: string;
  slug: string;
  title: string;
  summary?: string;
  hours: number;
  sort_order: number;
  metadata?: Record<string, unknown>;
}

// ─── Geo Fit ─────────────────────────────────────────────────
export interface TrainingGeoFit {
  id: string;
  training_id: string;
  country_code: string;
  region_code?: string;
  fit_type: 'full' | 'partial' | 'cultural' | 'none';
  note?: string;
  confidence_state: TrainingConfidenceState;
  freshness_state: TrainingFreshnessState;
}

// ─── Badge Effects ───────────────────────────────────────────
export interface TrainingBadgeEffect {
  badge_slug: TrainingBadgeSlug;
  on_platform_effect_json: {
    directory_boost?: number;
    profile_badge?: boolean;
    broker_visible?: boolean;
    filter_eligible?: boolean;
    trust_card_expanded?: boolean;
    category_specific?: boolean;
  };
  visible_copy?: string;
}

// ─── Internal Links ──────────────────────────────────────────
export interface TrainingLink {
  link_type: 'regulation' | 'tool' | 'glossary' | 'claim' | 'directory';
  target_type: string;
  target_id: string;
  anchor_text?: string;
  priority: number;
}

// ─── User Status ─────────────────────────────────────────────
export type TrainingEnrollmentStatus =
  | 'enrolled'
  | 'in_progress'
  | 'completed'
  | 'expired'
  | 'review_due';

export interface TrainingEnrollment {
  training_id: string;
  node_id: string;
  status: TrainingEnrollmentStatus;
  completed_at?: string;
  expires_at?: string;
  review_due_at?: string;
}

export type TrainingBadgeStatus = 'active' | 'expired' | 'review_due' | 'revoked';

export interface TrainingUserBadge {
  badge_slug: TrainingBadgeSlug;
  status: TrainingBadgeStatus;
  issued_at: string;
  expires_at?: string;
  review_due_at?: string;
}

export interface TrainingUserStatus {
  enrollments: TrainingEnrollment[];
  badges: TrainingUserBadge[];
}

// ─── Hub Payload ─────────────────────────────────────────────
export interface TrainingHubPayload {
  levels: Array<TrainingCatalogItem & TrainingLevel>;
  total_catalog_count: number;
  badge_effects: TrainingBadgeEffect[];
}

// ─── Page Payload ────────────────────────────────────────────
export interface TrainingPagePayload {
  training: TrainingCatalogItem;
  modules: TrainingModule[];
  levels: TrainingLevel[];
  geo_fit: TrainingGeoFit[];
  links: TrainingLink[];
  badge_effects: TrainingBadgeEffect[];
}

// ─── Enterprise ──────────────────────────────────────────────
export interface TrainingEnterprisePayload {
  team_plans: Array<{
    slug: string;
    name: string;
    min_seats: number;
    max_seats: number | null;
  }>;
  features: string[];
}

// ─── Ranking contribution ────────────────────────────────────
export interface TrainingRankContribution {
  badge_slug: TrainingBadgeSlug | null;
  badge_status: TrainingBadgeStatus | null;
  rank_boost: number;        // 0.00–1.00 contribution to overall rank
  is_expired: boolean;
  explanation: string;
}
