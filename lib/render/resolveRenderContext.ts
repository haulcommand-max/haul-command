import { supabaseAdmin } from "@/lib/supabase/admin";

export interface RenderContext {
    countryCode: string;
    regionCode?: string;
    languageCode: string;
    currencyCode: string;
    measurementSystem: string;
    dateFormat: string;
    timeFormat: string;
    roleAliases: Record<string, string>;
    serviceAliases: Record<string, string>;
    legalNotes: Record<string, string>;
    commercialNotes: Record<string, string>;
}

/**
 * Derives the canonical 120-country global translation layer.
 * Resolves the effective rendering rules based on the user's geo/language state.
 */
export async function resolveRenderContext(
    countryCode: string,
    regionCode?: string,
    languageCode?: string
): Promise<RenderContext> {
    
    // First, lookup exact region mapping
    let query = supabaseAdmin
        .from("hc_geo_overlays")
        .select("*")
        .eq("country_code", countryCode);

    if (regionCode) {
        query = query.eq("region_code", regionCode);
    } else {
        query = query.is("region_code", null);
    }

    const { data: overlay, error } = await query.single();

    // Fallback exactly to US defaults if no overlay exists yet (temporary fallback during rollout)
    if (error || !overlay) {
        console.warn(`No overlay found for ${countryCode}-${regionCode}. Using system generic fallback.`);
        return {
            countryCode: countryCode || "US",
            regionCode: regionCode,
            languageCode: languageCode || "en",
            currencyCode: "USD",
            measurementSystem: "imperial",
            dateFormat: "MM/DD/YYYY",
            timeFormat: "12h",
            roleAliases: {},
            serviceAliases: {},
            legalNotes: {},
            commercialNotes: {}
        };
    }

    return {
        countryCode: overlay.country_code,
        regionCode: overlay.region_code,
        languageCode: languageCode || overlay.default_language,
        currencyCode: overlay.currency_code,
        measurementSystem: overlay.measurement_system,
        dateFormat: overlay.date_format,
        timeFormat: overlay.time_format,
        roleAliases: overlay.role_aliases_json || {},
        serviceAliases: overlay.service_aliases_json || {},
        legalNotes: overlay.legal_notes_json || {},
        commercialNotes: overlay.commercial_notes_json || {}
    };
}
