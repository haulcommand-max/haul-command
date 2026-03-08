/**
 * Country Feature Gate Matrix
 * 
 * Gates sensitive features by country and legal/compliance readiness.
 * Default: conservative OFF. Features must be explicitly enabled.
 * 
 * Feature states: on | assisted | simulated | off
 */

export type FeatureState = 'on' | 'assisted' | 'simulated' | 'off';

export type GatedFeature =
    | 'automated_dispatch'
    | 'voice_outbound'
    | 'crypto_payments'
    | 'sms_outreach'
    | 'email_outreach'
    | 'background_checks'
    | 'insurance_verification'
    | 'credential_enforcement'
    | 'load_board_integration'
    | 'territory_sponsorship'
    | 'data_api'
    | 'gps_tracking';

interface GateEntry {
    feature: GatedFeature;
    state: FeatureState;
    reason?: string;
    override_allowed: boolean;
    requires_compliance_review: boolean;
}

// Default: everything off unless explicitly enabled
const GLOBAL_DEFAULTS: Record<GatedFeature, GateEntry> = {
    automated_dispatch: { feature: 'automated_dispatch', state: 'off', override_allowed: false, requires_compliance_review: true },
    voice_outbound: { feature: 'voice_outbound', state: 'off', override_allowed: false, requires_compliance_review: true },
    crypto_payments: { feature: 'crypto_payments', state: 'off', override_allowed: false, requires_compliance_review: true },
    sms_outreach: { feature: 'sms_outreach', state: 'off', override_allowed: false, requires_compliance_review: true },
    email_outreach: { feature: 'email_outreach', state: 'simulated', override_allowed: true, requires_compliance_review: false },
    background_checks: { feature: 'background_checks', state: 'off', override_allowed: false, requires_compliance_review: true },
    insurance_verification: { feature: 'insurance_verification', state: 'assisted', override_allowed: true, requires_compliance_review: false },
    credential_enforcement: { feature: 'credential_enforcement', state: 'assisted', override_allowed: true, requires_compliance_review: false },
    load_board_integration: { feature: 'load_board_integration', state: 'on', override_allowed: true, requires_compliance_review: false },
    territory_sponsorship: { feature: 'territory_sponsorship', state: 'on', override_allowed: true, requires_compliance_review: false },
    data_api: { feature: 'data_api', state: 'off', override_allowed: false, requires_compliance_review: true },
    gps_tracking: { feature: 'gps_tracking', state: 'off', override_allowed: false, requires_compliance_review: true },
};

// Country-specific overrides — Tier A countries get more features
const COUNTRY_OVERRIDES: Record<string, Partial<Record<GatedFeature, FeatureState>>> = {
    US: {
        sms_outreach: 'on',
        email_outreach: 'on',
        voice_outbound: 'assisted',
        credential_enforcement: 'on',
        insurance_verification: 'on',
        background_checks: 'assisted',
        automated_dispatch: 'simulated',
        gps_tracking: 'assisted',
    },
    CA: {
        sms_outreach: 'on',
        email_outreach: 'on',
        voice_outbound: 'assisted',
        credential_enforcement: 'on',
        insurance_verification: 'on',
        automated_dispatch: 'simulated',
    },
    AU: {
        email_outreach: 'on',
        credential_enforcement: 'on',
        insurance_verification: 'on',
        sms_outreach: 'assisted',
    },
    GB: {
        email_outreach: 'on',
        credential_enforcement: 'on',
        insurance_verification: 'on',
        sms_outreach: 'assisted',
    },
    NZ: {
        email_outreach: 'on',
        credential_enforcement: 'assisted',
        insurance_verification: 'assisted',
    },
    DE: {
        email_outreach: 'on',
        credential_enforcement: 'on',
    },
};

// Crypto-specific legality (synced with hc_crypto_legality table)
const CRYPTO_ALLOWED = new Set(['US', 'CA', 'AU', 'GB', 'DE', 'NZ', 'JP', 'SG', 'CH', 'KR']);
const CRYPTO_RESTRICTED = new Set(['CN', 'IN', 'RU', 'BD', 'NP', 'QA', 'EG', 'MA', 'DZ', 'BO']);

export function getFeatureState(country_code: string, feature: GatedFeature): GateEntry {
    const base = { ...GLOBAL_DEFAULTS[feature] };
    const countryOverrides = COUNTRY_OVERRIDES[country_code];

    if (countryOverrides && countryOverrides[feature]) {
        base.state = countryOverrides[feature]!;
    }

    // Special crypto logic
    if (feature === 'crypto_payments') {
        if (CRYPTO_RESTRICTED.has(country_code)) {
            base.state = 'off';
            base.reason = 'Crypto restricted in this jurisdiction';
            base.override_allowed = false;
        } else if (CRYPTO_ALLOWED.has(country_code)) {
            base.state = 'on';
        }
    }

    return base;
}

export function getCountryGates(country_code: string): Record<GatedFeature, GateEntry> {
    const features = Object.keys(GLOBAL_DEFAULTS) as GatedFeature[];
    const result: Partial<Record<GatedFeature, GateEntry>> = {};
    for (const f of features) {
        result[f] = getFeatureState(country_code, f);
    }
    return result as Record<GatedFeature, GateEntry>;
}

export function isFeatureEnabled(country_code: string, feature: GatedFeature): boolean {
    const state = getFeatureState(country_code, feature).state;
    return state === 'on' || state === 'assisted';
}

export function isFeatureSimulated(country_code: string, feature: GatedFeature): boolean {
    return getFeatureState(country_code, feature).state === 'simulated';
}

export function getCountryTier(country_code: string): 'A' | 'B' | 'C' {
    if (['US', 'CA'].includes(country_code)) return 'A';
    if (['AU', 'GB', 'NZ', 'DE'].includes(country_code)) return 'B';
    return 'C';
}
