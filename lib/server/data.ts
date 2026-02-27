import "server-only";
import { createClient } from "@supabase/supabase-js";

// ── Server-only Supabase client ──
// This module CANNOT be imported from client components.
function getSupabase() {
    return createClient(
        process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { auth: { persistSession: false } }
    );
}

// ══════════════════════════════════════════
// MARKET PULSE — Homepage hero stats
// ══════════════════════════════════════════
export interface MarketPulseData {
    escorts_online_now: number;
    escorts_available_now: number;
    open_loads_now: number;
    median_fill_time_min_7d: number | null;
    fill_rate_7d: number | null;
}

export async function getMarketPulse(): Promise<MarketPulseData> {
    const sb = getSupabase();
    const { data, error } = await sb
        .from("v_market_pulse")
        .select("*")
        .single();

    if (error || !data) {
        console.error("getMarketPulse error:", error);
        return {
            escorts_online_now: 0,
            escorts_available_now: 0,
            open_loads_now: 0,
            median_fill_time_min_7d: null,
            fill_rate_7d: null,
        };
    }

    return {
        escorts_online_now: Number(data.escorts_online_now ?? 0),
        escorts_available_now: Number(data.escorts_available_now ?? 0),
        open_loads_now: Number(data.open_loads_now ?? 0),
        median_fill_time_min_7d: data.median_fill_time_min_7d ? Number(data.median_fill_time_min_7d) : null,
        fill_rate_7d: data.fill_rate_7d ? Number(data.fill_rate_7d) : null,
    };
}

// ══════════════════════════════════════════
// DIRECTORY LISTINGS — Public directory
// ══════════════════════════════════════════
export interface DirectoryListing {
    id: string;
    name: string;
    slug: string;
    entity_type: string;
    city: string | null;
    region_code: string | null;
    country_code: string;
    rank_score: number;
    claim_status: string;
    metadata: Record<string, unknown>;
}

export async function getDirectoryListings(params: {
    region?: string;
    limit?: number;
    offset?: number;
    entity_type?: string;
} = {}): Promise<{ listings: DirectoryListing[]; total: number }> {
    const sb = getSupabase();
    let query = sb
        .from("directory_listings")
        .select("id, name, slug, entity_type, city, region_code, country_code, rank_score, claim_status, metadata", { count: "exact" })
        .eq("is_visible", true)
        .order("rank_score", { ascending: false });

    if (params.region) query = query.eq("region_code", params.region);
    if (params.entity_type) query = query.eq("entity_type", params.entity_type);

    const limit = params.limit ?? 24;
    const offset = params.offset ?? 0;
    query = query.range(offset, offset + limit - 1);

    const { data, error, count } = await query;

    if (error) {
        console.error("getDirectoryListings error:", error);
        return { listings: [], total: 0 };
    }

    return {
        listings: (data ?? []) as DirectoryListing[],
        total: count ?? 0,
    };
}

// ══════════════════════════════════════════
// CORRIDORS — 20 major trucking corridors
// ══════════════════════════════════════════
export interface CorridorData {
    id: string;
    name: string;
    slug: string;
    origin_region: string;
    destination_region: string;
    country_code: string;
    heat_score: number;
    loads_7d: number;
    escorts_online: number;
}

export async function getCorridors(): Promise<CorridorData[]> {
    const sb = getSupabase();
    const { data, error } = await sb
        .from("corridors")
        .select("*")
        .order("confidence_score", { ascending: false })
        .limit(50);

    if (error) {
        console.error("getCorridors error:", error);
        return [];
    }

    return (data ?? []).map((c: any) => ({
        id: c.id,
        name: c.name || `Corridor ${c.slug}`,
        slug: c.slug || c.id,
        origin_region: c.states?.[0] || "",
        destination_region: c.states?.[c.states.length - 1] || "",
        country_code: c.country || "US",
        heat_score: Number(c.confidence_score ?? 0),
        loads_7d: Number(c.metrics?.avg_daily_loads ?? 0) * 7,
        escorts_online: 0,
    }));
}

// ══════════════════════════════════════════
// PORTS — 57 port infrastructure records
// ══════════════════════════════════════════
export interface PortData {
    id: string;
    name: string;
    slug: string;
    city: string;
    state: string;
    country_code: string;
    port_type: string;
}

export async function getPorts(): Promise<PortData[]> {
    const sb = getSupabase();
    const { data, error } = await sb
        .from("ports")
        .select("*")
        .order("name", { ascending: true })
        .limit(100);

    if (error) {
        console.error("getPorts error:", error);
        return [];
    }

    return (data ?? []).map((p: any) => ({
        id: p.id,
        name: p.name || p.port_name || "Unknown Port",
        slug: p.slug || p.port_slug || p.id,
        city: p.city || "",
        state: p.state || p.region_code || "",
        country_code: p.country_code || "US",
        port_type: p.port_type || p.type || "port",
    }));
}

// ══════════════════════════════════════════
// REGIONS — States/provinces for nav & SEO
// ══════════════════════════════════════════
export interface RegionData {
    id: string;
    name: string;
    slug: string;
    iso_code: string;
    country_id: string;
}

export async function getRegions(): Promise<RegionData[]> {
    const sb = getSupabase();
    const { data, error } = await sb
        .from("regions")
        .select("*")
        .order("name", { ascending: true });

    if (error) {
        console.error("getRegions error:", error);
        return [];
    }

    return (data ?? []).map((r: any) => ({
        id: r.id,
        name: r.name || r.region_name || "",
        slug: r.slug || r.region_slug || "",
        iso_code: r.iso_code || r.region_code || "",
        country_id: r.country_id || "",
    }));
}

// ══════════════════════════════════════════
// SPONSORS — active sponsors for placements
// ══════════════════════════════════════════
export async function getSponsors() {
    const sb = getSupabase();
    const { data, error } = await sb
        .from("sponsors")
        .select("*, sponsor_placements(*)")
        .eq("status", "active");

    if (error) {
        console.error("getSponsors error:", error);
        return [];
    }
    return data ?? [];
}
