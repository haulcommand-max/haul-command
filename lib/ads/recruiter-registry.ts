// lib/ads/recruiter-registry.ts
// Internal Recruiter Offer Registry — AdGridRecruiterCard Tier 2
//
// Eliminates dependency on an external "recruiter partner API."
// Strategy: seed with high-quality internal house offers + Supabase-backed
// paid recruiter listings. Zero partner API needed.
//
// Tier 1: Static house offers (always available, no API)
// Tier 2: Paid recruiter listings from recruiter_campaigns table (Supabase)
// Tier 3: Future: external partner API (pinned to /api/recruiter/offers)

import type { RecruiterOffer } from './recruiter-types';
import { getSupabaseAdmin } from '@/lib/enterprise/supabase/admin';

// ─────────────────────────────────────────────────────────────────────────────
// TIER 1 — House Recruiter Offers (always served, zero dependencies)
// High-quality house ads that drive platform value even without paid campaigns
// ─────────────────────────────────────────────────────────────────────────────

export const HOUSE_RECRUITER_OFFERS: RecruiterOffer[] = [
    {
        id: 'house-barnhart',
        carrier_name: 'Barnhart Crane & Rigging',
        carrier_logo: null,
        pitch: 'Seeking verified pilot car operators for wind farm projects across TX, OK, KS. Year-round contract work available for operators with superload experience.',
        pay_range: '$1,800–$2,400/week',
        region: 'TX, OK, KS, NE',
        requirements: ['2+ yrs experience', 'DOT compliant vehicle', 'Insurance verified', 'GPS tracking capable'],
        perks: ['Weekly direct pay', 'Fuel card', 'Year-round schedule', 'Bonus on superloads'],
        trust_score_min: 65,
        apply_url: '/claim?from=barnhart-recruit',
        urgent: true,
        load_types: ['wind_turbine', 'crane'],
        tier: 'house',
    },
    {
        id: 'house-ove',
        carrier_name: 'OVE Transport Solutions',
        carrier_logo: null,
        pitch: 'National superload carrier needs certified HIGH POLE operators in Gulf Coast states. Premium rates for experienced operators.',
        pay_range: '$2,200–$3,100/week',
        region: 'TX, LA, MS, AL, FL',
        requirements: ['High pole certified', 'State escort cert', 'Minimum trust score 70%', 'Available 48hr notice'],
        perks: ['Per diem', 'Hotel covered on extended trips', 'Equipment allowance', 'Bonus completion pay'],
        trust_score_min: 70,
        apply_url: '/claim?from=ove-recruit',
        urgent: false,
        load_types: ['superload', 'oil_field_equipment'],
        tier: 'house',
    },
    {
        id: 'house-claims-cta',
        carrier_name: 'Haul Command Network',
        carrier_logo: null,
        pitch: 'Claim your free listing to unlock 3× more job opportunities. Verified operators on Haul Command get first priority from top-tier carriers.',
        pay_range: 'Earn more — free to join',
        region: 'All 50 States',
        requirements: ['Create free account', 'Verify identity', 'Set availability'],
        perks: ['Priority matching', 'Trust score badge', 'Direct carrier contact', 'Load alerts'],
        trust_score_min: 0,
        apply_url: '/claim',
        urgent: false,
        load_types: [],
        tier: 'house',
    },
    {
        id: 'house-midwest',
        carrier_name: 'Midwest Heavy Transport Co.',
        carrier_logo: null,
        pitch: 'Fast-growing overwidth carrier expanding into IA, MN, WI, IL. Looking for reliable pilot car operators to join our preferred network.',
        pay_range: '$1,400–$1,900/week',
        region: 'IA, MN, WI, IL, IN',
        requirements: ['1+ yr experience', 'State escort cert', 'Clean DOT record'],
        perks: ['Flexible schedule', 'Consistent loads', 'Fast payment cycle'],
        trust_score_min: 55,
        apply_url: '/claim?from=midwest-recruit',
        urgent: false,
        load_types: ['construction_equipment', 'manufactured_housing'],
        tier: 'house',
    },
];

// ─────────────────────────────────────────────────────────────────────────────
// TIER 2 — Paid Recruiter Campaigns from Supabase
// Carriers who have paid for featured recruiter placement
// ─────────────────────────────────────────────────────────────────────────────

export async function getPaidRecruiterOffers(opts?: {
    region?: string;
    load_type?: string;
    trust_score?: number;
    limit?: number;
}): Promise<RecruiterOffer[]> {
    try {
        const admin = getSupabaseAdmin();
        const limit = opts?.limit ?? 5;

        let query = admin
            .from('recruiter_campaigns')
            .select('*')
            .eq('status', 'active')
            .lte('start_date', new Date().toISOString())
            .order('priority_score', { ascending: false })
            .limit(limit);

        if (opts?.region) {
            query = query.contains('target_regions', [opts.region]);
        }
        if (opts?.load_type) {
            query = query.contains('load_types', [opts.load_type]);
        }

        const { data } = await query;
        if (!data?.length) return [];

        return data.map((c: Record<string, unknown>) => ({
            id: String(c.id),
            carrier_name: String(c.carrier_name),
            carrier_logo: c.carrier_logo ? String(c.carrier_logo) : null,
            pitch: String(c.pitch ?? ''),
            pay_range: String(c.pay_range ?? ''),
            region: String(c.region ?? ''),
            requirements: Array.isArray(c.requirements) ? c.requirements as string[] : [],
            perks: Array.isArray(c.perks) ? c.perks as string[] : [],
            trust_score_min: Number(c.trust_score_min ?? 0),
            apply_url: String(c.apply_url ?? '/loads'),
            urgent: Boolean(c.urgent),
            load_types: Array.isArray(c.load_types) ? c.load_types as string[] : [],
            tier: 'paid' as const,
        }));
    } catch {
        return [];
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// PRIMARY EXPORT — getRecruiterOffers()
// Merges paid (tier 2) + house (tier 1), deduplicates
// Falls back to house offers if DB unavailable
// ─────────────────────────────────────────────────────────────────────────────

export async function getRecruiterOffers(opts?: {
    region?: string;
    load_type?: string;
    trust_score?: number;
    limit?: number;
}): Promise<RecruiterOffer[]> {
    const limit = opts?.limit ?? 4;

    // Try paid tier first
    const paid = await getPaidRecruiterOffers(opts);

    // Fill remainder with filtered house offers
    const houseFiltered = HOUSE_RECRUITER_OFFERS.filter(h => {
        if (opts?.trust_score !== undefined && h.trust_score_min > opts.trust_score) return false;
        if (opts?.load_type && h.load_types.length > 0 && !h.load_types.includes(opts.load_type)) return false;
        return true;
    });

    // Merge: paid first, then house, up to limit
    const merged = [...paid, ...houseFiltered].slice(0, limit);
    return merged.length ? merged : HOUSE_RECRUITER_OFFERS.slice(0, limit);
}

// ─────────────────────────────────────────────────────────────────────────────
// APPLY INTENT LOGGER — records apply clicks for revenue attribution
// ─────────────────────────────────────────────────────────────────────────────

export async function logRecruiterApply(opts: {
    offer_id: string;
    carrier_name: string;
    operator_trust_score?: number;
    user_id?: string;
}): Promise<void> {
    try {
        const admin = getSupabaseAdmin();
        await admin.from('swarm_activity_log').insert({
            agent_name: 'recruiter_agent',
            trigger_reason: 'recruiter_apply_click',
            action_taken: `Apply click: ${opts.carrier_name} (offer ${opts.offer_id})`,
            surfaces_touched: ['recruiter_campaigns', 'directory_sidebar'],
            revenue_impact: 25, // each recruiter apply click worth ~$25 in lead value
            trust_impact: 2,
            status: 'completed',
        });
    } catch {
        // best-effort
    }
}
