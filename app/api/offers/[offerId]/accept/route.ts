export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(_: Request, { params }: { params: Promise<{ offerId: string }> }) {
    const { offerId } = await params;

    const { data: offer, error } = await getSupabase()
        .from("offers")
        .select("id,status,load_id")
        .eq("id", offerId)
        .single();

    if (error || !offer) return NextResponse.json({ error: "offer not found" }, { status: 404 });
    if (offer.status !== "sent") {
        return NextResponse.json({ error: "Offer already actioned", status: offer.status }, { status: 409 });
    }

    // Accept this offer atomically
    const { error: upErr } = await getSupabase()
        .from("offers")
        .update({ status: "accepted", accepted_at: new Date().toISOString() })
        .eq("id", offerId)
        .eq("status", "sent"); // guard against race condition

    if (upErr) return NextResponse.json({ error: upErr.message }, { status: 500 });

    // Expire all other offers on the same load
    await getSupabase()
        .from("offers")
        .update({ status: "expired" })
        .eq("load_id", offer.load_id)
        .neq("id", offerId)
        .eq("status", "sent");

    // Mark load as matched
    await getSupabase()
        .from("loads")
        .update({ status: "matched" })
        .eq("id", offer.load_id);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(new URL(`/offers/${offerId}?accepted=1`, siteUrl));
}
