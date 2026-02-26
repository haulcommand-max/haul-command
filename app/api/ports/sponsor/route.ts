// app/api/ports/sponsor/route.ts
// POST — create a port sponsorship inquiry (no billing yet)
// GET  — return active sponsorships for a port (for page rendering)

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

const TIER_PRICES: Record<string, number> = {
    starter: 199,
    pro: 399,
    domination: 799,
};

async function makeSvc() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

async function makeAnon() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const { port_id, tier, contact_email, bid_amount_usd, checkout_completed } = body as {
        port_id?: string;
        tier?: string;
        contact_email?: string;
        bid_amount_usd?: number;
        checkout_completed?: boolean;
    };

    if (!port_id || !tier || !contact_email) {
        return NextResponse.json(
            { error: "port_id, tier, and contact_email required" },
            { status: 400 }
        );
    }

    if (!["starter", "pro", "domination"].includes(tier)) {
        return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    const svc = await makeSvc();
    const bidAmount = bid_amount_usd ?? TIER_PRICES[tier];

    // Check domination exclusivity and auction logic
    if (tier === "domination" && checkout_completed) {
        // Find existing active domination sponsor
        const { data: existingSponsors } = await svc
            .from("port_sponsorships")
            .select("id, price_usd_month")
            .eq("port_id", port_id)
            .eq("tier", "domination")
            .eq("status", "active");

        if (existingSponsors && existingSponsors.length > 0) {
            const currentHighest = Math.max(...existingSponsors.map(s => Number(s.price_usd_month) || 0));
            // If bid is below or equal to current, reject
            if (bidAmount <= currentHighest) {
                return NextResponse.json(
                    { error: `Bid must be higher than current active bid of $${currentHighest}` },
                    { status: 409 }
                );
            }

            // Revoke old sponsors (outbid)
            const idsToRevoke = existingSponsors.map(s => s.id);
            await svc
                .from("port_sponsorships")
                .update({ status: "expired", notes: "outbid" })
                .in("id", idsToRevoke);
        }
    }

    // Get authenticated operator if any
    const anon = await makeAnon();
    const { data: { user } } = await anon.auth.getUser();

    const finalStatus = checkout_completed ? "active" : "inquiry";

    const { data: sponsorship, error } = await svc
        .from("port_sponsorships")
        .insert({
            port_id,
            sponsor_operator_id: user?.id ?? null,
            tier,
            status: finalStatus,
            exclusive: tier === "domination",
            price_usd_month: bidAmount,
            contact_email,
            contact_name: null,
            notes: checkout_completed ? "Self-serve checkout completed" : "Initial inquiry",
        })
        .select("id")
        .single();

    if (error) {
        console.error("[ports/sponsor POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: sponsorship.id, status: finalStatus }, { status: 201 });
}

export async function GET(req: NextRequest) {
    const svc = await makeSvc();
    const { searchParams } = new URL(req.url);
    const portId = searchParams.get("port_id");
    const portSlug = searchParams.get("port_slug");

    if (!portId && !portSlug) {
        return NextResponse.json({ error: "port_id or port_slug required" }, { status: 400 });
    }

    let query = svc
        .from("port_sponsorships")
        .select("id, tier, exclusive, starts_at, ends_at, status, sponsor_operator_id")
        .eq("status", "active");

    if (portId) {
        query = query.eq("port_id", portId);
    } else if (portSlug) {
        // Join via ports table
        const { data: port } = await svc
            .from("ports")
            .select("id")
            .eq("slug", portSlug)
            .single();
        if (!port) return NextResponse.json({ sponsorships: [] });
        query = query.eq("port_id", port.id);
    }

    const { data, error } = await query;

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ sponsorships: data ?? [] });
}
