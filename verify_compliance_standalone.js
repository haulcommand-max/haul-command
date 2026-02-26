
/**
 * Haul Command - Compliance Sentinel Verification (Standalone JS)
 * Core Reciprocity Logic for Pilot Car Certifications
 */

// --- LOGIC SECTION (Transpiled from reciprocity_rules.ts) ---

// 1. The "Golden" Certifications (Keys to the Kingdom)
const GOLDEN_CERTS = {
    'CO': ['AZ', 'FL', 'GA', 'KS', 'MN', 'NC', 'OK', 'PA', 'UT', 'VA', 'WA'],
    'WA': ['AZ', 'CO', 'FL', 'GA', 'KS', 'MN', 'NC', 'OK', 'UT', 'VA'],
    'NC': ['AZ', 'FL', 'GA', 'MN', 'OK', 'PA', 'UT', 'VA', 'WA'],
    'OK': ['AZ', 'CO', 'FL', 'GA', 'MN', 'NC', 'UT', 'VA', 'WA']
};

// 2. State-Specific Reciprocity Rules (Who accepts Whom)
const RECIPROCITY_MATRIX = {
    'AZ': ['CO', 'FL', 'KS', 'MN', 'NC', 'NY', 'OK', 'UT', 'VA', 'WA'],
    'CO': ['AZ', 'MN', 'OK', 'UT', 'WA'], // Plus SC&RA
    'FL': ['AZ', 'CO', 'GA', 'MN', 'NC', 'OK', 'PA', 'VA', 'WA', 'WI'],
    'GA': ['FL', 'NC', 'OK', 'WA', 'AZ', 'CO', 'UT', 'VA'],
    'KS': ['CO', 'WA'], // "At least"
    'MN': ['CO', 'FL', 'NC', 'OK', 'UT', 'VA', 'WA'],
    'NC': ['AZ', 'FL', 'GA', 'MN', 'OK', 'PA', 'UT', 'VA', 'WA'],
    'OK': ['CO', 'FL', 'GA', 'MN', 'NC', 'UT', 'VA', 'WA'],
    'PA': ['GA', 'NC', 'VA'], // Plus CO/UT if RSA
    'TX': ['CO', 'WA'],
    'UT': ['AZ', 'CO', 'FL', 'MN', 'NC', 'OK', 'VA', 'WA'],
    'VA': ['FL', 'GA', 'MN', 'NC', 'OK', 'UT', 'WA'],
    'WA': ['AZ', 'CO', 'GA', 'MN', 'NC', 'OK', 'UT', 'VA'],
    'NY': [] // THE WALL: Accepts NO ONE.
};

function checkStateCompliance(targetState, driver) {
    // Rule 1: The NY Wall
    if (targetState === 'NY') {
        if (driver.has_ny_cert) return { legal: true };
        return { legal: false, reason: 'NY requires specific New York State certification. No reciprocity.' };
    }

    // Rule 2: Georgia Amber Light
    if (targetState === 'GA') {
        if (!driver.has_amber_light_permit) {
            return { legal: false, reason: 'Georgia requires Amber Light Permit check failed' };
        }
    }

    // Rule 3: Direct Certification
    if (driver.pilot_certs.includes(targetState)) {
        return { legal: true };
    }

    // Rule 4: Reciprocity Check
    const acceptedCerts = RECIPROCITY_MATRIX[targetState];
    if (!acceptedCerts) {
        return { legal: false, reason: 'State data not configured or regulated.' };
    }

    const hasReciprocal = driver.pilot_certs.some(cert => acceptedCerts.includes(cert));
    if (hasReciprocal) {
        return { legal: true };
    }

    return { legal: false, reason: `No valid reciprocal cert found for ${targetState}. Needs one of: ${acceptedCerts.join(', ')}` };
}

function validateRouteCompliance(routeStates, driver) {
    const result = {
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

// --- TEST SECTION ---

console.log('--- TEST 1: CO Driver (Golden Key) ---');
console.log('Driver has CO cert, Amber Light, No NY.');
const driverCO = {
    pilot_certs: ['CO'],
    has_amber_light_permit: true,
    has_ny_cert: false
};
// Should pass in AZ, FL, GA (with amber), MN, NC, OK
const route1 = ['AZ', 'FL', 'NC'];
const result1 = validateRouteCompliance(route1, driverCO);
console.log(`Route ${route1.join('->')}: Allowed? ${result1.allowed}`);
if (!result1.allowed) console.log(result1.blockers);

console.log('\n--- TEST 2: The NY Wall ---');
console.log('Driver has CO cert, trying to enter NY.');
const route2 = ['PA', 'NY'];
const result2 = validateRouteCompliance(route2, driverCO);
console.log(`Route ${route2.join('->')}: Allowed? ${result2.allowed}`);
console.log('Blockers:', result2.blockers);

console.log('\n--- TEST 3: GA Amber Light ---');
console.log('Driver has CO cert but NO Amber Light Permit.');
const driverNoAmber = {
    pilot_certs: ['CO'],
    has_amber_light_permit: false,
    has_ny_cert: false
};
const result3 = checkStateCompliance('GA', driverNoAmber);
console.log(`CO Driver entering GA: Legal? ${result3.legal}`);
console.log('Reason:', result3.reason);

console.log('\n--- TEST 4: Weak Reciprocity (AZ -> PA) ---');
console.log('Driver has AZ cert only (not Golden). PA does not accept AZ.');
const driverAZ = {
    pilot_certs: ['AZ'],
    has_amber_light_permit: true,
    has_ny_cert: false
};
const result4 = checkStateCompliance('PA', driverAZ);
console.log(`AZ Driver entering PA: Legal? ${result4.legal}`);
console.log('Reason:', result4.reason);
