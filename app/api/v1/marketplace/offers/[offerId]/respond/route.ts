// app/api/v1/marketplace/offers/[offerId]/respond/route.ts
//
// POST /api/v1/marketplace/offers/{offerId}/respond
// Accept or decline an offer. On acceptance, check if all escorts filled → create booking.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import { createBooking } from "@/lib/marketplace/match-engine";

export const runtime = "nodejs";

interface RespondBody {
    action: "accept" | "decline";
    decline_reason?: string;
    counter_offer_rate?: number;
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ offerId: string }> }
) {
    const supabase = getSupabaseAdmin();
    const { offerId } = await params;

    let body: RespondBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!["accept", "decline"].includes(body.action)) {
        return NextResponse.json({ error: "action must be 'accept' or 'decline'" }, { status: 400 });
    }

    // Fetch the offer
    const { data: offer, error: offerErr } = await supabase
        .from("offers")
        .select("*")
        .eq("offer_id", offerId)
        .single();

    if (offerErr || !offer) {
        return NextResponse.json({ error: "Offer not found" }, { status: 404 });
    }

    if ((offer as any).status !== "sent") {
        return NextResponse.json(
            { error: `Offer already ${(offer as any).status}` },
            { status: 409 }
        );
    }

    // Check deadline
    const deadline = new Date((offer as any).accept_deadline_at);
    if (deadline < new Date()) {
        // Auto-expire
        await supabase
            .from("offers")
            .update({ status: "expired", responded_at: new Date().toISOString() })
            .eq("offer_id", offerId);
        return NextResponse.json({ error: "Offer has expired" }, { status: 410 });
    }

    if (body.action === "decline") {
        await supabase
            .from("offers")
            .update({
                status: "declined",
                responded_at: new Date().toISOString(),
                response_metadata: {
                    decline_reason: body.decline_reason ?? null,
                    counter_offer_rate: body.counter_offer_rate ?? null,
                },
            })
            .eq("offer_id", offerId);

        return NextResponse.json({ ok: true, offer_id: offerId, status: "declined" });
    }

    // Accept the offer
    await supabase
        .from("offers")
        .update({
            status: "accepted",
            responded_at: new Date().toISOString(),
        })
        .eq("offer_id", offerId);

    const requestId = (offer as any).request_id;

    // Check if we have enough accepted escorts for this load
    const { data: loadReq, error: loadErr } = await supabase
        .from("load_requests")
        .select("required_escort_count,country_code,admin1_code,origin_lat,origin_lon,destination_lat,destination_lon,pickup_time_window,load_type_tags,special_requirements,broker_id,carrier_id,budget_range,cross_border_flag")
        .eq("request_id", requestId)
        .single();

    if (loadErr || !loadReq) {
        return NextResponse.json({ ok: true, offer_id: offerId, status: "accepted", booking: null });
    }

    const requiredCount = (loadReq as any).required_escort_count ?? 1;

    const { data: acceptedOffers } = await supabase
        .from("offers")
        .select("offer_id,operator_id")
        .eq("request_id", requestId)
        .eq("status", "accepted");

    const acceptedCount = (acceptedOffers ?? []).length;

    if (acceptedCount >= requiredCount) {
        // All escorts filled — create booking
        try {
            const acceptedIds = (acceptedOffers as any[]).map((o: any) => o.offer_id);
            const booking = await createBooking(
                {
                    request_id: requestId,
                    ...(loadReq as any),
                    load_type_tags: (loadReq as any).load_type_tags ?? [],
                    special_requirements: (loadReq as any).special_requirements ?? [],
                },
                acceptedIds
            );

            // Withdraw remaining sent offers
            await supabase
                .from("offers")
                .update({ status: "withdrawn", responded_at: new Date().toISOString() })
                .eq("request_id", requestId)
                .eq("status", "sent");

            return NextResponse.json({
                ok: true,
                offer_id: offerId,
                status: "accepted",
                booking: {
                    job_id: booking.job_id,
                    assigned_escorts: booking.assigned_escorts,
                    all_escorts_filled: true,
                    payment: booking.payment,
                },
            });
        } catch (err: any) {
            console.error("[Booking Error]", err);
            return NextResponse.json({
                ok: true,
                offer_id: offerId,
                status: "accepted",
                booking_error: err.message,
            });
        }
    }

    return NextResponse.json({
        ok: true,
        offer_id: offerId,
        status: "accepted",
        escorts_filled: acceptedCount,
        escorts_required: requiredCount,
        all_escorts_filled: false,
    });
}
