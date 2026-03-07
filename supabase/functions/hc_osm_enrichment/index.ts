import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function env(name: string): string {
    const v = Deno.env.get(name);
    if (!v) throw new Error(`Missing env ${name}`);
    return v;
}
function json(status: number, body: unknown) {
    return new Response(JSON.stringify(body), {
        status, headers: { "content-type": "application/json; charset=utf-8" },
    });
}

const OSM_QUERIES: Record<string, string> = {
    truck_stop: '[out:json][timeout:30];area["ISO3166-1"="{CC}"]->.searchArea;(node["amenity"="fuel"]["hgv"="yes"](area.searchArea);node["amenity"="truck_stop"](area.searchArea););out body 500;',
    port_terminal: '[out:json][timeout:30];area["ISO3166-1"="{CC}"]->.searchArea;(node["landuse"="port"](area.searchArea);node["industrial"="port"](area.searchArea););out center 200;',
    rail_terminal: '[out:json][timeout:30];area["ISO3166-1"="{CC}"]->.searchArea;(node["railway"="station"]["usage"="freight"](area.searchArea););out body 200;',
    industrial_park: '[out:json][timeout:30];area["ISO3166-1"="{CC}"]->.searchArea;(way["landuse"="industrial"](area.searchArea););out center 300;',
    logistics_hotel: '[out:json][timeout:30];area["ISO3166-1"="{CC}"]->.searchArea;(node["tourism"="hotel"]["name"~"[Tt]ruck|[Dd]river|[Ll]ogistics|[Mm]otor"](area.searchArea););out body 200;',
};

interface OsmElement {
    type: string; id: number;
    lat?: number; lon?: number;
    center?: { lat: number; lon: number };
    tags?: Record<string, string>;
}

function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) ** 2 + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

Deno.serve(async (req) => {
    try {
        if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
        const url = env("SUPABASE_URL");
        const key = env("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        const body = await req.json().catch(() => ({}));
        const countryCode = (body.country_code || "US").toUpperCase();
        const category = body.category || "truck_stop";
        const batchSize = body.batch_size || 100;
        const dryRun = body.dry_run ?? false;

        // Get shell surfaces needing enrichment
        const { data: shells, error: sErr } = await supabase
            .from("surfaces").select("surface_id,name,slug,lat,lng,city_geo_key")
            .eq("country_code", countryCode).eq("category", category).eq("status", "shell")
            .not("lat", "is", null).limit(batchSize);
        if (sErr) return json(500, { ok: false, error: sErr.message });
        if (!shells || shells.length === 0) return json(200, { ok: true, enriched: 0, message: "No shells to enrich" });

        // Query OSM Overpass
        let osmElements: OsmElement[] = [];
        const queryTemplate = OSM_QUERIES[category];
        if (queryTemplate) {
            try {
                const osmResp = await fetch("https://overpass-api.de/api/interpreter", {
                    method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" },
                    body: `data=${encodeURIComponent(queryTemplate.replace("{CC}", countryCode))}`,
                });
                if (osmResp.ok) { const d = await osmResp.json(); osmElements = d.elements || []; }
            } catch (_) { /* OSM unavailable — skip enrichment */ }
        }

        // Match shells to nearest OSM element within 25km
        let enriched = 0;
        const matches: Record<string, unknown>[] = [];

        for (const shell of shells) {
            if (!shell.lat || !shell.lng) continue;
            let bestMatch: OsmElement | null = null;
            let bestDist = Infinity;
            for (const el of osmElements) {
                const elLat = el.lat ?? el.center?.lat;
                const elLon = el.lon ?? el.center?.lon;
                if (!elLat || !elLon) continue;
                const dist = haversine(shell.lat, shell.lng, elLat, elLon);
                if (dist < 25 && dist < bestDist) { bestDist = dist; bestMatch = el; }
            }
            if (bestMatch) {
                const eLat = bestMatch.lat ?? bestMatch.center?.lat;
                const eLon = bestMatch.lon ?? bestMatch.center?.lon;
                if (!dryRun) {
                    const ud: Record<string, unknown> = { status: "enriched", source: "osm_enriched", updated_at: new Date().toISOString() };
                    if (eLat && eLon) { ud.lat = eLat; ud.lng = eLon; }
                    if (bestMatch.tags?.name) ud.name = bestMatch.tags.name;
                    await supabase.from("surfaces").update(ud).eq("surface_id", shell.surface_id);
                }
                matches.push({ surface_id: shell.surface_id, osm_name: bestMatch.tags?.name || "unnamed", distance_km: bestDist.toFixed(2) });
                osmElements = osmElements.filter(e => e.id !== bestMatch!.id);
                enriched++;
            }
        }
        return json(200, { ok: true, country_code: countryCode, category, shells_checked: shells.length, osm_found: osmElements.length + enriched, enriched, dry_run: dryRun, sample_matches: matches.slice(0, 10) });
    } catch (e) { return json(500, { ok: false, error: (e as Error).message }); }
});
