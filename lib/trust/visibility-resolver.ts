/**
 * lib/trust/visibility-resolver.ts
 *
 * Client-side visibility resolution for trust surfaces.
 * Mirrors the Postgres resolve_visibility() function for optimistic UI rendering.
 *
 * Architecture:
 *   - Server: resolve_visibility() RPC is the source of truth
 *   - Client: this module provides instant UI decisions before the RPC returns
 *   - Both must agree — if they diverge, server wins
 */

// ════════════════════════════════════════════════════════════════════════════
// TYPES
// ════════════════════════════════════════════════════════════════════════════

export type AudienceTier = 'anonymous' | 'free' | 'paid' | 'claimed_owner' | 'admin';

export type MediaVisibility = 'public' | 'subscriber_only' | 'private_owner_only';

export interface VisibilitySettings {
    public_profile_visible: boolean;
    public_report_card_visible: boolean;
    public_media_visible: boolean;
    public_contact_visible: boolean;
}

export interface ResolvedVisibility {
    tier: AudienceTier;
    can_view_profile: boolean;
    can_view_report_card: boolean;
    can_view_media: boolean;
    can_view_contact: boolean;
    can_view_subscriber_media: boolean;
    can_view_private_media: boolean;
    can_manage_visibility: boolean;
    show_upgrade_prompt: boolean;
}

export interface ReportCardData {
    listing_id: string;
    claim_state: 'claimed' | 'unclaimed';
    public_visible: boolean;
    subscriber_visible: boolean;
    identity_score: number;
    completeness_score: number;
    media_completeness: number;
    gear_presence: number;
    verification_level: string;
    responsiveness_pct: number;
    freshness_pct: number;
    service_area_confidence: number;
    trust_flags: unknown[];
    broker_summary: string | null;
    overall_trust_score: number;
}

// ════════════════════════════════════════════════════════════════════════════
// CONSTANTS
// ════════════════════════════════════════════════════════════════════════════

/** Default visibility — everything public */
export const DEFAULT_VISIBILITY: VisibilitySettings = {
    public_profile_visible: true,
    public_report_card_visible: true,
    public_media_visible: true,
    public_contact_visible: true,
};

/** Default resolved visibility for anonymous users */
const ANONYMOUS_DEFAULT: ResolvedVisibility = {
    tier: 'anonymous',
    can_view_profile: true,
    can_view_report_card: true,
    can_view_media: true,
    can_view_contact: false,
    can_view_subscriber_media: false,
    can_view_private_media: false,
    can_manage_visibility: false,
    show_upgrade_prompt: false,
};

// ════════════════════════════════════════════════════════════════════════════
// CORE RESOLVER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Resolve what a viewer can see on a listing.
 * This is the client-side mirror of Postgres resolve_visibility().
 */
export function resolveVisibility(
    tier: AudienceTier,
    settings: VisibilitySettings = DEFAULT_VISIBILITY,
): ResolvedVisibility {
    switch (tier) {
        case 'admin':
            return {
                tier: 'admin',
                can_view_profile: true,
                can_view_report_card: true,
                can_view_media: true,
                can_view_contact: true,
                can_view_subscriber_media: true,
                can_view_private_media: true,
                can_manage_visibility: true,
                show_upgrade_prompt: false,
            };

        case 'claimed_owner':
            return {
                tier: 'claimed_owner',
                can_view_profile: true,
                can_view_report_card: true,
                can_view_media: true,
                can_view_contact: true,
                can_view_subscriber_media: true,
                can_view_private_media: true,
                can_manage_visibility: true,
                show_upgrade_prompt: false,
            };

        case 'paid':
            return {
                tier: 'paid',
                can_view_profile: true,
                can_view_report_card: true,
                can_view_media: true,
                can_view_contact: settings.public_contact_visible,
                can_view_subscriber_media: true,
                can_view_private_media: false,
                can_manage_visibility: false,
                show_upgrade_prompt: false,
            };

        case 'free':
            return {
                tier: 'free',
                can_view_profile: settings.public_profile_visible,
                can_view_report_card: settings.public_report_card_visible,
                can_view_media: settings.public_media_visible,
                can_view_contact: settings.public_contact_visible,
                can_view_subscriber_media: false,
                can_view_private_media: false,
                can_manage_visibility: false,
                show_upgrade_prompt: !(settings.public_profile_visible && settings.public_report_card_visible),
            };

        default:
            return {
                ...ANONYMOUS_DEFAULT,
                can_view_profile: settings.public_profile_visible,
                can_view_report_card: settings.public_report_card_visible,
                can_view_media: settings.public_media_visible,
                show_upgrade_prompt: !(settings.public_profile_visible && settings.public_report_card_visible),
            };
    }
}

// ════════════════════════════════════════════════════════════════════════════
// MEDIA VISIBILITY FILTER
// ════════════════════════════════════════════════════════════════════════════

/**
 * Filter which media items a viewer can see based on their tier.
 */
export function canViewMedia(
    mediaVisibility: MediaVisibility,
    resolved: ResolvedVisibility,
): boolean {
    switch (mediaVisibility) {
        case 'public':
            return resolved.can_view_media;
        case 'subscriber_only':
            return resolved.can_view_subscriber_media;
        case 'private_owner_only':
            return resolved.can_view_private_media;
        default:
            return false;
    }
}

/**
 * Filter an array of media items based on viewer access.
 */
export function filterMediaByAccess<T extends { visibility: MediaVisibility }>(
    items: T[],
    resolved: ResolvedVisibility,
): T[] {
    return items.filter(item => canViewMedia(item.visibility, resolved));
}

// ════════════════════════════════════════════════════════════════════════════
// COMPARE MODE ACCESS
// ════════════════════════════════════════════════════════════════════════════

export interface CompareAccess {
    can_compare_public: boolean;
    can_compare_hidden: boolean;
    can_compare_subscriber_media: boolean;
    can_compare_trust_fields: boolean;
}

/**
 * Determine what a user can compare.
 */
export function getCompareAccess(tier: AudienceTier): CompareAccess {
    const isPaid = tier === 'paid' || tier === 'admin' || tier === 'claimed_owner';
    return {
        can_compare_public: true,
        can_compare_hidden: isPaid,
        can_compare_subscriber_media: isPaid,
        can_compare_trust_fields: isPaid,
    };
}

// ════════════════════════════════════════════════════════════════════════════
// REPORT CARD SECTIONS
// ════════════════════════════════════════════════════════════════════════════

export const REPORT_CARD_SECTIONS = [
    'identity_and_claim_status',
    'completeness_score',
    'media_completeness',
    'gear_presence_signals',
    'verification_states',
    'responsiveness_signals',
    'freshness_signals',
    'service_area_confidence',
    'trust_flags',
    'broker_facing_summary',
] as const;

export type ReportCardSection = typeof REPORT_CARD_SECTIONS[number];

/** Sections visible without upgrade */
const FREE_VISIBLE_SECTIONS: ReportCardSection[] = [
    'identity_and_claim_status',
    'completeness_score',
];

/** Sections that require paid access when hidden */
const PAID_GATED_SECTIONS: ReportCardSection[] = [
    'gear_presence_signals',
    'verification_states',
    'responsiveness_signals',
    'freshness_signals',
    'service_area_confidence',
    'trust_flags',
    'broker_facing_summary',
];

/**
 * Get which report card sections a viewer can see.
 */
export function getVisibleSections(
    resolved: ResolvedVisibility,
): ReportCardSection[] {
    if (resolved.tier === 'admin' || resolved.tier === 'claimed_owner') {
        return [...REPORT_CARD_SECTIONS];
    }

    if (resolved.can_view_report_card) {
        // Full public or paid access
        return [...REPORT_CARD_SECTIONS];
    }

    if (resolved.tier === 'paid') {
        // Paid users see everything even when report card is hidden
        return [...REPORT_CARD_SECTIONS];
    }

    // Free/anonymous with hidden report card — show teasers only
    return [...FREE_VISIBLE_SECTIONS];
}

/**
 * Check if a section is gated (requires upgrade to see).
 */
export function isSectionGated(
    section: ReportCardSection,
    resolved: ResolvedVisibility,
): boolean {
    if (resolved.can_view_report_card) return false;
    if (resolved.tier === 'paid' || resolved.tier === 'admin' || resolved.tier === 'claimed_owner') return false;
    return PAID_GATED_SECTIONS.includes(section);
}

// ════════════════════════════════════════════════════════════════════════════
// MEDIA SLOT DEFAULTS
// ════════════════════════════════════════════════════════════════════════════

/** Recommended default visibility per media slot */
export const MEDIA_SLOT_DEFAULTS: Record<string, MediaVisibility> = {
    vehicle_front_3qtr: 'public',
    vehicle_side: 'public',
    vehicle_rear: 'public',
    roof_beacon_setup: 'public',
    flags_signs_poles: 'public',
    radios_comms_setup: 'subscriber_only',
    safety_gear_layout: 'public',
    optional_night_visibility: 'subscriber_only',
    optional_support_equipment: 'subscriber_only',
    optional_trailer_or_additional_vehicle: 'subscriber_only',
};

// ════════════════════════════════════════════════════════════════════════════
// UPGRADE PROMPTS
// ════════════════════════════════════════════════════════════════════════════

/** Contextual upgrade messages */
export const UPGRADE_PROMPTS = {
    hidden_report_card: 'Upgrade to view hidden report cards',
    hidden_profile: 'Upgrade to compare hidden profiles',
    subscriber_media: 'Upgrade to view subscriber-only setup details',
    compare_mode: 'Upgrade to compare all operators side-by-side',
    trust_insights: 'Upgrade to unlock deeper trust insights',
    shortlist_filters: 'Upgrade to access stronger shortlist filters',
} as const;

/** Owner upgrade drivers */
export const OWNER_UPGRADE_PROMPTS = {
    visibility_controls: 'Control public vs subscriber visibility',
    better_media: 'Feature better media',
    premium_presentation: 'Unlock premium profile presentation',
    trust_badges: 'Earn stronger trust badges',
    higher_placement: 'Get higher placement from completeness and verification',
} as const;

// ════════════════════════════════════════════════════════════════════════════
// SEO HELPERS
// ════════════════════════════════════════════════════════════════════════════

/**
 * Determine if a page should be indexed by crawlers.
 */
export function shouldIndex(settings: VisibilitySettings): boolean {
    return settings.public_profile_visible;
}

/**
 * Get noindex directive if needed.
 */
export function getMetaRobots(settings: VisibilitySettings): string {
    if (!settings.public_profile_visible) return 'noindex, nofollow';
    return 'index, follow';
}
