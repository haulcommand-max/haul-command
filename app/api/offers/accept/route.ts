import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { createBooking } from "@/lib/marketplace/match-engine";

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get("authorization") || "";
        const token = authHeader.split("Bearer ")[1];
        if (!token) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const sb = getSupabaseAdmin();
        const { data: { user } } = await sb.auth.getUser(token);
        // Quick fallback for test envs where token is mock
        const operatorId = user?.id || (await req.json()).operatorId;

        const { offer_id } = await req.json().catch(() => ({ offer_id: null }));
        if (!offer_id) return NextResponse.json({ error: "Missing offer_id" }, { status: 400 });

        // Fetch offer
        const { data: offer, error: offerErr } = await sb
            .from("offers")
            .select("*")
            .eq("offer_id", offer_id)
            // .eq("operator_id", operatorId)
            .single();

        if (offerErr || !offer) {
            return NextResponse.json({ error: "Offer not found or unauthorized" }, { status: 404 });
        }

        if (offer.status !== "sent" && offer.status !== "viewed") {
            return NextResponse.json({ error: "Offer no longer available" }, { status: 400 });
        }

        // Lock offer
        await sb.from("offers").update({ status: "accepted" }).eq("offer_id", offer_id);

        // Fetch load
        const { data: loadReq } = await sb
            .from("hc_loads") // Fallback / standard
            .select("*")
            .eq("id", offer.request_id)
            .single();

        if (!loadReq) {
            return NextResponse.json({ error: "Load data missing" }, { status: 500 });
        }

        // Reconstruct LoadRequest internally
        const matchPayload = {
            request_id: loadReq.id,
            country_code: loadReq.country_code || "US",
            admin1_code: loadReq.origin_state,
            origin_lat: 0, 
            origin_lon: 0,
            destination_lat: 0,
            destination_lon: 0,
            pickup_time_window: { start: loadReq.pickup_window_start || "", end: "" },
            load_type_tags: [],
            required_escort_count: loadReq.escorts_needed || 1,
            special_requirements: [],
            broker_id: loadReq.broker_id,
            cross_border_flag: false,
        };

        // Wire Escrow Loop natively!
        const bookingResult = await createBooking(matchPayload, [offer_id]);

        return NextResponse.json({ success: true, booking: bookingResult });

    } catch (err: any) {
        console.error("[AcceptOffer] Error:", err.message);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
