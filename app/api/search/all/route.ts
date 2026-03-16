import { NextRequest, NextResponse } from "next/server";
import { createClient } from '@supabase/supabase-js';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

function parseArrayParam(v: string | null): string[] | null {
    if (!v) return null;
    const arr = v.split(",").map((s) => s.trim()).filter(Boolean);
    return arr.length ? arr : null;
}

function parseNum(v: string | null) {
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
}

export async function GET(req: NextRequest) {
    const sp = req.nextUrl.searchParams;

    const q = sp.get("q") ?? "";
    const country = sp.get("country");
    const region = sp.get("region");
    const city = sp.get("city");
    const tags = parseArrayParam(sp.get("tags"));
    const verifiedOnly =
        sp.get("verified") === "1" || sp.get("verified") === "true";
    const loadStatus = sp.get("load_status");

    const lat = parseNum(sp.get("lat"));
    const lng = parseNum(sp.get("lng"));
    const radiusKm = parseNum(sp.get("radius_km") ?? sp.get("radiusKm"));

    const limit = Math.min(parseInt(sp.get("limit") ?? "25", 10), 50);
    const offset = Math.max(parseInt(sp.get("offset") ?? "0", 10), 0);

    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY ??
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    const { data, error } = await supabase.rpc("hc_search_all", {
        p_q: q || null,
        p_country_code: country,
        p_region: region,
        p_city: city,
        p_tags: tags,
        p_verified_only: verifiedOnly,
        p_load_status: loadStatus,
        p_lat: lat,
        p_lng: lng,
        p_radius_km: radiusKm,
        p_h3_cells: null, // client can compute & pass via POST variant
        p_limit: limit,
        p_offset: offset,
    });

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Map r_-prefixed RPC columns to clean field names
    const mapped = (data ?? []).map((row: Record<string, unknown>) => ({
        entity_type: row.r_entity_type,
        entity_id: row.r_entity_id,
        title: row.r_title,
        subtitle: row.r_subtitle,
        country_code: row.r_country_code,
        region: row.r_region,
        city: row.r_city,
        tags: row.r_tags ?? [],
        is_verified: row.r_is_verified ?? false,
        trust_score: parseFloat(String(row.r_trust_score ?? 0)),
        last_active_at: row.r_last_active_at,
        load_status: row.r_load_status,
        score: parseFloat(String(row.r_score ?? 0)),
    }));

    return NextResponse.json({
        query: {
            q,
            country,
            region,
            city,
            tags,
            verifiedOnly,
            loadStatus,
            lat,
            lng,
            radiusKm,
            limit,
            offset,
        },
        results: mapped,
        total: mapped.length,
    });
}
