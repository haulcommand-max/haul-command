/**
 * Unified Profile Resolver
 * 
 * Resolves an ID to a normalized profile by checking tables in priority order.
 * Every resolution path is inspectable — logs which table resolved and why.
 * 
 * Resolution order:
 *   1. driver_profiles (legacy, by id)
 *   2. hc_identities (unified identities, by id)
 *   3. directory_listings (combined directory, by id)
 *   4. hc_entity (universal graph, by entity_id)
 * 
 * Returns a typed NormalizedProfile or null with resolution metadata.
 */

import { SupabaseClient } from "@supabase/supabase-js";

/* ── Types ── */
export type EntitySource =
    | "driver_profiles"
    | "hc_identities"
    | "directory_listings"
    | "hc_entity"
    | "hc_load_alerts_shell"
    | "none";

export interface NormalizedProfile {
    id: string;
    display_name: string;
    company_name: string | null;
    home_base_city: string | null;
    home_base_state: string | null;
    country_code: string | null;
    vehicle_type: string | null;
    us_dot_number: string | null;
    trust_score: number;
    verification_status: string | null;
    is_claimed: boolean;
    is_seeded: boolean;
    claim_hash: string | null;
    certifications_json: Record<string, boolean>;
    insurance_status: string | null;
    compliance_status: string | null;
    latitude: number | null;
    longitude: number | null;
    coverage_radius_miles: number | null;
    reliability_score: number;
    responsiveness_score: number;
    integrity_score: number;
    customer_signal_score: number;
    compliance_score: number;
    market_fit_score: number;
    completed_escorts: number;
    rating_score: number;
    review_count: number;
    fill_probability: number | null;
    updated_at: string | null;
}

export interface ResolutionResult {
    resolved: boolean;
    resolved_table: EntitySource;
    entity_type: "operator" | "identity" | "listing" | "entity" | "unknown";
    resolution_path: EntitySource[];
    profile: NormalizedProfile | null;
    failure_reason: string | null;
    /** If set, the caller should 301 redirect to /place/{redirect_to} */
    redirect_to?: string;
}

/* ── Normalizer functions ── */

function normalizeDriverProfile(row: any): NormalizedProfile {
    return {
        id: row.id,
        display_name: row.display_name || row.company_name || "Unknown Operator",
        company_name: row.company_name ?? null,
        home_base_city: row.home_base_city ?? row.city_slug ?? null,
        home_base_state: row.home_base_state ?? row.region_code ?? null,
        country_code: row.country_code ?? null,
        vehicle_type: row.vehicle_type ?? null,
        us_dot_number: row.us_dot_number ?? null,
        trust_score: row.trust_score ?? 0,
        verification_status: row.verification_status ?? null,
        is_claimed: row.is_claimed ?? false,
        is_seeded: row.is_seeded ?? false,
        claim_hash: row.claim_hash ?? null,
        certifications_json: row.certifications_json ?? {},
        insurance_status: row.insurance_status ?? null,
        compliance_status: row.compliance_status ?? null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        coverage_radius_miles: row.coverage_radius_miles ?? null,
        reliability_score: row.reliability_score ?? 0,
        responsiveness_score: row.responsiveness_score ?? 0,
        integrity_score: row.integrity_score ?? 0,
        customer_signal_score: row.customer_signal_score ?? 0,
        compliance_score: row.compliance_score ?? 0,
        market_fit_score: row.market_fit_score ?? 0,
        completed_escorts: row.completed_escorts ?? 0,
        rating_score: row.rating_score ?? 0,
        review_count: row.review_count ?? 0,
        fill_probability: row.fill_probability ?? null,
        updated_at: row.updated_at ?? null,
    };
}

function normalizeIdentity(row: any): NormalizedProfile {
    return {
        id: row.id,
        display_name: row.display_name || row.company_name || "Unknown Operator",
        company_name: row.company_name ?? null,
        home_base_city: row.city ?? null,
        home_base_state: row.region_code ?? null,
        country_code: row.country_code ?? null,
        vehicle_type: null,
        us_dot_number: null,
        trust_score: row.trust_score ?? 0,
        verification_status: row.verification_status ?? null,
        is_claimed: row.is_claimed ?? false,
        is_seeded: row.is_seeded ?? false,
        claim_hash: null,
        certifications_json: {},
        insurance_status: null,
        compliance_status: null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        coverage_radius_miles: null,
        reliability_score: 0,
        responsiveness_score: 0,
        integrity_score: 0,
        customer_signal_score: 0,
        compliance_score: 0,
        market_fit_score: 0,
        completed_escorts: 0,
        rating_score: 0,
        review_count: 0,
        fill_probability: null,
        updated_at: row.updated_at ?? null,
    };
}

function normalizeDirectoryListing(row: any): NormalizedProfile {
    return {
        id: row.id,
        display_name: row.display_name || row.name || row.company_name || "Unknown Operator",
        company_name: row.company_name ?? null,
        home_base_city: row.city ?? row.home_base_city ?? null,
        home_base_state: row.region_code ?? row.home_base_state ?? null,
        country_code: row.country_code ?? null,
        vehicle_type: row.vehicle_type ?? null,
        us_dot_number: null,
        trust_score: row.trust_score ?? 0,
        verification_status: row.verification_status ?? null,
        is_claimed: row.is_claimed ?? false,
        is_seeded: row.is_seeded ?? false,
        claim_hash: null,
        certifications_json: {},
        insurance_status: null,
        compliance_status: null,
        latitude: row.latitude ?? null,
        longitude: row.longitude ?? null,
        coverage_radius_miles: null,
        reliability_score: 0,
        responsiveness_score: 0,
        integrity_score: 0,
        customer_signal_score: 0,
        compliance_score: 0,
        market_fit_score: 0,
        completed_escorts: 0,
        rating_score: 0,
        review_count: 0,
        fill_probability: null,
        updated_at: row.updated_at ?? null,
    };
}

function normalizeEntity(row: any): NormalizedProfile {
    const meta = row.metadata ?? {};
    return {
        id: row.entity_id ?? row.id,
        display_name: row.name || meta.display_name || "Unknown Entity",
        company_name: meta.company_name ?? null,
        home_base_city: meta.city ?? null,
        home_base_state: meta.region_code ?? null,
        country_code: row.country_code ?? meta.country_code ?? null,
        vehicle_type: null,
        us_dot_number: null,
        trust_score: 0,
        verification_status: null,
        is_claimed: false,
        is_seeded: false,
        claim_hash: null,
        certifications_json: {},
        insurance_status: null,
        compliance_status: null,
        latitude: meta.latitude ?? null,
        longitude: meta.longitude ?? null,
        coverage_radius_miles: null,
        reliability_score: 0,
        responsiveness_score: 0,
        integrity_score: 0,
        customer_signal_score: 0,
        compliance_score: 0,
        market_fit_score: 0,
        completed_escorts: 0,
        rating_score: 0,
        review_count: 0,
        fill_probability: null,
        updated_at: row.updated_at ?? null,
    };
}

/* ── Helpers ── */

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isUUID(value: string): boolean {
    return UUID_REGEX.test(value);
}

/* ── Main Resolver ── */

/**
 * Resolves a profile by ID (UUID) or slug (human-readable string).
 * 
 * UUID path (original chain):
 *   1. driver_profiles.id
 *   2. hc_identities.id
 *   3. directory_listings.id
 *   4. hc_entity.entity_id
 * 
 * Slug path (new — prevents 400 errors on UUID columns):
 *   1. directory_listings.slug
 *   2. hc_identities.slug  (if column exists)
 *   3. hc_entity by name   (fallback fuzzy match)
 * 
 * Mixed: if slug fails, and input *could* be a short UUID prefix,
 * we do NOT retry as UUID to avoid ambiguity.
 */
export async function resolveProfile(
    supabase: SupabaseClient,
    id: string
): Promise<ResolutionResult> {
    const path: EntitySource[] = [];

    if (isUUID(id)) {
        // ── UUID Resolution Chain ──

        // 1. driver_profiles
        path.push("driver_profiles");
        const { data: dp } = await supabase
            .from("driver_profiles")
            .select("*")
            .eq("id", id)
            .single();

        if (dp) {
            return {
                resolved: true,
                resolved_table: "driver_profiles",
                entity_type: "operator",
                resolution_path: path,
                profile: normalizeDriverProfile(dp),
                failure_reason: null,
            };
        }

        // 2. hc_identities
        path.push("hc_identities");
        const { data: ident } = await supabase
            .from("hc_identities")
            .select("*")
            .eq("id", id)
            .single();

        if (ident) {
            return {
                resolved: true,
                resolved_table: "hc_identities",
                entity_type: "identity",
                resolution_path: path,
                profile: normalizeIdentity(ident),
                failure_reason: null,
            };
        }

        // 3. directory_listings (by UUID id)
        path.push("directory_listings");
        const { data: dl } = await supabase
            .from("directory_listings")
            .select("*")
            .eq("id", id)
            .single();

        if (dl) {
            return {
                resolved: true,
                resolved_table: "directory_listings",
                entity_type: "listing",
                resolution_path: path,
                profile: normalizeDirectoryListing(dl),
                failure_reason: null,
            };
        }

        // 4. hc_entity
        path.push("hc_entity");
        const { data: ent } = await supabase
            .from("hc_entity")
            .select("*")
            .eq("entity_id", id)
            .single();

        if (ent) {
            return {
                resolved: true,
                resolved_table: "hc_entity",
                entity_type: "entity",
                resolution_path: path,
                profile: normalizeEntity(ent),
                failure_reason: null,
            };
        }
    } else {
        // ── Slug Resolution Chain ──
        // Input is not a UUID — query by slug columns to avoid 400 errors.

        // 1. slug_redirects — FIRST: check if this slug has been renamed/redirected.
        //    This runs BEFORE directory_listings so redirects fire even if the
        //    old slug still exists as a live listing (e.g. semantic renames).
        const { data: redirectRows } = await supabase
            .from("slug_redirects")
            .select("new_slug")
            .eq("old_slug", id)
            .eq("is_active", true)
            .limit(1);

        const redirect = redirectRows?.[0];
        if (redirect) {
            return {
                resolved: true,
                resolved_table: "directory_listings",
                entity_type: "listing",
                resolution_path: [...path, "directory_listings" as EntitySource],
                profile: null,
                failure_reason: null,
                redirect_to: redirect.new_slug,
            };
        }

        // 2. directory_listings by slug (primary slug source)
        //    Use .limit(1) instead of .single() because duplicate slugs exist
        //    (e.g. port-of-los-angeles appears twice). .single() errors on >1 row.
        path.push("directory_listings");
        const { data: dlSlugRows } = await supabase
            .from("directory_listings")
            .select("*")
            .eq("slug", id)
            .limit(1);

        const dlSlug = dlSlugRows?.[0];
        if (dlSlug) {
            return {
                resolved: true,
                resolved_table: "directory_listings",
                entity_type: "listing",
                resolution_path: path,
                profile: normalizeDirectoryListing(dlSlug),
                failure_reason: null,
            };
        }

        // 3. hc_identities by slug (if the table has a slug column)
        path.push("hc_identities");
        const { data: identSlugRows } = await supabase
            .from("hc_identities")
            .select("*")
            .eq("slug", id)
            .limit(1);

        const identSlug = identSlugRows?.[0];
        if (identSlug) {
            return {
                resolved: true,
                resolved_table: "hc_identities",
                entity_type: "identity",
                resolution_path: path,
                profile: normalizeIdentity(identSlug),
                failure_reason: null,
            };
        }

        // 4. driver_profiles by slug (if the table has a slug column)
        path.push("driver_profiles");
        const { data: dpSlugRows } = await supabase
            .from("driver_profiles")
            .select("*")
            .eq("slug", id)
            .limit(1);

        const dpSlug = dpSlugRows?.[0];
        if (dpSlug) {
            return {
                resolved: true,
                resolved_table: "driver_profiles",
                entity_type: "operator",
                resolution_path: path,
                profile: normalizeDriverProfile(dpSlug),
                failure_reason: null,
            };
        }
    }

    // ── Shell Generation: Last resort before "not found" ──
    // If the ID looks like a slug (not UUID), try to match against
    // hc_load_alerts by company_name to generate a minimal shell profile.
    // This guarantees zero dead-end profiles for any entity visible in load data.
    if (!isUUID(id)) {
        const searchName = id
            .replace(/-/g, ' ')
            .replace(/\b\w/g, c => c.toUpperCase()); // slug → Title Case

        const { data: loadHits } = await supabase
            .from("hc_load_alerts")
            .select("company_name, phone, origin_city, origin_state, destination_city, destination_state, position_type, rate_amount, ingested_at")
            .ilike("company_name", `%${searchName.split(' ')[0]}%`)
            .order("ingested_at", { ascending: false })
            .limit(5);

        if (loadHits && loadHits.length > 0) {
            const bestHit = loadHits[0];
            const shellProfile: NormalizedProfile = {
                id: id, // slug as ID — not a real UUID
                display_name: bestHit.company_name || searchName,
                company_name: bestHit.company_name || searchName,
                home_base_city: bestHit.origin_city || null,
                home_base_state: bestHit.origin_state || null,
                country_code: "US",
                vehicle_type: null,
                us_dot_number: null,
                trust_score: 0,
                verification_status: null,
                is_claimed: false,
                is_seeded: true,
                claim_hash: null,
                certifications_json: {},
                insurance_status: null,
                compliance_status: null,
                latitude: null,
                longitude: null,
                coverage_radius_miles: null,
                reliability_score: 0,
                responsiveness_score: 0,
                integrity_score: 0,
                customer_signal_score: 0,
                compliance_score: 0,
                market_fit_score: 0,
                completed_escorts: 0,
                rating_score: 0,
                review_count: 0,
                fill_probability: null,
                updated_at: bestHit.ingested_at || null,
            };

            return {
                resolved: true,
                resolved_table: "hc_load_alerts_shell" as EntitySource,
                entity_type: "listing" as const,
                resolution_path: [...path, "hc_load_alerts_shell" as EntitySource],
                profile: shellProfile,
                failure_reason: null,
            };
        }
    }

    // Not found in any table (including shell generation)
    return {
        resolved: false,
        resolved_table: "none",
        entity_type: "unknown",
        resolution_path: path,
        profile: null,
        failure_reason: `ID "${id}" not found in: ${path.join(" → ")}`,
    };
}

/**
 * Server-side resolver for layout metadata.
 * Returns minimal data needed for SEO metadata + JSON-LD.
 * Supports both UUID and slug-based lookups.
 */
export async function resolveProfileMetadata(
    supabase: SupabaseClient,
    id: string
): Promise<{
    name: string;
    location: string;
    country_code: string | null;
    rating_score: number | null;
    review_count: number | null;
    resolved: boolean;
    redirect_to?: string;
}> {
    const notFound = { name: "Unknown", location: "", country_code: null, rating_score: null, review_count: null, resolved: false };

    if (isUUID(id)) {
        // UUID path
        const { data: dp } = await supabase
            .from("driver_profiles")
            .select("id, display_name, company_name, home_base_city, home_base_state")
            .eq("id", id)
            .single();

        if (dp) {
            const name = dp.display_name || dp.company_name || "Escort Operator";
            const location = [dp.home_base_city, dp.home_base_state].filter(Boolean).join(", ");
            return { name, location, country_code: null, rating_score: null, review_count: null, resolved: true };
        }

        const { data: ident } = await supabase
            .from("hc_identities")
            .select("id, display_name, company_name, city, region_code, country_code")
            .eq("id", id)
            .single();

        if (ident) {
            const name = ident.display_name || ident.company_name || "Escort Operator";
            const location = [ident.city, ident.region_code].filter(Boolean).join(", ");
            return { name, location, country_code: ident.country_code, rating_score: null, review_count: null, resolved: true };
        }

        const { data: dl } = await supabase
            .from("directory_listings")
            .select("id, name, city, region_code, country_code")
            .eq("id", id)
            .single();

        if (dl) {
            const name = dl.name || "Escort Operator";
            const location = [dl.city, dl.region_code].filter(Boolean).join(", ");
            return { name, location, country_code: dl.country_code, rating_score: null, review_count: null, resolved: true };
        }
    } else {
        // Slug path — check redirects FIRST, then directory_listings

        // 1. slug_redirects — fire redirect even if old slug still exists
        const { data: redirectRows } = await supabase
            .from("slug_redirects")
            .select("new_slug")
            .eq("old_slug", id)
            .eq("is_active", true)
            .limit(1);

        const redirect = redirectRows?.[0];
        if (redirect) {
            return { name: "Redirect", location: "", country_code: null, rating_score: null, review_count: null, resolved: true, redirect_to: redirect.new_slug };
        }

        // 2. directory_listings by slug — use .limit(1) to handle duplicate slugs gracefully
        // NOTE: directory_listings has NO display_name or company_name columns.
        //       The listing name is in the `name` column.
        const { data: dlSlugRows } = await supabase
            .from("directory_listings")
            .select("id, name, slug, city, region_code, country_code")
            .eq("slug", id)
            .limit(1);

        const dlSlug = dlSlugRows?.[0];
        if (dlSlug) {
            const name = dlSlug.name || "Escort Operator";
            const location = [dlSlug.city, dlSlug.region_code].filter(Boolean).join(", ");
            return { name, location, country_code: dlSlug.country_code, rating_score: null, review_count: null, resolved: true };
        }

        const { data: identSlugRows } = await supabase
            .from("hc_identities")
            .select("id, display_name, company_name, city, region_code, country_code")
            .eq("slug", id)
            .limit(1);

        const identSlug = identSlugRows?.[0];
        if (identSlug) {
            const name = identSlug.display_name || identSlug.company_name || "Escort Operator";
            const location = [identSlug.city, identSlug.region_code].filter(Boolean).join(", ");
            return { name, location, country_code: identSlug.country_code, rating_score: null, review_count: null, resolved: true };
        }
    }

    return notFound;
}
