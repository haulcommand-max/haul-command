import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

function env(name: string): string { const v = Deno.env.get(name); if (!v) throw new Error(`Missing env ${name}`); return v; }
function json(status: number, body: unknown) { return new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json; charset=utf-8" } }); }

// Ad placement templates per surface category
const PLACEMENT_TEMPLATES: Record<string, { product: string; placement: string; floor_cents: number }[]> = {
    truck_stop: [
        { product: "sponsored_listing", placement: "truck_stop_featured", floor_cents: 500 },
        { product: "brand_defense", placement: "truck_stop_brand_defense", floor_cents: 2000 },
        { product: "featured_slot", placement: "truck_stop_sidebar", floor_cents: 300 },
    ],
    port_terminal: [
        { product: "corridor_sponsorship", placement: "port_corridor_sponsor", floor_cents: 5000 },
        { product: "sponsored_listing", placement: "port_featured", floor_cents: 800 },
    ],
    rail_terminal: [
        { product: "sponsored_listing", placement: "rail_featured", floor_cents: 600 },
        { product: "corridor_sponsorship", placement: "rail_corridor_sponsor", floor_cents: 4000 },
    ],
    industrial_park: [
        { product: "sponsored_listing", placement: "industrial_featured", floor_cents: 400 },
        { product: "boosted_profile", placement: "industrial_boost", floor_cents: 200 },
    ],
    equipment_dealer_yard: [
        { product: "sponsored_listing", placement: "equipment_featured", floor_cents: 600 },
        { product: "brand_defense", placement: "equipment_brand_defense", floor_cents: 3000 },
    ],
    logistics_hotel: [
        { product: "sponsored_listing", placement: "hotel_featured", floor_cents: 350 },
        { product: "featured_slot", placement: "hotel_sidebar", floor_cents: 200 },
    ],
    oversize_staging_yard: [
        { product: "sponsored_listing", placement: "staging_featured", floor_cents: 500 },
        { product: "corridor_sponsorship", placement: "staging_corridor", floor_cents: 3500 },
    ],
};

Deno.serve(async (req) => {
    try {
        if (req.method !== "POST") return json(405, { ok: false, error: "POST only" });
        const url = env("SUPABASE_URL");
        const key = env("SUPABASE_SERVICE_ROLE_KEY");
        const supabase = createClient(url, key, { auth: { persistSession: false } });
        const body = await req.json().catch(() => ({}));
        const countryCode = (body.country_code || "US").toUpperCase();

        // Get all categories with surfaces
        const { data: categories } = await supabase.from("surfaces")
            .select("category").eq("country_code", countryCode).limit(1000);
        const catSet = new Set((categories || []).map((c: { category: string }) => c.category));
        let created = 0, skipped = 0;

        for (const category of catSet) {
            const templates = PLACEMENT_TEMPLATES[category] || [
                { product: "sponsored_listing", placement: `${category}_featured`, floor_cents: 400 },
            ];
            for (const tpl of templates) {
                const inventoryKey = `${countryCode}_${tpl.placement}`;
                const { data: existing } = await supabase.from("ad_inventory")
                    .select("id").eq("inventory_key", inventoryKey).eq("country_code", countryCode).single();
                if (existing) { skipped++; continue; }

                const { error: insErr } = await supabase.from("ad_inventory").insert({
                    country_code: countryCode, inventory_key: inventoryKey,
                    product: tpl.product, placement: tpl.placement, floor_cents: tpl.floor_cents,
                    rules: { max_per_page: 3, category, geo_targeted: true }, is_active: true,
                });
                if (!insErr) created++;
            }
        }

        // Corridor takeover slots
        const { data: corridors } = await supabase.from("surfaces")
            .select("corridor_geo_key").eq("country_code", countryCode).eq("anchor_type", "corridor")
            .not("corridor_geo_key", "is", null).limit(500);
        const corridorKeys = new Set((corridors || []).map((c: { corridor_geo_key: string }) => c.corridor_geo_key));

        for (const corrKey of corridorKeys) {
            const inventoryKey = `${countryCode}_corridor_${corrKey.slice(0, 20)}_takeover`;
            const { data: existing } = await supabase.from("ad_inventory")
                .select("id").eq("inventory_key", inventoryKey).single();
            if (!existing) {
                await supabase.from("ad_inventory").insert({
                    country_code: countryCode, inventory_key: inventoryKey,
                    product: "takeover", placement: `corridor_takeover`, floor_cents: 10000,
                    rules: { corridor_key: corrKey, exclusive: true }, is_active: true,
                });
                created++;
            }
        }

        return json(200, { ok: true, country_code: countryCode, categories_processed: catSet.size, corridors_processed: corridorKeys.size, ad_slots_created: created, ad_slots_skipped: skipped });
    } catch (e) { return json(500, { ok: false, error: (e as Error).message }); }
});
