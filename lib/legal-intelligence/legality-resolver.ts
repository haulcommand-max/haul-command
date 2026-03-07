// lib/legal-intelligence/legality-resolver.ts
//
// Operator Legal Intelligence Engine — Core Resolver
// Determines where an operator can legally work based on certifications,
// reciprocity rules, jurisdiction requirements, and route geometry.

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

// ============================================================
// TYPES
// ============================================================

export type LegalityStatus = "legal" | "conditional" | "illegal";

export interface LegalityDecision {
    operator_id: string;
    region_code: string;
    country_code: string;
    status: LegalityStatus;
    confidence: number;
    blockers: LegalityBlocker[];
    unlocks: EarningsUnlock[];
    expiration_risk: ExpirationRisk | null;
    matching_certs: MatchingCert[];
}

export interface LegalityBlocker {
    cert_type: string;
    reason: string;
    severity: "hard" | "soft";
}

export interface EarningsUnlock {
    cert_type: string;
    cert_label: string;
    estimated_annual_revenue: number;
    training_url?: string;
    training_cost?: number;
    issuing_authority?: string;
}

export interface ExpirationRisk {
    cert_type: string;
    expires_at: string;
    days_until_expiration: number;
    risk_level: "critical" | "warning" | "notice";
}

export interface MatchingCert {
    cert_type: string;
    issuing_region: string;
    validity_type: string;
    expires_at: string | null;
}

export interface RouteLegalityResult {
    route_status: LegalityStatus;
    regions_checked: number;
    blocking_regions: RouteLegalityRegion[];
    clear_regions: RouteLegalityRegion[];
    required_upgrades: EarningsUnlock[];
}

export interface RouteLegalityRegion {
    region_code: string;
    status: LegalityStatus;
    blockers: LegalityBlocker[];
}

// ============================================================
// CERT TYPE LABELS
// ============================================================

const CERT_LABELS: Record<string, string> = {
    pevo_wa: "WA State PEVO (Pilot/Escort Vehicle Operator)",
    pevo_fl: "Florida PEVO (UF T2 Center)",
    pevo_tx: "Texas TxDOT Pilot Car",
    pevo_ca: "California Caltrans Escort",
    witpac: "WITPAC (Wind Industry Transport)",
    flagger: "Traffic Control Flagger",
    pevo_generic: "General PEVO Certification",
};

const TRAINING_URLS: Record<string, string> = {
    pevo_wa: "https://www.esc.org/pilot-car",
    pevo_fl: "https://techtransfer.ce.ufl.edu/training/pilot-escort-flagging/",
    witpac: "https://www.esc.org/witpac",
};

const TRAINING_COSTS: Record<string, number> = {
    pevo_wa: 265,
    pevo_fl: 200,
    witpac: 325,
};

// ============================================================
// EXPIRATION RISK THRESHOLDS
// ============================================================

const EXPIRATION_THRESHOLDS = [
    { days: 14, level: "critical" as const },
    { days: 30, level: "warning" as const },
    { days: 90, level: "notice" as const },
];

// ============================================================
// RESOLVE LEGALITY FOR ONE OPERATOR IN ONE REGION
// ============================================================

export async function resolveLegality(
    operatorId: string,
    countryCode: string,
    regionCode: string
): Promise<LegalityDecision> {
    const supabase = getSupabaseAdmin();
    const now = new Date();

    // 1) Fetch operator's verified, non-expired certifications
    const { data: certs } = await supabase
        .from("operator_certifications")
        .select("*")
        .eq("operator_id", operatorId)
        .eq("verification_status", "verified")
        .gt("expires_at", now.toISOString());

    const validCerts = (certs ?? []) as any[];

    // 2) Fetch reciprocity rules for target region
    const { data: recipRules } = await supabase
        .from("cert_reciprocity_rules")
        .select("*")
        .eq("valid_region", regionCode.toUpperCase());

    const rules = (recipRules ?? []) as any[];

    // 3) Fetch jurisdiction requirements
    const { data: jurisRow } = await supabase
        .from("jurisdiction_escort_rules")
        .select("*")
        .eq("country_code", countryCode)
        .eq("region_code", regionCode.toUpperCase())
        .maybeSingle();

    const juris = jurisRow as any;

    // 4) Match certs against reciprocity
    const matchingCerts: MatchingCert[] = [];
    for (const cert of validCerts) {
        const rule = rules.find(
            (r: any) => r.cert_type === cert.cert_type && r.issuing_region === cert.issuing_region
        );
        if (rule) {
            matchingCerts.push({
                cert_type: cert.cert_type,
                issuing_region: cert.issuing_region,
                validity_type: rule.validity_type,
                expires_at: cert.expires_at,
            });
        }
    }

    // 5) Determine blockers
    const blockers: LegalityBlocker[] = [];

    if (juris) {
        if (juris.requires_pevo) {
            const hasPevo = matchingCerts.some(
                (c) => c.cert_type.startsWith("pevo") && (c.validity_type === "full" || c.validity_type === "conditional")
            );
            if (!hasPevo) {
                blockers.push({
                    cert_type: "pevo",
                    reason: `${regionCode} requires PEVO certification. No valid/reciprocal PEVO found.`,
                    severity: "hard",
                });
            }
        }

        if (juris.requires_witpac) {
            const hasWitpac = matchingCerts.some((c) => c.cert_type === "witpac");
            if (!hasWitpac) {
                blockers.push({
                    cert_type: "witpac",
                    reason: `${regionCode} requires WITPAC certification for wind transport.`,
                    severity: "hard",
                });
            }
        }

        if (juris.requires_flagger) {
            const hasFlagger = matchingCerts.some((c) => c.cert_type === "flagger");
            if (!hasFlagger) {
                blockers.push({
                    cert_type: "flagger",
                    reason: `${regionCode} requires flagger certification.`,
                    severity: "soft",
                });
            }
        }
    }

    // If no jurisdiction rules exist, check if ANY cert has reciprocity
    if (!juris && matchingCerts.length === 0 && validCerts.length > 0) {
        blockers.push({
            cert_type: "reciprocity",
            reason: `No reciprocity rules found for ${regionCode}. Operator certs may not be recognized.`,
            severity: "soft",
        });
    }

    // 6) Classification
    const hardFails = blockers.filter((b) => b.severity === "hard");
    let status: LegalityStatus;
    if (hardFails.length > 0) {
        status = "illegal";
    } else if (blockers.length > 0 || matchingCerts.some((c) => c.validity_type === "conditional")) {
        status = "conditional";
    } else if (matchingCerts.length > 0) {
        status = "legal";
    } else {
        // No rules, no certs matching — default to conditional
        status = juris ? "illegal" : "conditional";
    }

    // 7) Confidence score
    let confidence = 0.6; // base
    if (validCerts.length > 0) confidence += 0.2; // verified cert bonus
    if (juris?.last_updated_at) {
        const ruleAgeDays = (now.getTime() - new Date(juris.last_updated_at).getTime()) / (86400 * 1000);
        if (ruleAgeDays < 90) confidence += 0.1; // recent rule verification
    }
    if (juris && matchingCerts.length > 0) confidence += 0.1; // data completeness
    confidence = Math.min(1, confidence);

    // 8) Expiration risk (closest expiring cert)
    let expirationRisk: ExpirationRisk | null = null;
    for (const cert of validCerts) {
        if (!cert.expires_at) continue;
        const daysUntil = Math.floor((new Date(cert.expires_at).getTime() - now.getTime()) / (86400 * 1000));
        for (const threshold of EXPIRATION_THRESHOLDS) {
            if (daysUntil <= threshold.days) {
                if (!expirationRisk || daysUntil < expirationRisk.days_until_expiration) {
                    expirationRisk = {
                        cert_type: cert.cert_type,
                        expires_at: cert.expires_at,
                        days_until_expiration: daysUntil,
                        risk_level: threshold.level,
                    };
                }
                break;
            }
        }
    }

    // 9) Earnings unlock suggestions
    const unlocks: EarningsUnlock[] = [];
    if (status === "illegal" || status === "conditional") {
        for (const blocker of blockers) {
            const certType = blocker.cert_type.startsWith("pevo")
                ? `pevo_${regionCode.toLowerCase()}`
                : blocker.cert_type;

            unlocks.push({
                cert_type: certType,
                cert_label: CERT_LABELS[certType] ?? `${blocker.cert_type} certification`,
                estimated_annual_revenue: estimateRegionRevenue(regionCode),
                training_url: TRAINING_URLS[certType],
                training_cost: TRAINING_COSTS[certType],
                issuing_authority: getIssuingAuthority(certType),
            });
        }
    }

    return {
        operator_id: operatorId,
        region_code: regionCode,
        country_code: countryCode,
        status,
        confidence: Number(confidence.toFixed(4)),
        blockers,
        unlocks,
        expiration_risk: expirationRisk,
        matching_certs: matchingCerts,
    };
}

// ============================================================
// RESOLVE LEGALITY ACROSS ALL REGIONS (MAP VIEW)
// ============================================================

export async function resolveAllRegions(
    operatorId: string,
    countryCode: string = "US"
): Promise<LegalityDecision[]> {
    const supabase = getSupabaseAdmin();

    // Get all regions with escort rules
    const { data: regions } = await supabase
        .from("jurisdiction_escort_rules")
        .select("region_code")
        .eq("country_code", countryCode);

    const decisions: LegalityDecision[] = [];
    for (const r of (regions ?? []) as any[]) {
        const decision = await resolveLegality(operatorId, countryCode, r.region_code);
        decisions.push(decision);
    }

    return decisions;
}

// ============================================================
// ROUTE-AWARE LEGALITY
// ============================================================

export async function resolveRouteLegality(
    operatorId: string,
    countryCode: string,
    routeRegions: string[] // ordered list of state/province codes the route crosses
): Promise<RouteLegalityResult> {
    const blockingRegions: RouteLegalityRegion[] = [];
    const clearRegions: RouteLegalityRegion[] = [];
    const allUnlocks: EarningsUnlock[] = [];

    for (const region of routeRegions) {
        const decision = await resolveLegality(operatorId, countryCode, region);

        if (decision.status === "illegal") {
            blockingRegions.push({
                region_code: region,
                status: decision.status,
                blockers: decision.blockers,
            });
            allUnlocks.push(...decision.unlocks);
        } else if (decision.status === "conditional") {
            blockingRegions.push({
                region_code: region,
                status: decision.status,
                blockers: decision.blockers,
            });
        } else {
            clearRegions.push({
                region_code: region,
                status: decision.status,
                blockers: [],
            });
        }
    }

    // Weakest-link: route status = worst region status
    let routeStatus: LegalityStatus = "legal";
    if (blockingRegions.some((r) => r.status === "illegal")) routeStatus = "illegal";
    else if (blockingRegions.length > 0) routeStatus = "conditional";

    // Dedupe unlocks
    const uniqueUnlocks = dedupeUnlocks(allUnlocks);

    return {
        route_status: routeStatus,
        regions_checked: routeRegions.length,
        blocking_regions: blockingRegions,
        clear_regions: clearRegions,
        required_upgrades: uniqueUnlocks,
    };
}

// ============================================================
// CACHE WRITER (for cron job recompute)
// ============================================================

export async function cacheLegalityDecision(decision: LegalityDecision): Promise<void> {
    const supabase = getSupabaseAdmin();

    await supabase
        .from("operator_legality_cache")
        .upsert(
            {
                operator_id: decision.operator_id,
                country_code: decision.country_code,
                region_code: decision.region_code,
                legality_status: decision.status,
                confidence_score: decision.confidence,
                blockers_json: decision.blockers,
                unlock_suggestions: decision.unlocks,
                unlock_revenue_estimate: decision.unlocks.reduce(
                    (s, u) => s + (u.estimated_annual_revenue ?? 0),
                    0
                ),
                computed_at: new Date().toISOString(),
            },
            { onConflict: "operator_id,country_code,region_code" }
        );
}

// ============================================================
// HELPERS
// ============================================================

function estimateRegionRevenue(regionCode: string): number {
    // Rough estimates based on corridor demand data
    const highDemandStates = new Set(["TX", "CA", "FL", "GA", "OH", "PA", "IL", "NC"]);
    const medDemandStates = new Set(["WA", "OR", "CO", "AZ", "IN", "MO", "TN", "VA"]);

    if (highDemandStates.has(regionCode)) return 45000;
    if (medDemandStates.has(regionCode)) return 28000;
    return 15000;
}

function getIssuingAuthority(certType: string): string {
    const authorities: Record<string, string> = {
        pevo_wa: "Evergreen Safety Council (ESC)",
        pevo_fl: "UF Transportation Technology Transfer Center",
        pevo_tx: "Texas Department of Transportation",
        pevo_ca: "Caltrans",
        witpac: "Evergreen Safety Council (ESC)",
        flagger: "State DOT / ATSSA",
    };
    return authorities[certType] ?? "State Authority";
}

function dedupeUnlocks(unlocks: EarningsUnlock[]): EarningsUnlock[] {
    const seen = new Set<string>();
    return unlocks.filter((u) => {
        if (seen.has(u.cert_type)) return false;
        seen.add(u.cert_type);
        return true;
    });
}
