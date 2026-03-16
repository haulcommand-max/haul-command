/**
 * POST /api/offers/accept
 * 
 * One-Tap Accept: marks offer as accepted, creates job, notifies broker.
 * Idempotent — re-accepting same offer returns success.
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

function getAdminSupabase() {
    return getSupabaseAdmin();
}

export async function POST(req: NextRequest) {
    try {
        const { offer_id } = await req.json();
        if (!offer_id) {
            return NextResponse.json({ error: "offer_id required" }, { status: 400 });
        }

        // Auth: get current user
        const cookieStore = await cookies();
        const supabaseUser = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const admin = getAdminSupabase();

        // 1. Fetch the offer + load
        const { data: offer, error: offerErr } = await admin
            .from("offers")
            .select("id, load_id, driver_id, status, price_offer_cents")
            .eq("id", offer_id)
            .single();

        if (offerErr || !offer) {
            return NextResponse.json({ error: "Offer not found" }, { status: 404 });
        }

        // Verify the offer belongs to this driver
        if (offer.driver_id !== user.id) {
            return NextResponse.json({ error: "This offer is not assigned to you" }, { status: 403 });
        }

        // Idempotent: already accepted
        if (offer.status === "accepted") {
            return NextResponse.json({ ok: true, already_accepted: true, offer_id });
        }

        // Can't accept expired/cancelled
        if (offer.status === "expired" || offer.status === "cancelled") {
            return NextResponse.json({ error: "Offer has expired or been cancelled" }, { status: 410 });
        }

        // 2. Accept the offer
        const { error: updateErr } = await admin
            .from("offers")
            .update({
                status: "accepted",
                responded_at: new Date().toISOString(),
            })
            .eq("id", offer_id);

        if (updateErr) {
            return NextResponse.json({ error: "Failed to update offer" }, { status: 500 });
        }

        // 3. Expire other pending offers for this load
        await admin
            .from("offers")
            .update({ status: "expired" })
            .eq("load_id", offer.load_id)
            .neq("id", offer_id)
            .in("status", ["sent", "viewed"]);

        // 4. Update load status to 'filled'
        await admin
            .from("loads")
            .update({ status: "filled" })
            .eq("id", offer.load_id);

        // 5. Create job record
        const { data: load } = await admin
            .from("loads")
            .select("broker_id")
            .eq("id", offer.load_id)
            .single();

        const { data: job } = await admin
            .from("jobs")
            .insert({
                load_id: offer.load_id,
                broker_id: load?.broker_id,
                driver_id: user.id,
                status: "scheduled",
                agreed_price_cents: offer.price_offer_cents,
            })
            .select("id")
            .single();

        // 6. Notify broker (insert notification)
        if (load?.broker_id) {
            await admin.from("notifications").insert({
                user_id: load.broker_id,
                channel: "inapp",
                title: "Offer Accepted! 🎉",
                body: `An escort has accepted your load offer.`,
                metadata: {
                    type: "offer_accepted",
                    offer_id: offer_id,
                    load_id: offer.load_id,
                    job_id: job?.id,
                    driver_id: user.id,
                },
            });
        }

        // 7. Audit log
        await admin.from("audit_events").insert({
            event_type: "offer_accepted",
            actor_id: user.id,
            subject_type: "offer",
            subject_id: offer_id,
            payload: {
                load_id: offer.load_id,
                job_id: job?.id,
                price_cents: offer.price_offer_cents,
            },
        });

        return NextResponse.json({
            ok: true,
            offer_id,
            job_id: job?.id,
            load_id: offer.load_id,
        });
    } catch (err) {
        console.error("[offer-accept]", err);
        return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
    }
}
