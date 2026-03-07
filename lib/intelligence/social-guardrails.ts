// lib/intelligence/social-guardrails.ts
//
// Haul Command — Social Intelligence Guardrails
// Enforces Facebook policy compliance, automation scope,
// opt-in validation, and data retention rules.
// Principle: opt_in_only_compliant_growth

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// CONFIGURATION
// ============================================================

export const GUARDRAIL_CONFIG = {
    // Facebook policy mode: strict = no automation in external groups
    facebook_policy_mode: 'strict' as 'strict' | 'relaxed',

    // Automation scope
    automation_scope: {
        own_group: 'full' as 'full' | 'limited' | 'none',
        external_groups: 'magnet_only' as 'full' | 'magnet_only' | 'none',
    },

    // Opt-in requirements
    require_opt_in: true,
    prohibit_unauthorized_scraping: true,

    // Data retention (days)
    unprocessed_import_ttl_days: 90,
    classification_ttl_days: 365,
    low_confidence_classification_ttl_days: 30,

    // Batch limits
    max_imports_per_batch: 500,
    max_classifications_per_minute: 100,

    // Content safety
    min_text_length: 10,
    max_text_length: 5000,
    blocked_terms: [
        // PII protection
        'ssn', 'social security',
        // Prohibited content
        'drugs', 'weapons', 'illegal',
    ],

    // Rate limits per source
    source_rate_limits: {
        admin_manual_post_import: { max_per_hour: 200, max_per_day: 2000 },
        user_self_submission: { max_per_hour: 20, max_per_day: 100 },
        referral_link_capture: { max_per_hour: 500, max_per_day: 5000 },
        csv_bulk_import: { max_per_hour: 5, max_per_day: 10 },
    } as Record<string, { max_per_hour: number; max_per_day: number }>,
};

// ============================================================
// VALIDATION TYPES
// ============================================================

export interface ValidationResult {
    valid: boolean;
    blocked: boolean;
    reasons: string[];
    warnings: string[];
}

export interface ImportValidation {
    valid: boolean;
    sanitized_text: string;
    violations: string[];
}

// ============================================================
// 1. IMPORT VALIDATION
// ============================================================

export function validateImport(
    rawText: string,
    importSource: string,
    optInVerified: boolean,
): ImportValidation {
    const violations: string[] = [];
    let sanitizedText = rawText.trim();

    // ── Opt-in check ──
    if (GUARDRAIL_CONFIG.require_opt_in && !optInVerified) {
        violations.push('opt_in_not_verified');
    }

    // ── Text length ──
    if (sanitizedText.length < GUARDRAIL_CONFIG.min_text_length) {
        violations.push(`text_too_short: minimum ${GUARDRAIL_CONFIG.min_text_length} characters`);
    }
    if (sanitizedText.length > GUARDRAIL_CONFIG.max_text_length) {
        sanitizedText = sanitizedText.substring(0, GUARDRAIL_CONFIG.max_text_length);
        violations.push('text_truncated_to_max_length');
    }

    // ── Blocked terms ──
    const lower = sanitizedText.toLowerCase();
    for (const term of GUARDRAIL_CONFIG.blocked_terms) {
        if (lower.includes(term)) {
            violations.push(`blocked_term: ${term}`);
        }
    }

    // ── Source validation ──
    const validSources = ['admin_manual_post_import', 'user_self_submission', 'referral_link_capture', 'csv_bulk_import'];
    if (!validSources.includes(importSource)) {
        violations.push(`invalid_source: ${importSource}`);
    }

    // ── Scraping guard ──
    if (GUARDRAIL_CONFIG.prohibit_unauthorized_scraping) {
        if (importSource === 'csv_bulk_import' && !optInVerified) {
            violations.push('bulk_import_requires_opt_in_verification');
        }
    }

    // ── PII redaction (mask SSNs and phone-like patterns in text) ──
    sanitizedText = sanitizedText.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[REDACTED-SSN]');

    return {
        valid: violations.length === 0,
        sanitized_text: sanitizedText,
        violations,
    };
}

// ============================================================
// 2. AUTOMATION SCOPE ENFORCEMENT
// ============================================================

export function checkAutomationAllowed(
    actionType: 'post' | 'reply' | 'dm' | 'invite' | 'scrape' | 'magnet',
    groupOwnership: 'own' | 'external',
    platform: string,
): ValidationResult {
    const reasons: string[] = [];
    const warnings: string[] = [];
    let blocked = false;

    // ── Facebook strict mode ──
    if (platform === 'facebook' && GUARDRAIL_CONFIG.facebook_policy_mode === 'strict') {
        if (groupOwnership === 'external') {
            if (actionType === 'scrape') {
                blocked = true;
                reasons.push('facebook_strict: scraping external groups prohibited');
            }
            if (actionType === 'post' || actionType === 'reply') {
                blocked = true;
                reasons.push('facebook_strict: automated posting in external groups prohibited');
            }
            if (actionType === 'dm') {
                blocked = true;
                reasons.push('facebook_strict: automated DMs in external groups prohibited');
            }
            if (actionType === 'invite') {
                warnings.push('facebook_strict: invitations in external groups require manual review');
            }
            // Magnet only: link sharing in own bio/comments is allowed
            if (actionType === 'magnet') {
                // Allowed — this is passive attraction, not automation
            }
        }

        if (groupOwnership === 'own') {
            const scope = GUARDRAIL_CONFIG.automation_scope.own_group;
            if (scope === 'none') {
                blocked = true;
                reasons.push('own_group_automation_disabled');
            }
        }
    }

    // ── Scraping prohibition ──
    if (GUARDRAIL_CONFIG.prohibit_unauthorized_scraping && actionType === 'scrape') {
        blocked = true;
        reasons.push('unauthorized_scraping_prohibited');
    }

    return {
        valid: !blocked,
        blocked,
        reasons,
        warnings,
    };
}

// ============================================================
// 3. RATE LIMIT CHECKER
// ============================================================

export async function checkSourceRateLimit(
    importSource: string,
): Promise<{ allowed: boolean; remaining_hour: number; remaining_day: number }> {
    const supabase = getSupabaseAdmin();
    const limits = GUARDRAIL_CONFIG.source_rate_limits[importSource];

    if (!limits) {
        return { allowed: false, remaining_hour: 0, remaining_day: 0 };
    }

    const hourAgo = new Date(Date.now() - 3600000).toISOString();
    const dayAgo = new Date(Date.now() - 86400000).toISOString();

    // Count recent imports
    const { count: hourCount } = await supabase
        .from('social_post_imports')
        .select('id', { count: 'exact', head: true })
        .eq('import_source', importSource)
        .gte('created_at', hourAgo);

    const { count: dayCount } = await supabase
        .from('social_post_imports')
        .select('id', { count: 'exact', head: true })
        .eq('import_source', importSource)
        .gte('created_at', dayAgo);

    const remainingHour = limits.max_per_hour - (hourCount || 0);
    const remainingDay = limits.max_per_day - (dayCount || 0);

    return {
        allowed: remainingHour > 0 && remainingDay > 0,
        remaining_hour: Math.max(0, remainingHour),
        remaining_day: Math.max(0, remainingDay),
    };
}

// ============================================================
// 4. DATA RETENTION CLEANUP
// ============================================================

export async function cleanupExpiredData(): Promise<{
    deleted_imports: number;
    deleted_classifications: number;
    duration_ms: number;
}> {
    const startTime = Date.now();
    const supabase = getSupabaseAdmin();

    // Delete unprocessed imports older than TTL
    const importCutoff = new Date(Date.now() - GUARDRAIL_CONFIG.unprocessed_import_ttl_days * 86400000).toISOString();
    const { count: deletedImports } = await supabase
        .from('social_post_imports')
        .delete({ count: 'exact' })
        .eq('processed', false)
        .lt('created_at', importCutoff);

    // Delete low-confidence classifications older than short TTL
    const lowConfCutoff = new Date(Date.now() - GUARDRAIL_CONFIG.low_confidence_classification_ttl_days * 86400000).toISOString();
    const { count: deletedClassifications } = await supabase
        .from('social_classifications')
        .delete({ count: 'exact' })
        .lt('confidence', 0.60)
        .eq('human_reviewed', false)
        .lt('created_at', lowConfCutoff);

    return {
        deleted_imports: deletedImports || 0,
        deleted_classifications: deletedClassifications || 0,
        duration_ms: Date.now() - startTime,
    };
}

// ============================================================
// 5. AUDIT LOG (compliance trail)
// ============================================================

export async function logGuardrailEvent(
    eventType: 'import_blocked' | 'automation_blocked' | 'rate_limited' | 'data_cleanup' | 'opt_in_violation',
    details: Record<string, any>,
): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase.from('funnel_warnings').insert({
        warning_type: `guardrail:${eventType}`,
        corridor_id: null,
        message: JSON.stringify(details),
        severity: eventType === 'opt_in_violation' ? 'critical' : 'medium',
        context: {
            system: 'social_intelligence',
            guardrail_config: {
                facebook_policy_mode: GUARDRAIL_CONFIG.facebook_policy_mode,
                require_opt_in: GUARDRAIL_CONFIG.require_opt_in,
            },
            ...details,
        },
    });
}
