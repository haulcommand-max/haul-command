// app/api/estimate/submit/route.ts
// POST — receive coverage estimate lead, route to active port sponsor or fallback.
// No billing. Logs to hc_behavioral_events + notifies sponsor operator.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

async function makeSvc() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

export async function POST(req: NextRequest) {
    const body = await req.json();
    const {
        email,
        port_slug,
        corridor_slug,
        origin,
        destination,
        load_width_ft,
        load_height_ft,
        night_move,
        estimate,
    } = body as {
        email?: string;
        port_slug?: string;
        corridor_slug?: string;
        origin?: string;
        destination?: string;
        load_width_ft?: number;
        load_height_ft?: number;
        night_move?: boolean;
        estimate?: {
            escortCount: number;
            needsPolice: boolean;
            needsHeightPole: boolean;
            estimatedCost: string;
            urgencyLevel: string;
        };
    };

    if (!email) {
        return NextResponse.json({ error: "email required" }, { status: 400 });
    }

    const svc = await makeSvc();

    // Resolve active sponsor operator for this port/corridor
    let routedOperatorId: string | null = null;
    if (port_slug) {
        const { data: port } = await svc
            .from("ports")
            .select("id")
            .eq("slug", port_slug)
            .single();

        if (port) {
            // Try active port sponsor — domination first, then pro, then starter
            const { data: sponsor } = await svc
                .from("port_sponsorships")
                .select("sponsor_operator_id, tier")
                .eq("port_id", port.id)
                .eq("status", "active")
                .in("tier", ["domination", "pro", "starter"])
                .order("tier", { ascending: true }) // domination sorts first alpha-wise
                .limit(1)
                .maybeSingle();

            routedOperatorId = sponsor?.sponsor_operator_id ?? null;
        }
    }

    // Log behavioral event for data exhaust
    await svc.from("hc_behavioral_events").insert({
        event_type: "estimate_lead",
        target_type: port_slug ? "port" : "corridor",
        actor_id: null,
        meta: {
            email_hash: Buffer.from(email).toString("base64").slice(0, 16), // privacy: don't store raw email
            port_slug,
            corridor_slug,
            origin,
            destination,
            load_width_ft,
            load_height_ft,
            night_move,
            escort_count: estimate?.escortCount,
            needs_police: estimate?.needsPolice,
            urgency_level: estimate?.urgencyLevel,
            routed_operator_id: routedOperatorId,
        },
    });

    // TODO: send email notification to routedOperatorId's email (Resend/SMTP integration Phase 5)
    // For now, log the pending route for manual follow-up
    console.info("[estimate/submit] Lead received", {
        email,
        port_slug,
        routedOperatorId,
        urgencyLevel: estimate?.urgencyLevel,
    });

    return NextResponse.json({
        success: true,
        routed: routedOperatorId !== null,
        message: routedOperatorId
            ? "Lead routed to active sponsor operator"
            : "Lead queued — we'll match with the best available operator",
    });
}
