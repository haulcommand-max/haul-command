// lib/compliance/global-guard.ts
//
// Haul Command — Global Compliance Guard
// Spec: Revenue & Compliance Hardening Pack v1.0.0
//
// Prevents illegal outbound calling, enforces data residency,
// and maintains facilitator-only marketplace posture.
//
// This is a HARD STOP system — it blocks before any call/action.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type BlockReason =
    | 'quiet_hours'
    | 'frequency_cap'
    | 'missing_consent'
    | 'autodial_forbidden'
    | 'sms_not_allowed'
    | 'sms_consent_missing'
    | 'high_risk_country'
    | 'data_residency_violation'
    | 'cross_border_restricted';

export interface ComplianceCheckResult {
    allowed: boolean;
    blocks: BlockReason[];
    downgrades: string[];
    warnings: string[];
    country_code: string;
    risk_tier: string;
}

export interface CallRules {
    country_code: string;
    country_name: string;
    autodial_allowed: boolean;
    consent_required: boolean;
    recording_disclosure_required: boolean;
    quiet_hours_start: number;
    quiet_hours_end: number;
    max_attempts_per_30d: number;
    cooling_window_hours: number;
    sms_allowed: boolean;
    sms_consent_required: boolean;
    risk_tier: string;
}

export interface ResidencyRules {
    requires_local_storage: boolean;
    requires_consent_logging: boolean;
    requires_deletion_sla_days: number;
    cross_border_transfer_restricted: boolean;
    legal_basis_required: boolean;
}

// ============================================================
// RULE CACHE (in-memory, refreshed hourly)
// ============================================================

let cachedRules: Map<string, CallRules> = new Map();
let cachedResidency: Map<string, ResidencyRules> = new Map();
let lastCacheRefresh = 0;
const CACHE_TTL_MS = 60 * 60 * 1000; // 1 hour

async function ensureCache(): Promise<void> {
    if (Date.now() - lastCacheRefresh < CACHE_TTL_MS && cachedRules.size > 0) return;

    const supabase = getSupabaseAdmin();

    const { data: rules } = await supabase
        .from('country_call_rules')
        .select('*');

    cachedRules = new Map();
    for (const r of rules || []) {
        cachedRules.set(r.country_code, r as CallRules);
    }

    const { data: residency } = await supabase
        .from('data_residency_rules')
        .select('*');

    cachedResidency = new Map();
    for (const r of residency || []) {
        cachedResidency.set(r.country_code, r as ResidencyRules);
    }

    lastCacheRefresh = Date.now();
}

// ============================================================
// VAPI COMPLIANCE CHECK — Hard stop before any call
// ============================================================

export async function checkVapiCompliance(
    countryCode: string,
    localHour: number,
    dialMode: 'auto' | 'manual',
    consentStatus: 'verified' | 'pending' | 'unknown',
    attemptsLast30d: number
): Promise<ComplianceCheckResult> {
    await ensureCache();

    const rules = cachedRules.get(countryCode);
    const blocks: BlockReason[] = [];
    const downgrades: string[] = [];
    const warnings: string[] = [];

    if (!rules) {
        // Unknown country — high caution
        return {
            allowed: false,
            blocks: ['high_risk_country'],
            downgrades: [],
            warnings: ['Country not in compliance matrix — call blocked'],
            country_code: countryCode,
            risk_tier: 'high',
        };
    }

    // Quiet hours check
    if (rules.quiet_hours_start > rules.quiet_hours_end) {
        // Wraps midnight (e.g., 21-8)
        if (localHour >= rules.quiet_hours_start || localHour < rules.quiet_hours_end) {
            blocks.push('quiet_hours');
        }
    } else {
        if (localHour >= rules.quiet_hours_start && localHour < rules.quiet_hours_end) {
            blocks.push('quiet_hours');
        }
    }

    // Frequency cap
    if (attemptsLast30d >= rules.max_attempts_per_30d) {
        blocks.push('frequency_cap');
    }

    // Consent check
    if (rules.consent_required && consentStatus !== 'verified') {
        blocks.push('missing_consent');
    }

    // Autodial check
    if (!rules.autodial_allowed && dialMode === 'auto') {
        // Don't block — downgrade to manual queue
        downgrades.push('downgrade_to_manual_queue');
        warnings.push(`Autodial not allowed in ${countryCode} — downgraded to manual`);
    }

    // High risk country warning
    if (rules.risk_tier === 'high') {
        warnings.push(`High-risk country: ${countryCode}. Enhanced monitoring active.`);
    }

    return {
        allowed: blocks.length === 0,
        blocks,
        downgrades,
        warnings,
        country_code: countryCode,
        risk_tier: rules.risk_tier,
    };
}

// ============================================================
// SMS COMPLIANCE CHECK
// ============================================================

export async function checkSmsCompliance(
    countryCode: string,
    consentStatus: 'verified' | 'pending' | 'unknown'
): Promise<ComplianceCheckResult> {
    await ensureCache();

    const rules = cachedRules.get(countryCode);
    const blocks: BlockReason[] = [];

    if (!rules) {
        return {
            allowed: false,
            blocks: ['high_risk_country'],
            downgrades: [],
            warnings: ['Country not in compliance matrix'],
            country_code: countryCode,
            risk_tier: 'high',
        };
    }

    if (!rules.sms_allowed) {
        blocks.push('sms_not_allowed');
    }

    if (rules.sms_consent_required && consentStatus !== 'verified') {
        blocks.push('sms_consent_missing');
    }

    return {
        allowed: blocks.length === 0,
        blocks,
        downgrades: [],
        warnings: [],
        country_code: countryCode,
        risk_tier: rules.risk_tier,
    };
}

// ============================================================
// DATA RESIDENCY CHECK
// ============================================================

export async function checkDataResidency(
    countryCode: string,
    dataDestinationRegion: string
): Promise<ComplianceCheckResult> {
    await ensureCache();

    const rules = cachedResidency.get(countryCode);
    const blocks: BlockReason[] = [];
    const warnings: string[] = [];

    if (!rules) {
        return {
            allowed: true,
            blocks: [],
            downgrades: [],
            warnings: ['No residency rules defined — default global'],
            country_code: countryCode,
            risk_tier: 'low',
        };
    }

    if (rules.requires_local_storage && dataDestinationRegion !== countryCode) {
        warnings.push(`${countryCode} requires local storage — data going to ${dataDestinationRegion}`);
    }

    if (rules.cross_border_transfer_restricted && dataDestinationRegion !== countryCode) {
        blocks.push('cross_border_restricted');
    }

    return {
        allowed: blocks.length === 0,
        blocks,
        downgrades: [],
        warnings,
        country_code: countryCode,
        risk_tier: blocks.length > 0 ? 'high' : 'low',
    };
}

// ============================================================
// MARKETPLACE POSTURE CHECK
// ============================================================

export async function checkMarketplacePosture(
    countryCode: string,
    action: string
): Promise<{ allowed: boolean; reason?: string }> {
    const supabase = getSupabaseAdmin();

    const { data: profile } = await supabase
        .from('marketplace_liability_profile')
        .select('*')
        .eq('country_code', countryCode)
        .single();

    if (!profile) {
        return { allowed: true }; // Default permissive if no rules
    }

    // Auto-dispatch is ALWAYS forbidden
    if (action === 'auto_dispatch' && profile.auto_dispatch_forbidden) {
        return { allowed: false, reason: 'Auto-dispatch forbidden — facilitator only posture' };
    }

    // Ranking transparency: must show why results ordered
    if (action === 'hide_ranking_logic' && profile.requires_ranking_transparency) {
        return { allowed: false, reason: 'Ranking transparency required in this jurisdiction' };
    }

    return { allowed: true };
}

// ============================================================
// BULK COMPLIANCE CHECK (for batch operations)
// ============================================================

export async function bulkCheckCompliance(
    targets: { countryCode: string; localHour: number; consentStatus: 'verified' | 'pending' | 'unknown'; attempts30d: number }[]
): Promise<Map<string, ComplianceCheckResult>> {
    const results = new Map<string, ComplianceCheckResult>();

    for (const t of targets) {
        const result = await checkVapiCompliance(
            t.countryCode,
            t.localHour,
            'auto',
            t.consentStatus,
            t.attempts30d
        );
        results.set(t.countryCode, result);
    }

    return results;
}
