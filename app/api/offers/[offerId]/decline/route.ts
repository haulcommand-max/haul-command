export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';


export async function POST(_: Request, { params }: { params: Promise<{ offerId: string }> }) {
    const { offerId } = await params;

    const { data: offer, error } = await getSupabaseAdmin()
        .from("offers")
        .select("id,status")
        .eq("id", offerId)
        .single();

    if (error || !offer) return NextResponse.json({ error: "offer not found" }, { status: 404 });
    if (offer.status !== "sent") {
        return NextResponse.json({ error: "Offer already actioned" }, { status: 409 });
    }

    await getSupabaseAdmin()
        .from("offers")
        .update({ status: "declined" })
        .eq("id", offerId);

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://haulcommand.com";
    return NextResponse.redirect(new URL(`/offers/${offerId}`, siteUrl));
}
