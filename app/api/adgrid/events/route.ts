// app/api/adgrid/events/route.ts
// POST — fire AdGrid telemetry events (impression, click, sponsor_cta_click, etc.)
// High-write, no auth required (anon allowed). Returns 204 on success.
// v2: Added fraud prevention — IP/UA hashing, click velocity capping, visitor identity

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { createHash } from "crypto";

const VALID_EVENTS = new Set([
    "impression",
    "click",
    "sponsor_cta_click",
    "lead_form_submit",
    "checkout_started",
    "corridor_featured_inquiry_started",
    "profile_view",
    "claim_started",
    "upgrade_started",
    "conversion",
]);

// Max click events per visitor per slot per hour (fraud prevention)
const MAX_CLICKS_PER_HOUR = 5;

function hashString(s: string): string {
    return createHash("sha256").update(s).digest("hex").slice(0, 16);
}

export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const svc = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { slot_id, event_type, entity_type, entity_id, session_id, campaign_id, visitor_id, page_type, meta } = body as {
        slot_id?: string;
        event_type?: string;
        entity_type?: string;
        entity_id?: string;
        session_id?: string;
        campaign_id?: string;
        visitor_id?: string;
        page_type?: string;
        meta?: Record<string, unknown>;
    };

    if (!slot_id || !event_type) {
        return NextResponse.json({ error: "slot_id and event_type required" }, { status: 400 });
    }
    if (!VALID_EVENTS.has(event_type)) {
        return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    // ── Fraud prevention: extract + hash IP and UA ──
    const forwarded = req.headers.get("x-forwarded-for");
    const ip = forwarded?.split(",")[0]?.trim() ?? req.headers.get("x-real-ip") ?? "unknown";
    const ua = req.headers.get("user-agent") ?? "unknown";
    const ipHash = hashString(ip);
    const uaHash = hashString(ua);
    const effectiveVisitor = visitor_id ?? ipHash;

    // ── Click velocity check: cap per visitor per slot per hour ──
    if (event_type === "click" || event_type === "sponsor_cta_click") {
        const { count } = await svc
            .from("adgrid_events")
            .select("id", { count: "exact", head: true })
            .eq("slot_id", slot_id)
            .eq("visitor_id", effectiveVisitor)
            .in("event_type", ["click", "sponsor_cta_click"])
            .gte("created_at", new Date(Date.now() - 3600000).toISOString());

        if ((count ?? 0) >= MAX_CLICKS_PER_HOUR) {
            return NextResponse.json({ error: "Rate limited" }, { status: 429 });
        }
    }

    // Get actor_id from session if available (non-blocking)
    let actor_id: string | null = null;
    try {
        const anonClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await anonClient.auth.getUser();
        actor_id = user?.id ?? null;
    } catch { /* ignore auth errors */ }

    const { error } = await svc.from("adgrid_events").insert({
        slot_id,
        event_type,
        entity_type: entity_type ?? null,
        entity_id: entity_id ?? null,
        session_id: session_id ?? null,
        campaign_id: campaign_id ?? null,
        actor_id,
        visitor_id: effectiveVisitor,
        ip_hash: ipHash,
        ua_hash: uaHash,
        meta: { ...(meta ?? {}), page_type: page_type ?? null },
    });

    if (error) {
        console.error("[adgrid/events POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return new NextResponse(null, { status: 204 });
}
