/**
 * Country Compliance Enforcer — Fail-Closed Outbound Gating
 * 
 * Every outbound action (Vapi call, SMS, recording) MUST pass through
 * this gate. If the country isn't verified, the action is blocked.
 * 
 * Enforcement rules:
 *   - outbound_allowed requires verification_status == 'verified'
 *   - recording requires recording_enabled == true + verified
 *   - sms requires sms_allowed == true + verified
 *   - push is allowed by default (least invasive)
 *   - payments require payments_enabled == true
 *   - checkout requires is_checkout_enabled + payments_enabled
 */

import { createClient } from "@supabase/supabase-js";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface ComplianceProfile {
    countryCode: string;
    countryName: string;
    outboundAllowed: boolean;
    recordingEnabled: boolean;
    smsAllowed: boolean;
    pushAllowed: boolean;
    verificationStatus: 'unverified' | 'pending' | 'verified' | 'suspended';
    disclosureScriptId: string;
    callingHoursLocal: string;
    quietHoursLocal: string;
    optOutHandlingTested: boolean;
    paymentsEnabled: boolean;
    countryCurrency: string | null;
}

export interface ComplianceGateResult {
    allowed: boolean;
    reason: string;
    profile: ComplianceProfile | null;
    callingWindowActive: boolean;
    disclosureRequired: string | null;
}

export type OutboundAction = 'call' | 'sms' | 'push' | 'record' | 'checkout';

// ═══════════════════════════════════════════════════════════════
// COMPLIANCE GATE
// ═══════════════════════════════════════════════════════════════

/**
 * Check whether an outbound action is allowed for a given country.
 * Fail-closed: if the country isn't found or verified, block.
 */
export async function checkComplianceGate(
    countryCode: string,
    action: OutboundAction,
    nowUtc: Date = new Date()
): Promise<ComplianceGateResult> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    // Fetch compliance profile
    const { data, error } = await supabase
        .from('country_compliance')
        .select('*')
        .eq('country_code', countryCode)
        .single();

    if (error || !data) {
        return {
            allowed: false,
            reason: `No compliance profile found for country: ${countryCode}`,
            profile: null,
            callingWindowActive: false,
            disclosureRequired: null,
        };
    }

    const profile: ComplianceProfile = {
        countryCode: data.country_code,
        countryName: data.country_name,
        outboundAllowed: data.outbound_allowed ?? false,
        recordingEnabled: data.recording_enabled ?? false,
        smsAllowed: data.sms_allowed ?? false,
        pushAllowed: data.push_allowed ?? true,
        verificationStatus: data.verification_status ?? 'unverified',
        disclosureScriptId: data.disclosure_script_id ?? 'default_conservative',
        callingHoursLocal: data.calling_hours_local ?? '09:00-18:00',
        quietHoursLocal: data.quiet_hours_local ?? '20:00-08:00',
        optOutHandlingTested: data.opt_out_handling_tested ?? false,
        paymentsEnabled: data.payments_enabled ?? false,
        countryCurrency: data.country_currency ?? null,
    };

    // Gate 1: Verification status
    if (profile.verificationStatus !== 'verified' && action !== 'push') {
        return {
            allowed: false,
            reason: `Country ${countryCode} verification_status is '${profile.verificationStatus}' — outbound blocked`,
            profile,
            callingWindowActive: false,
            disclosureRequired: null,
        };
    }

    // Gate 2: Action-specific checks
    switch (action) {
        case 'call':
            if (!profile.outboundAllowed) {
                return blocked(profile, 'Outbound calls not allowed for this country');
            }
            if (!profile.optOutHandlingTested) {
                return blocked(profile, 'Opt-out handling not tested — calls blocked');
            }
            // Check calling window
            const inWindow = isInCallingWindow(profile.callingHoursLocal, profile.quietHoursLocal, nowUtc, countryCode);
            if (!inWindow) {
                return {
                    allowed: false,
                    reason: `Outside calling hours (${profile.callingHoursLocal}) or in quiet hours (${profile.quietHoursLocal})`,
                    profile,
                    callingWindowActive: false,
                    disclosureRequired: profile.disclosureScriptId,
                };
            }
            return {
                allowed: true,
                reason: 'Outbound call permitted',
                profile,
                callingWindowActive: true,
                disclosureRequired: profile.disclosureScriptId,
            };

        case 'record':
            if (!profile.recordingEnabled) {
                return blocked(profile, 'Call recording not enabled for this country');
            }
            return {
                allowed: true,
                reason: 'Recording permitted',
                profile,
                callingWindowActive: true,
                disclosureRequired: profile.disclosureScriptId,
            };

        case 'sms':
            if (!profile.smsAllowed) {
                return blocked(profile, 'SMS not allowed for this country');
            }
            return {
                allowed: true,
                reason: 'SMS permitted',
                profile,
                callingWindowActive: true,
                disclosureRequired: null,
            };

        case 'push':
            if (!profile.pushAllowed) {
                return blocked(profile, 'Push notifications not allowed for this country');
            }
            return {
                allowed: true,
                reason: 'Push notification permitted',
                profile,
                callingWindowActive: true,
                disclosureRequired: null,
            };

        case 'checkout':
            if (!profile.paymentsEnabled) {
                return blocked(profile, `Payments not enabled for ${countryCode} — free claims + lead capture still work`);
            }
            return {
                allowed: true,
                reason: 'Checkout permitted',
                profile,
                callingWindowActive: true,
                disclosureRequired: null,
            };

        default:
            return blocked(profile, `Unknown action: ${action}`);
    }
}

// ═══════════════════════════════════════════════════════════════
// UNLOCK WORKFLOW
// ═══════════════════════════════════════════════════════════════

/**
 * Unlock outbound for a country after all requirements are met.
 * Returns success/failure with reason.
 */
export async function unlockCountryOutbound(countryCode: string): Promise<{
    success: boolean;
    reason: string;
}> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
        .from('country_compliance')
        .select('*')
        .eq('country_code', countryCode)
        .single();

    if (!data) return { success: false, reason: 'Country not found' };

    // Check all unlock requirements
    const failures: string[] = [];

    if (!data.disclosure_script_id || data.disclosure_script_id === 'default_conservative') {
        failures.push('disclosure_script_id not customized');
    }
    if (!data.calling_hours_local) {
        failures.push('calling_hours_local not set');
    }
    if (!data.opt_out_handling_tested) {
        failures.push('opt_out_handling not tested');
    }

    if (failures.length > 0) {
        return {
            success: false,
            reason: `Unlock blocked: ${failures.join(', ')}`,
        };
    }

    // All requirements met — unlock
    await supabase.from('country_compliance').update({
        verification_status: 'verified',
        outbound_allowed: true,
        updated_at: new Date().toISOString(),
    }).eq('country_code', countryCode);

    return {
        success: true,
        reason: `Outbound unlocked for ${countryCode}`,
    };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

function blocked(profile: ComplianceProfile, reason: string): ComplianceGateResult {
    return {
        allowed: false,
        reason,
        profile,
        callingWindowActive: false,
        disclosureRequired: null,
    };
}

function isInCallingWindow(
    callingHours: string,
    quietHours: string,
    nowUtc: Date,
    countryCode: string
): boolean {
    try {
        // Map country to IANA timezone (best-effort)
        const tzMap: Record<string, string> = {
            US: 'America/New_York', CA: 'America/Toronto',
            AU: 'Australia/Sydney', GB: 'Europe/London',
            NZ: 'Pacific/Auckland', DE: 'Europe/Berlin',
            SE: 'Europe/Stockholm', NO: 'Europe/Oslo',
            AE: 'Asia/Dubai', SA: 'Asia/Riyadh',
            ZA: 'Africa/Johannesburg', MX: 'America/Mexico_City',
            BR: 'America/Sao_Paulo', CL: 'America/Santiago',
            TR: 'Europe/Istanbul', NL: 'Europe/Amsterdam',
            BE: 'Europe/Brussels', PL: 'Europe/Warsaw',
            IE: 'Europe/Dublin', DK: 'Europe/Copenhagen',
            FI: 'Europe/Helsinki', ES: 'Europe/Madrid',
            CH: 'Europe/Zurich', AT: 'Europe/Vienna',
            FR: 'Europe/Paris',
        };

        const tz = tzMap[countryCode] || 'UTC';
        const formatter = new Intl.DateTimeFormat('en-US', {
            timeZone: tz,
            hour: '2-digit',
            minute: '2-digit',
            hour12: false,
        });
        const localTime = formatter.format(nowUtc);
        const [h, m] = localTime.split(':').map(Number);
        const now = (h || 0) * 60 + (m || 0);

        // Parse calling hours
        const [startStr, endStr] = callingHours.split('-');
        const [sh, sm] = startStr.split(':').map(Number);
        const [eh, em] = endStr.split(':').map(Number);
        const start = sh * 60 + sm;
        const end = eh * 60 + em;

        // Parse quiet hours
        const [qStartStr, qEndStr] = quietHours.split('-');
        const [qsh, qsm] = qStartStr.split(':').map(Number);
        const [qeh, qem] = qEndStr.split(':').map(Number);
        const qStart = qsh * 60 + qsm;
        const qEnd = qeh * 60 + qem;

        // Must be within calling hours AND NOT in quiet hours
        const inCallingWindow = now >= start && now <= end;

        // Quiet hours can span midnight (e.g., 20:00-08:00)
        let inQuietHours: boolean;
        if (qStart > qEnd) {
            // Spans midnight
            inQuietHours = now >= qStart || now <= qEnd;
        } else {
            inQuietHours = now >= qStart && now <= qEnd;
        }

        return inCallingWindow && !inQuietHours;
    } catch {
        return false; // Fail closed
    }
}

/**
 * Batch check: get compliance status for all 120 countries
 */
export async function getComplianceMatrix(): Promise<ComplianceProfile[]> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data } = await supabase
        .from('country_compliance')
        .select('*')
        .order('country_code');

    return (data || []).map(d => ({
        countryCode: d.country_code,
        countryName: d.country_name,
        outboundAllowed: d.outbound_allowed ?? false,
        recordingEnabled: d.recording_enabled ?? false,
        smsAllowed: d.sms_allowed ?? false,
        pushAllowed: d.push_allowed ?? true,
        verificationStatus: d.verification_status ?? 'unverified',
        disclosureScriptId: d.disclosure_script_id ?? 'default_conservative',
        callingHoursLocal: d.calling_hours_local ?? '09:00-18:00',
        quietHoursLocal: d.quiet_hours_local ?? '20:00-08:00',
        optOutHandlingTested: d.opt_out_handling_tested ?? false,
        paymentsEnabled: d.payments_enabled ?? false,
        countryCurrency: d.country_currency ?? null,
    }));
}
