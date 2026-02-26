/**
 * Regulation Resolution Engine
 *
 * Cascading rule lookup: region → country → fallback
 * Logs every resolution for coverage analysis.
 */

import { createClient } from '@/utils/supabase/server';

export interface RegulationResult {
    found: boolean;
    ruleValue: string | null;
    ruleUnit: string | null;
    resolutionLevel: 'region' | 'country' | 'fallback';
    confidence: number;
    sourceUrl: string | null;
    disclaimer: string;
    lastVerified: string | null;
}

export interface HolidayRestriction {
    holidayName: string;
    startDate: string;
    endDate: string;
    oversizeTravelAllowed: boolean;
    restrictionNotes: string | null;
    confidence: number;
}

/**
 * Resolve a regulation rule with cascading priority:
 * 1. Region-specific rule (e.g., FL, NSW, Bayern)
 * 2. Country-level default
 * 3. Fallback with low confidence
 */
export async function resolveRegulation(
    countryCode: string,
    regionCode: string | null,
    ruleType: string,
    ruleKey: string,
): Promise<RegulationResult> {
    const supabase = await createClient();

    // Step 1: Try region-specific rule
    if (regionCode) {
        const { data: regionRule } = await supabase
            .from('regulation_rules')
            .select('*')
            .eq('country_code', countryCode)
            .eq('region_code', regionCode)
            .eq('rule_type', ruleType)
            .eq('rule_key', ruleKey)
            .maybeSingle();

        if (regionRule) {
            await logResolution(supabase, countryCode, regionCode, ruleType, true, 'region', regionRule.confidence_score);
            return {
                found: true,
                ruleValue: regionRule.rule_value,
                ruleUnit: regionRule.rule_unit,
                resolutionLevel: 'region',
                confidence: regionRule.confidence_score || 0.7,
                sourceUrl: regionRule.source_url,
                disclaimer: regionRule.disclaimer || 'Always verify with local authority.',
                lastVerified: regionRule.last_verified_at,
            };
        }
    }

    // Step 2: Try country-level default (region_code IS NULL)
    const { data: countryRule } = await supabase
        .from('regulation_rules')
        .select('*')
        .eq('country_code', countryCode)
        .is('region_code', null)
        .eq('rule_type', ruleType)
        .eq('rule_key', ruleKey)
        .maybeSingle();

    if (countryRule) {
        await logResolution(supabase, countryCode, regionCode, ruleType, true, 'country', countryRule.confidence_score);
        return {
            found: true,
            ruleValue: countryRule.rule_value,
            ruleUnit: countryRule.rule_unit,
            resolutionLevel: 'country',
            confidence: countryRule.confidence_score || 0.5,
            sourceUrl: countryRule.source_url,
            disclaimer: countryRule.disclaimer || 'Always verify with local authority.',
            lastVerified: countryRule.last_verified_at,
        };
    }

    // Step 3: Fallback — no rule found
    await logResolution(supabase, countryCode, regionCode, ruleType, false, 'fallback', 0);
    return {
        found: false,
        ruleValue: null,
        ruleUnit: null,
        resolutionLevel: 'fallback',
        confidence: 0,
        sourceUrl: null,
        disclaimer: 'Regulation data not yet available for this region. Always verify with local authority.',
        lastVerified: null,
    };
}

/**
 * Check active holiday travel restrictions for a country + optional region.
 */
export async function getActiveRestrictions(
    countryCode: string,
    regionCode?: string,
    targetDate?: Date,
): Promise<HolidayRestriction[]> {
    const supabase = await createClient();
    const checkDate = (targetDate || new Date()).toISOString().split('T')[0];

    let query = supabase
        .from('holiday_restrictions')
        .select('*')
        .eq('country_code', countryCode)
        .lte('start_date', checkDate)
        .gte('end_date', checkDate);

    if (regionCode) {
        // Get both national and regional restrictions
        query = query.or(`region_code.is.null,region_code.eq.${regionCode}`);
    }

    const { data } = await query;

    return (data || []).map(r => ({
        holidayName: r.holiday_name,
        startDate: r.start_date,
        endDate: r.end_date,
        oversizeTravelAllowed: r.oversize_travel_allowed,
        restrictionNotes: r.restriction_notes,
        confidence: r.confidence_score || 0.7,
    }));
}

/**
 * Get country localization profile.
 */
export async function getCountryProfile(countryCode: string) {
    const supabase = await createClient();
    const { data } = await supabase
        .from('country_localization')
        .select('*')
        .eq('country_code', countryCode)
        .maybeSingle();
    return data;
}

// ── Internal ───────────────────────────────────────────────────────────────

async function logResolution(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    supabase: any,
    countryCode: string,
    regionCode: string | null,
    ruleType: string,
    found: boolean,
    level: string,
    confidence: number,
) {
    try {
        await supabase.from('regulation_resolution_log').insert({
            resolved_country: countryCode,
            resolved_region: regionCode,
            rule_type: ruleType,
            rule_found: found,
            resolution_level: level,
            confidence,
        });
    } catch {
        // Non-blocking — logging should never fail the resolution
    }
}
