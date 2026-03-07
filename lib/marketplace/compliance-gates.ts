// lib/marketplace/compliance-gates.ts
//
// Compliance & Safety Gates for the Escort Marketplace
// Mandatory checks that MUST pass before an operator can be matched or booked.
// Integrates with certification reciprocity data (ESC PEVO, WITPAC, state-specific).

export interface ComplianceCheckResult {
    passed: boolean;
    checks: ComplianceCheck[];
    hard_fails: string[];
    soft_signals: string[];
    overall_score: number; // 0-1
}

export interface ComplianceCheck {
    check_id: string;
    label: string;
    type: "hard" | "soft";
    passed: boolean;
    detail?: string;
}

// ============================================================
// CERTIFICATION RECIPROCITY MAP
// ============================================================
// WA State PEVO certification is accepted in these states (via ESC.org data)

const WA_PEVO_RECIPROCITY_STATES = new Set([
    "AZ", "CO", "FL", "GA", "KS", "MN", "NY", "NC", "OK", "PA", "TX", "UT", "VA", "WA",
]);

// States that require their own specific certification
const STATE_SPECIFIC_CERT_REQUIRED = new Set([
    "FL", // UF Tech Transfer certification
    "TX", // TxDOT pilot car requirements
    "CA", // Caltrans requirements
    "IL", // IDOT requirements
]);

// ============================================================
// MANDATORY COMPLIANCE CHECKS
// ============================================================

export function runComplianceGates(
    operator: {
        operator_id: string;
        country_code: string;
        compliance_flags: Record<string, any>;
        trust_score: number;
        service_tags: string[];
    },
    load: {
        country_code: string;
        admin1_code: string | null;
        special_requirements: string[];
        load_type_tags: string[];
    }
): ComplianceCheckResult {
    const checks: ComplianceCheck[] = [];
    const hardFails: string[] = [];
    const softSignals: string[] = [];
    const flags = operator.compliance_flags ?? {};

    // --- HARD GATE: Fraud / Safety flags ---
    if (flags.fraud_flagged) {
        checks.push({
            check_id: "fraud_flag",
            label: "Fraud flagged",
            type: "hard",
            passed: false,
            detail: "Operator has been flagged for fraud",
        });
        hardFails.push("fraud_flagged");
    } else {
        checks.push({ check_id: "fraud_flag", label: "No fraud flag", type: "hard", passed: true });
    }

    if (flags.safety_suspended) {
        checks.push({
            check_id: "safety_suspension",
            label: "Safety suspended",
            type: "hard",
            passed: false,
            detail: "Operator is safety-suspended",
        });
        hardFails.push("safety_suspended");
    } else {
        checks.push({ check_id: "safety_suspension", label: "No safety suspension", type: "hard", passed: true });
    }

    // --- HARD GATE: Country/jurisdiction licensing ---
    if (load.country_code === "US" && load.admin1_code) {
        const stateCode = load.admin1_code.toUpperCase();

        // Check if operator has verified license
        if (flags.license_verified) {
            checks.push({
                check_id: "license_verified",
                label: "License verified",
                type: "hard",
                passed: true,
            });

            // Check state-specific certification requirements
            if (STATE_SPECIFIC_CERT_REQUIRED.has(stateCode)) {
                const hasStateCert = flags[`cert_${stateCode.toLowerCase()}`] === true;
                const hasWaReciprocity = flags.cert_wa_pevo === true && WA_PEVO_RECIPROCITY_STATES.has(stateCode);

                if (hasStateCert || hasWaReciprocity) {
                    checks.push({
                        check_id: "state_certification",
                        label: `${stateCode} certification or reciprocity`,
                        type: "hard",
                        passed: true,
                        detail: hasStateCert
                            ? `Has ${stateCode}-specific certification`
                            : `WA PEVO reciprocity accepted in ${stateCode}`,
                    });
                } else {
                    checks.push({
                        check_id: "state_certification",
                        label: `${stateCode} certification required`,
                        type: "hard",
                        passed: false,
                        detail: `${stateCode} requires specific certification. WA PEVO reciprocity: ${WA_PEVO_RECIPROCITY_STATES.has(stateCode)}`,
                    });
                    hardFails.push(`missing_cert_${stateCode}`);
                }
            }
        } else {
            // License not verified — hard fail for US operations
            checks.push({
                check_id: "license_verified",
                label: "License not verified",
                type: "hard",
                passed: false,
                detail: "Operator license has not been verified",
            });
            hardFails.push("license_not_verified");
        }
    } else if (flags.license_verified) {
        checks.push({
            check_id: "license_verified",
            label: "License verified",
            type: "hard",
            passed: true,
        });
    }

    // --- HARD GATE: Insurance ---
    if (flags.insurance_verified) {
        checks.push({
            check_id: "insurance_verified",
            label: "Insurance verified",
            type: "hard",
            passed: true,
        });
    } else {
        checks.push({
            check_id: "insurance_verified",
            label: "Insurance not verified",
            type: "hard",
            passed: false,
            detail: "Operator insurance has not been verified",
        });
        hardFails.push("insurance_not_verified");
    }

    // --- SOFT SIGNAL: Trust score ---
    if (operator.trust_score >= 70) {
        softSignals.push("high_trust_score");
        checks.push({
            check_id: "trust_score",
            label: "Trust score ≥ 70",
            type: "soft",
            passed: true,
            detail: `Trust score: ${operator.trust_score}`,
        });
    } else if (operator.trust_score >= 40) {
        checks.push({
            check_id: "trust_score",
            label: "Trust score moderate",
            type: "soft",
            passed: true,
            detail: `Trust score: ${operator.trust_score}`,
        });
    } else {
        checks.push({
            check_id: "trust_score",
            label: "Trust score low",
            type: "soft",
            passed: false,
            detail: `Trust score: ${operator.trust_score}. Does not override hard gates.`,
        });
    }

    // --- SOFT SIGNAL: Background check ---
    if (flags.background_checked) {
        softSignals.push("background_checked");
        checks.push({
            check_id: "background_check",
            label: "Background check passed",
            type: "soft",
            passed: true,
        });
    }

    // --- SOFT SIGNAL: WITPAC certification (wind industry) ---
    if (flags.cert_witpac) {
        softSignals.push("witpac_certified");
        checks.push({
            check_id: "witpac_cert",
            label: "WITPAC certified (wind transport)",
            type: "soft",
            passed: true,
        });
    }

    // --- SPECIAL REQUIREMENTS checks ---
    for (const req of load.special_requirements) {
        if (req === "height_pole") {
            const hasEquip = operator.service_tags.includes("height_pole");
            checks.push({
                check_id: `req_${req}`,
                label: "Height pole equipment",
                type: "soft",
                passed: hasEquip,
                detail: hasEquip ? "Operator has height pole capability" : "Operator lacks height pole",
            });
        }
        if (req === "route_survey") {
            const hasSurvey = operator.service_tags.includes("route_survey");
            checks.push({
                check_id: `req_${req}`,
                label: "Route survey capability",
                type: "soft",
                passed: hasSurvey,
            });
        }
    }

    // --- COMPUTE OVERALL SCORE ---
    const hardChecks = checks.filter((c) => c.type === "hard");
    const softChecks = checks.filter((c) => c.type === "soft");

    const hardScore = hardChecks.length > 0
        ? hardChecks.filter((c) => c.passed).length / hardChecks.length
        : 1;
    const softScore = softChecks.length > 0
        ? softChecks.filter((c) => c.passed).length / softChecks.length
        : 0.5;

    // Overall: hard gates dominate (if any fail, score is 0)
    const overallScore = hardFails.length > 0 ? 0 : hardScore * 0.7 + softScore * 0.3;

    return {
        passed: hardFails.length === 0,
        checks,
        hard_fails: hardFails,
        soft_signals: softSignals,
        overall_score: Number(overallScore.toFixed(4)),
    };
}

// ============================================================
// CERTIFICATION RECIPROCITY LOOKUP
// ============================================================

export function getCertificationReciprocity(
    certType: string,
    issuingState: string,
    targetState: string
): { accepted: boolean; detail: string } {
    if (certType === "wa_pevo" || (certType === "pevo" && issuingState === "WA")) {
        const accepted = WA_PEVO_RECIPROCITY_STATES.has(targetState.toUpperCase());
        return {
            accepted,
            detail: accepted
                ? `WA State PEVO certification is accepted in ${targetState} via ESC reciprocity agreement`
                : `WA State PEVO certification is NOT accepted in ${targetState}`,
        };
    }

    // Default: no reciprocity data available
    return {
        accepted: false,
        detail: `No reciprocity data available for ${certType} from ${issuingState} to ${targetState}`,
    };
}
