
/**
 * Haul Command - Compliance Sentinel
 * Core Reciprocity Logic for Pilot Car Certifications
 * Based on 2024 State Certifications & USPilotCar Data
 */

export type StateCode = string; // Two-letter code

export interface DriverCertifications {
    pilot_certs: StateCode[]; // List of states where the driver effectively holds a cert
    has_amber_light_permit: boolean;
    has_ny_cert: boolean; // Explicit check for NY
}

export interface ComplianceCheckResult {
    allowed: boolean;
    blockers: string[];
    warnings: string[];
    missing_certs_for: StateCode[];
}

// 1. The "Golden" Certifications (Keys to the Kingdom)
const GOLDEN_CERTS: Record<StateCode, StateCode[]> = {
    'CO': ['AZ', 'FL', 'GA', 'KS', 'MN', 'NC', 'OK', 'PA', 'UT', 'VA', 'WA'],
    'WA': ['AZ', 'CO', 'FL', 'GA', 'KS', 'MN', 'NC', 'OK', 'UT', 'VA'],
    'NC': ['AZ', 'FL', 'GA', 'MN', 'OK', 'PA', 'UT', 'VA', 'WA'],
    'OK': ['AZ', 'CO', 'FL', 'GA', 'MN', 'NC', 'UT', 'VA', 'WA']
};

// 2. State-Specific Reciprocity Rules (Who accepts Whom)
// Key: The State being entered. Value: List of Certs they accept.
const RECIPROCITY_MATRIX: Record<StateCode, StateCode[]> = {
    'AZ': ['CO', 'FL', 'KS', 'MN', 'NC', 'NY', 'OK', 'UT', 'VA', 'WA'],
    'CO': ['AZ', 'MN', 'OK', 'UT', 'WA'], // Plus SC&RA
    'FL': ['AZ', 'CO', 'GA', 'MN', 'NC', 'OK', 'PA', 'VA', 'WA', 'WI'],
    'GA': ['FL', 'NC', 'OK', 'WA', 'AZ', 'CO', 'UT', 'VA'], // Condition applied below
    'KS': ['CO', 'WA'], // "At least"
    'MN': ['CO', 'FL', 'NC', 'OK', 'UT', 'VA', 'WA'],
    'NC': ['AZ', 'FL', 'GA', 'MN', 'OK', 'PA', 'UT', 'VA', 'WA'],
    'OK': ['CO', 'FL', 'GA', 'MN', 'NC', 'UT', 'VA', 'WA'],
    'PA': ['GA', 'NC', 'VA'], // Plus CO/UT if RSA
    'TX': ['CO', 'WA'], // Technically flagger only, but these act as proof
    'UT': ['AZ', 'CO', 'FL', 'MN', 'NC', 'OK', 'VA', 'WA'],
    'VA': ['FL', 'GA', 'MN', 'NC', 'OK', 'UT', 'WA'],
    'WA': ['AZ', 'CO', 'GA', 'MN', 'NC', 'OK', 'UT', 'VA'],
    'NY': [] // THE WALL: Accepts NO ONE.
};

/**
 * Checks if a driver is legal to operate in a specific state
 */
export function checkStateCompliance(targetState: StateCode, driver: DriverCertifications): { legal: boolean; reason?: string } {
    // Rule 1: The NY Wall
    if (targetState === 'NY') {
        if (driver.has_ny_cert) return { legal: true };
        return { legal: false, reason: 'NY requires specific New York State certification. No reciprocity.' };
    }

    // Rule 2: Georgia Amber Light
    if (targetState === 'GA') {
        if (!driver.has_amber_light_permit) {
            return { legal: false, reason: 'Georgia requires Amber Light Permit' };
        }
    }

    // Rule 3: Direct Certification
    if (driver.pilot_certs.includes(targetState)) {
        return { legal: true };
    }

    // Rule 4: Reciprocity Check
    const acceptedCerts = RECIPROCITY_MATRIX[targetState];
    if (!acceptedCerts) {
        // If state is not in our regulated matrix, assume it's either unregulated or we lack data.
        // For safety in this build, we flag it.
        return { legal: false, reason: 'State data not configured or regulated.' };
    }

    const hasReciprocal = driver.pilot_certs.some(cert => acceptedCerts.includes(cert));
    if (hasReciprocal) {
        return { legal: true };
    }

    return { legal: false, reason: `No valid reciprocal cert found for ${targetState}. Needs one of: ${acceptedCerts.join(', ')}` };
}

/**
 * Validates a full route against driver credentials
 */
export function validateRouteCompliance(routeStates: StateCode[], driver: DriverCertifications): ComplianceCheckResult {
    const result: ComplianceCheckResult = {
        allowed: true,
        blockers: [],
        warnings: [],
        missing_certs_for: []
    };

    for (const state of routeStates) {
        const check = checkStateCompliance(state, driver);
        if (!check.legal) {
            result.allowed = false;
            result.blockers.push(`STATE [${state}]: ${check.reason}`);
            result.missing_certs_for.push(state);
        }
    }

    return result;
}
