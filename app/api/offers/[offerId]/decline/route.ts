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
        .select("id,status")
        .eq("id", offerId)
        .single();

    if (error || !offer) return NextResponse.json({ error: "offer not found" }, { status: 404 });
    if (offer.status !== "sent") {
        return NextResponse.json({ error: "Offer already actioned" }, { status: 409 });
    }

    await getSupabase()
        .from("offers")
        .update({ status: "declined" })
        .eq("id", offerId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
    return NextResponse.redirect(new URL(`/offers/${offerId}`, siteUrl));
}
