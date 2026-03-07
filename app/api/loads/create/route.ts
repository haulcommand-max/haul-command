import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/loads/create
 * Inserts a load into hc_loads. The DB trigger (trg_load_created)
 * automatically queues a match event into hc_event_outbox.
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const {
            broker_id,
            origin_address,
            dest_address,
            pickup_at,
            length_ft,
            width_ft,
            height_ft,
            weight_lbs,
            description,
            route_notes,
            permit_notes,
            escort_needs,
            time_flex_hours,
            rate_per_mile,
            quick_pay,
        } = body;

        // Parse origin / destination
        const [originCity, originState] = (origin_address || "").split(",").map((s: string) => s.trim());
        const [destCity, destState] = (dest_address || "").split(",").map((s: string) => s.trim());

        // Estimate miles (simple placeholder — in prod use routing API)
        const estMiles = Math.round(Math.random() * 400 + 100);
        const rateCents = rate_per_mile ? Math.round(rate_per_mile * estMiles * 100) : null;

        const { data, error } = await sb
            .from("hc_loads")
            .insert({
                broker_id: broker_id || null,
                origin_city: originCity || origin_address,
                origin_state: originState || null,
                origin_country: "US",
                destination_city: destCity || dest_address,
                destination_state: destState || null,
                destination_country: "US",
                equipment_type: "flatbed",
                length_ft: length_ft || null,
                width_ft: width_ft || null,
                height_ft: height_ft || null,
                weight_lbs: weight_lbs || null,
                commodity: description,
                notes: [route_notes, permit_notes].filter(Boolean).join(" | ") || null,
                escorts_needed: escort_needs?.length || 1,
                rate_total_cents: rateCents,
                rate_per_mile_cents: rate_per_mile ? Math.round(rate_per_mile * 100) : null,
                miles: estMiles,
                currency: "USD",
                load_status: "open",
                urgency: "standard",
                source_type: "manual",
                pickup_date: pickup_at ? new Date(pickup_at).toISOString().split("T")[0] : null,
                pickup_window_start: pickup_at || null,
                quick_pay_available: quick_pay || false,
                country_code: "US",
                posted_at: new Date().toISOString(),
            })
            .select("id")
            .single();

        if (error) {
            console.error("[loads/create] Supabase error:", error);
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true, load_id: data.id });
    } catch (err) {
        console.error("[loads/create] Error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
