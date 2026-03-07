/**
 * Escort License Cross-Match Engine
 * 
 * Cross-checks operators against official escort licensing registries
 * (per jurisdiction) to boost trust scores and reduce fraud.
 * 
 * Architecture: one adapter per jurisdiction, pluggable via adapter registry.
 * 
 * Data sources policy:
 *   PREFERRED:  official government APIs, downloadable registries (CSV/PDF)
 *   FALLBACK:   official web pages (respecting robots.txt, throttled)
 *   FORBIDDEN:  credential stuffing, paywall bypass, unauthorized scraping
 */

import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { nameSimilarity } from "../enrichment/oers";

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

export interface LicenseRecord {
    licenseId: string;
    holderName: string;
    businessName?: string;
    jurisdiction: string;        // e.g. 'US:TX', 'AU:NSW', 'CA:AB'
    status: 'active' | 'expired' | 'suspended' | 'revoked';
    issueDate?: string;
    expiryDate?: string;
    contact?: string;
    sourceUrl: string;
    fetchedAt: Date;
}

export interface OperatorRecord {
    id: string;                  // operator UUID
    fullName: string;
    businessName?: string;
    phone?: string;
    website?: string;
    city?: string;
    region?: string;
    countryCode: string;
}

export interface LicenseMatch {
    operatorId: string;
    jurisdiction: string;
    licenseId: string;
    matchScore: number;
    matchedOn: string;           // license_id_exact | business_fuzzy | holder_fuzzy | phone | domain
    status: 'matched' | 'verified';
    evidenceJson: Record<string, unknown>;
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER CONTRACT
// ═══════════════════════════════════════════════════════════════

export interface LicenseRegistryAdapter {
    jurisdiction: string;        // e.g. 'US:TX'
    countryCode: string;
    adminCode?: string;
    fetch(): Promise<LicenseRecord[]>;
}

// ═══════════════════════════════════════════════════════════════
// ADAPTER REGISTRY (plug new jurisdictions here)
// ═══════════════════════════════════════════════════════════════

const ADAPTER_REGISTRY: Map<string, () => LicenseRegistryAdapter> = new Map();

export function registerAdapter(jurisdiction: string, factory: () => LicenseRegistryAdapter): void {
    ADAPTER_REGISTRY.set(jurisdiction, factory);
}

export function getRegisteredJurisdictions(): string[] {
    return Array.from(ADAPTER_REGISTRY.keys());
}

// ═══════════════════════════════════════════════════════════════
// EXAMPLE ADAPTER: Texas TDLR (template — real API TBD)
// ═══════════════════════════════════════════════════════════════

class TexasTDLRAdapter implements LicenseRegistryAdapter {
    jurisdiction = 'US:TX';
    countryCode = 'US';
    adminCode = 'TX';

    async fetch(): Promise<LicenseRecord[]> {
        // In production: call the Texas TDLR license lookup API
        // For now: return empty set — the adapter contract is ready
        console.log('[LicenseCrossmatch] Texas TDLR adapter — awaiting API integration');
        return [];
    }
}

// Register known adapters
registerAdapter('US:TX', () => new TexasTDLRAdapter());

// ═══════════════════════════════════════════════════════════════
// MATCHING ENGINE
// ═══════════════════════════════════════════════════════════════

const FUZZY_THRESHOLDS = {
    nameSimilarity: 0.90,
    businessSimilarity: 0.88,
};

export function matchOperatorToLicenses(
    operator: OperatorRecord,
    licenses: LicenseRecord[],
): LicenseMatch | null {
    let bestMatch: LicenseMatch | null = null;
    let bestScore = 0;

    for (const lic of licenses) {
        let matchScore = 0;
        let matchedOn = '';
        const evidence: Record<string, unknown> = {};

        // Priority 1: License ID exact (operator may have self-declared)
        // Skip — requires operator to provide their license ID

        // Priority 2: Business name fuzzy + jurisdiction
        if (operator.businessName && lic.businessName) {
            const sim = nameSimilarity(operator.businessName, lic.businessName);
            if (sim >= FUZZY_THRESHOLDS.businessSimilarity) {
                const score = sim * 0.95;
                if (score > matchScore) {
                    matchScore = score;
                    matchedOn = 'business_fuzzy';
                    evidence.businessSimilarity = sim;
                    evidence.operatorBusiness = operator.businessName;
                    evidence.licenseBusiness = lic.businessName;
                }
            }
        }

        // Priority 3: Holder name fuzzy + city/region
        if (operator.fullName && lic.holderName) {
            const sim = nameSimilarity(operator.fullName, lic.holderName);
            if (sim >= FUZZY_THRESHOLDS.nameSimilarity) {
                // Boost if region matches
                const regionBoost = (operator.region && lic.jurisdiction.includes(operator.region)) ? 0.05 : 0;
                const score = (sim * 0.90) + regionBoost;
                if (score > matchScore) {
                    matchScore = score;
                    matchedOn = 'holder_fuzzy';
                    evidence.nameSimilarity = sim;
                    evidence.operatorName = operator.fullName;
                    evidence.licenseHolder = lic.holderName;
                }
            }
        }

        // Priority 4: Phone exact (normalized)
        if (operator.phone && lic.contact) {
            const normOp = normalizePhone(operator.phone);
            const normLic = normalizePhone(lic.contact);
            if (normOp && normLic && normOp === normLic) {
                const score = 0.85;
                if (score > matchScore) {
                    matchScore = score;
                    matchedOn = 'phone';
                    evidence.phoneMatch = true;
                }
            }
        }

        // Priority 5: Website domain match
        if (operator.website && lic.contact) {
            const opDomain = extractDomain(operator.website);
            const licDomain = extractDomain(lic.contact);
            if (opDomain && licDomain && opDomain === licDomain) {
                const score = 0.75;
                if (score > matchScore) {
                    matchScore = score;
                    matchedOn = 'domain';
                    evidence.domainMatch = opDomain;
                }
            }
        }

        if (matchScore > bestScore) {
            bestScore = matchScore;
            bestMatch = {
                operatorId: operator.id,
                jurisdiction: lic.jurisdiction,
                licenseId: lic.licenseId,
                matchScore,
                matchedOn,
                status: matchScore >= 0.92 ? 'verified' : 'matched',
                evidenceJson: evidence,
            };
        }
    }

    return bestMatch;
}

// ═══════════════════════════════════════════════════════════════
// PIPELINE JOBS
// ═══════════════════════════════════════════════════════════════

/** Weekly: Refresh license registries for all enabled jurisdictions */
export async function runLicenseRegistryRefresh(): Promise<{
    jurisdictions: number;
    totalRecords: number;
    errors: string[];
}> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const errors: string[] = [];
    let totalRecords = 0;

    for (const [jurisdiction, factory] of ADAPTER_REGISTRY) {
        try {
            const adapter = factory();
            const records = await adapter.fetch();

            if (records.length > 0) {
                const rows = records.map(r => ({
                    jurisdiction: r.jurisdiction,
                    license_id: r.licenseId,
                    holder_name: r.holderName,
                    business_name: r.businessName,
                    status: r.status,
                    issue_date: r.issueDate,
                    expiry_date: r.expiryDate,
                    contact: r.contact,
                    source_url: r.sourceUrl,
                    fetched_at: r.fetchedAt.toISOString(),
                }));

                const { error } = await supabase
                    .from('escort_licenses_raw')
                    .upsert(rows, { onConflict: 'jurisdiction,license_id' });

                if (error) {
                    errors.push(`${jurisdiction}: ${error.message}`);
                } else {
                    totalRecords += rows.length;
                }
            }
        } catch (err: any) {
            errors.push(`${jurisdiction}: ${err.message}`);
        }
    }

    return {
        jurisdictions: ADAPTER_REGISTRY.size,
        totalRecords,
        errors,
    };
}

/** Daily: Match operators against license registry */
export async function runLicenseMatchRun(): Promise<{
    operatorsChecked: number;
    matchesFound: number;
    errors: string[];
}> {
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const errors: string[] = [];
    let matchesFound = 0;

    // Get all operators grouped by country
    const { data: operators } = await supabase
        .from('profiles')
        .select('id, full_name, business_name, phone, website, city, region, country_code')
        .not('country_code', 'is', null)
        .limit(1000);

    if (!operators) return { operatorsChecked: 0, matchesFound: 0, errors: ['No operators found'] };

    // For each jurisdiction with licenses
    const jurisdictions = getRegisteredJurisdictions();

    for (const jurisdiction of jurisdictions) {
        const countryCode = jurisdiction.split(':')[0];
        const adminCode = jurisdiction.split(':')[1];

        // Get licenses for this jurisdiction
        const { data: licenses } = await supabase
            .from('escort_licenses_raw')
            .select('*')
            .eq('jurisdiction', jurisdiction)
            .eq('status', 'active');

        if (!licenses || licenses.length === 0) continue;

        const licenseRecords: LicenseRecord[] = licenses.map((l: any) => ({
            licenseId: l.license_id,
            holderName: l.holder_name,
            businessName: l.business_name,
            jurisdiction: l.jurisdiction,
            status: l.status,
            issueDate: l.issue_date,
            expiryDate: l.expiry_date,
            contact: l.contact,
            sourceUrl: l.source_url,
            fetchedAt: new Date(l.fetched_at),
        }));

        // Filter operators to matching jurisdiction
        const jurisdictionOps = operators.filter((o: any) => {
            if (o.country_code !== countryCode) return false;
            if (adminCode && o.region !== adminCode) return false;
            return true;
        });

        for (const op of jurisdictionOps) {
            const opRecord: OperatorRecord = {
                id: op.id,
                fullName: op.full_name,
                businessName: op.business_name,
                phone: op.phone,
                website: op.website,
                city: op.city,
                region: op.region,
                countryCode: op.country_code,
            };

            const match = matchOperatorToLicenses(opRecord, licenseRecords);
            if (match) {
                const { error } = await supabase
                    .from('escort_license_matches')
                    .upsert({
                        operator_id: match.operatorId,
                        jurisdiction: match.jurisdiction,
                        license_id: match.licenseId,
                        match_score: match.matchScore,
                        matched_on: match.matchedOn,
                        status: match.status,
                        verified_at: match.status === 'verified' ? new Date().toISOString() : null,
                        evidence_json: match.evidenceJson,
                    }, { onConflict: 'operator_id,jurisdiction' });

                if (error) {
                    errors.push(`Match persist error for ${op.id}: ${error.message}`);
                } else {
                    matchesFound++;

                    // Update trust signal
                    await supabase.from('operator_trust_signals').upsert({
                        operator_id: op.id,
                        license_verified_flag: match.status === 'verified',
                        license_match_score: match.matchScore,
                        license_last_checked_at: new Date().toISOString(),
                    }, { onConflict: 'operator_id' });
                }
            }
        }
    }

    return {
        operatorsChecked: operators.length,
        matchesFound,
        errors,
    };
}

// ═══════════════════════════════════════════════════════════════
// UTILITIES
// ═══════════════════════════════════════════════════════════════

function normalizePhone(phone: string): string | null {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7) return null;
    // Return last 10 digits (strip country code)
    return digits.slice(-10);
}

function extractDomain(url: string): string | null {
    try {
        // Handle both URLs and email-like strings
        if (url.includes('@')) {
            return url.split('@')[1]?.toLowerCase() || null;
        }
        const parsed = new URL(url.startsWith('http') ? url : `https://${url}`);
        return parsed.hostname.replace(/^www\./, '').toLowerCase();
    } catch {
        return null;
    }
}
