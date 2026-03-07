/**
 * Vapi Offer Sequencer — Upsell / Downsell Logic
 * 
 * Rules (from spec):
 *   1. Do NOT pitch premium before claim started
 *   2. Do NOT pitch AdGrid before verified OR traffic proof
 *   3. If premium rejected → downsell to verified
 *   4. If AdGrid rejected → offer starter CPC or short campaign
 *   5. Cooldown: 14 days after any pitch
 *   6. Max lifetime attempts: 10
 * 
 * Traffic proof definition:
 *   place_views_7d ≥ 25 AND search_impressions_28d ≥ 250
 */

import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export type OfferType =
    | 'free_claim'
    | 'verified_claim'
    | 'premium_placement'
    | 'adgrid_boost'
    | 'bundle_package'
    | 'starter_cpc'
    | 'short_campaign';

export type OfferTier = 'initial' | 'upsell' | 'downsell' | 'final';
export type OfferOutcome = 'accepted' | 'rejected' | 'no_answer' | 'callback_scheduled' | 'pending';

export interface OfferContext {
    entityId: string;
    entityType: 'place' | 'operator';
    countryCode: string;
    claimStatus: 'unclaimed' | 'claimed_free' | 'claimed_verified' | 'premium' | null;
    pageViews7d: number;
    searchImpressions28d: number;
    callId?: string;
}

export interface OfferDecision {
    shouldOffer: boolean;
    offerType: OfferType;
    offerTier: OfferTier;
    reason: string;
    sequencePosition: number;
    lifetimeAttempts: number;
    cooldownUntil: Date | null;
    trafficProofMet: boolean;
}

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const COOLDOWN_DAYS = 14;
const MAX_LIFETIME_ATTEMPTS = 10;
const TRAFFIC_PROOF = {
    placeViews7dMin: 25,
    searchImpressions28dMin: 250,
};

// ═══════════════════════════════════════════════════════════════
// OFFER LADDER
// ═══════════════════════════════════════════════════════════════

const OFFER_LADDER: Record<string, { next: OfferType; tier: OfferTier }[]> = {
    // Unclaimed → free claim first
    unclaimed: [
        { next: 'free_claim', tier: 'initial' },
    ],
    // Claimed free → push to verified
    claimed_free: [
        { next: 'verified_claim', tier: 'upsell' },
    ],
    // Claimed verified → push to premium (if no traffic proof, skip AdGrid)
    claimed_verified: [
        { next: 'premium_placement', tier: 'upsell' },
    ],
    // Premium → push to AdGrid boost (only with traffic proof)
    premium: [
        { next: 'adgrid_boost', tier: 'upsell' },
        { next: 'bundle_package', tier: 'upsell' },
    ],
};

// Downsell mapping: what to offer when the primary is rejected
const DOWNSELL_MAP: Record<OfferType, OfferType | null> = {
    premium_placement: 'verified_claim',
    adgrid_boost: 'starter_cpc',
    bundle_package: 'adgrid_boost',
    starter_cpc: 'short_campaign',
    short_campaign: null,
    verified_claim: null,
    free_claim: null,
};

// ═══════════════════════════════════════════════════════════════
// SEQUENCER
// ═══════════════════════════════════════════════════════════════

export async function determineNextOffer(ctx: OfferContext): Promise<OfferDecision> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const trafficProofMet =
        ctx.pageViews7d >= TRAFFIC_PROOF.placeViews7dMin &&
        ctx.searchImpressions28d >= TRAFFIC_PROOF.searchImpressions28dMin;

    // Get offer history for this entity
    const { data: history } = await supabase
        .from('vapi_offer_log')
        .select('*')
        .eq('entity_id', ctx.entityId)
        .eq('entity_type', ctx.entityType)
        .order('offered_at', { ascending: false })
        .limit(20);

    const logs = history || [];
    const lifetimeAttempts = logs.length;

    // Rule 6: Max lifetime attempts
    if (lifetimeAttempts >= MAX_LIFETIME_ATTEMPTS) {
        return {
            shouldOffer: false,
            offerType: 'free_claim',
            offerTier: 'final',
            reason: `Max lifetime attempts reached (${lifetimeAttempts}/${MAX_LIFETIME_ATTEMPTS})`,
            sequencePosition: lifetimeAttempts + 1,
            lifetimeAttempts,
            cooldownUntil: null,
            trafficProofMet,
        };
    }

    // Rule 5: Cooldown check
    const lastOffer = logs[0];
    if (lastOffer) {
        const cooldownUntil = lastOffer.cooldown_until
            ? new Date(lastOffer.cooldown_until)
            : new Date(new Date(lastOffer.offered_at).getTime() + COOLDOWN_DAYS * 86400000);

        if (cooldownUntil > new Date()) {
            return {
                shouldOffer: false,
                offerType: 'free_claim',
                offerTier: 'initial',
                reason: `Cooldown active until ${cooldownUntil.toISOString().split('T')[0]}`,
                sequencePosition: lifetimeAttempts + 1,
                lifetimeAttempts,
                cooldownUntil,
                trafficProofMet,
            };
        }
    }

    // Determine the right offer based on claim status
    const claimStatus = ctx.claimStatus || 'unclaimed';
    const ladder = OFFER_LADDER[claimStatus] || OFFER_LADDER.unclaimed;

    // Check if the last offer was rejected → try downsell
    if (lastOffer && lastOffer.outcome === 'rejected') {
        const lastOfferType = lastOffer.offer_type as OfferType;
        const downsell = DOWNSELL_MAP[lastOfferType];
        if (downsell) {
            return {
                shouldOffer: true,
                offerType: downsell,
                offerTier: 'downsell',
                reason: `Downsell from rejected ${lastOfferType}`,
                sequencePosition: lifetimeAttempts + 1,
                lifetimeAttempts,
                cooldownUntil: null,
                trafficProofMet,
            };
        }
    }

    // Rule 1: Don't pitch premium before claim started
    if (claimStatus === 'unclaimed') {
        return {
            shouldOffer: true,
            offerType: 'free_claim',
            offerTier: 'initial',
            reason: 'Unclaimed — start with free claim',
            sequencePosition: lifetimeAttempts + 1,
            lifetimeAttempts,
            cooldownUntil: null,
            trafficProofMet,
        };
    }

    // Rule 2: Don't pitch AdGrid before verified OR traffic proof
    const nextOffer = ladder[0];
    if (nextOffer) {
        if (
            (nextOffer.next === 'adgrid_boost' || nextOffer.next === 'bundle_package') &&
            claimStatus !== 'premium' &&
            !trafficProofMet
        ) {
            // Skip AdGrid, offer verified or premium instead
            return {
                shouldOffer: true,
                offerType: claimStatus === 'claimed_free' ? 'verified_claim' : 'premium_placement',
                offerTier: 'upsell',
                reason: 'Traffic proof not met — offering lower tier first',
                sequencePosition: lifetimeAttempts + 1,
                lifetimeAttempts,
                cooldownUntil: null,
                trafficProofMet,
            };
        }

        return {
            shouldOffer: true,
            offerType: nextOffer.next,
            offerTier: nextOffer.tier,
            reason: `Ladder progression from ${claimStatus}`,
            sequencePosition: lifetimeAttempts + 1,
            lifetimeAttempts,
            cooldownUntil: null,
            trafficProofMet,
        };
    }

    // No more offers to make
    return {
        shouldOffer: false,
        offerType: 'free_claim',
        offerTier: 'final',
        reason: 'No applicable offer for current claim status',
        sequencePosition: lifetimeAttempts + 1,
        lifetimeAttempts,
        cooldownUntil: null,
        trafficProofMet,
    };
}

// ═══════════════════════════════════════════════════════════════
// RECORD OFFER OUTCOME
// ═══════════════════════════════════════════════════════════════

export async function recordOfferOutcome(
    entityId: string,
    entityType: 'place' | 'operator',
    offerType: OfferType,
    offerTier: OfferTier,
    outcome: OfferOutcome,
    meta: {
        countryCode: string;
        callId?: string;
        conversationSummary?: string;
        trafficProofMet?: boolean;
        sequencePosition?: number;
        lifetimeAttempts?: number;
    }
): Promise<void> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const cooldownUntil = new Date(Date.now() + COOLDOWN_DAYS * 86400000);

    await supabase.from('vapi_offer_log').insert({
        entity_id: entityId,
        entity_type: entityType,
        country_code: meta.countryCode,
        offer_type: offerType,
        offer_tier: offerTier,
        outcome,
        sequence_position: meta.sequencePosition || 1,
        lifetime_attempts: meta.lifetimeAttempts || 1,
        cooldown_until: cooldownUntil.toISOString(),
        call_id: meta.callId,
        conversation_summary: meta.conversationSummary,
        traffic_proof_met: meta.trafficProofMet || false,
        resolved_at: outcome !== 'pending' ? new Date().toISOString() : null,
    });
}
