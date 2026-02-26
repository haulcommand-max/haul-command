// app/api/corridors/sponsor/route.ts
// POST — create or claim a featured corridor out-bound slot via self-serve bidding

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { port_id, corridor_slug, contact_email, bid_amount_usd, checkout_completed } = body as {
        port_id?: string;
        corridor_slug?: string;
        contact_email?: string;
        bid_amount_usd?: number;
        checkout_completed?: boolean;
    };

    if (!corridor_slug || !contact_email) {
        return NextResponse.json(
            { error: "corridor_slug and contact_email required" },
            { status: 400 }
        );
    }

    const cookieStore = await cookies();
    const svc = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const anon = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const bidAmount = bid_amount_usd ?? 149; // Default price based on UI

    if (checkout_completed) {
        // Auction logic: outbid existing "active" sponsor for this corridor takeover
        const { data: existingSponsors } = await svc
            .from("corridor_featured_sponsorships")
            .select("id, price_usd_month")
            .eq("corridor_slug", corridor_slug)
            .eq("tier", "corridor_takeover")
            .eq("status", "active");

        if (existingSponsors && existingSponsors.length > 0) {
            const currentHighest = Math.max(...existingSponsors.map(s => Number(s.price_usd_month) || 0));
            if (bidAmount <= currentHighest) {
                return NextResponse.json(
                    { error: `Bid must be higher than current active bid of $${currentHighest}` },
                    { status: 409 }
                );
            }

            // Revoke old
            const idsToRevoke = existingSponsors.map(s => s.id);
            await svc
                .from("corridor_featured_sponsorships")
                .update({ status: "expired", notes: "outbid" })
                .in("id", idsToRevoke);
        }
    }

    const { data: { user } } = await anon.auth.getUser();
    const finalStatus = checkout_completed ? "active" : "inquiry";

    const { data: sponsorship, error } = await svc
        .from("corridor_featured_sponsorships")
        .insert({
            port_id: port_id ?? null,
            corridor_slug,
            sponsor_operator_id: user?.id ?? null,
            tier: "corridor_takeover",
            status: finalStatus,
            price_usd_month: bidAmount,
            contact_email,
            notes: checkout_completed ? "Self-serve checkout completed" : "Initial inquiry",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[corridors/sponsor POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: sponsorship.id, status: finalStatus }, { status: 201 });
}
