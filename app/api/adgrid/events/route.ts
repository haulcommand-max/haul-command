// app/api/adgrid/events/route.ts
// POST — fire AdGrid telemetry events (impression, click, sponsor_cta_click, etc.)
// High-write, no auth required (anon allowed). Returns 204 on success.
// v2: Added fraud prevention — IP/UA hashing, click velocity capping, visitor identity

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { createHash } from "crypto";
import { buildAdgridClickInsert, buildAdgridEventInsert, adgridUuidOrNull } from "@/lib/monetization/adgrid-serving";

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
    const svc = getSupabaseAdmin();

    let body: Record<string, unknown>;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const { slot_id, event_type, session_id, campaign_id, advertiser_id, visitor_id, page_type, meta } = body as {
        slot_id?: string;
        event_type?: string;
        session_id?: string;
        campaign_id?: string;
        advertiser_id?: string;
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
            .from("hc_adgrid_events")
            .select("id", { count: "exact", head: true })
            .eq("slot_id", slot_id)
            .in("event_type", ["click", "sponsor_cta_click"])
            .eq("session_id", session_id ?? effectiveVisitor)
            .gte("created_at", new Date(Date.now() - 3600000).toISOString());

        if ((count ?? 0) >= MAX_CLICKS_PER_HOUR) {
            return NextResponse.json({ error: "Rate limited" }, { status: 429 });
        }
    }

    const event = buildAdgridEventInsert({
        eventType: event_type,
        slotId: slot_id,
        campaignId: campaign_id,
        advertiserId: advertiser_id,
        surface: page_type || String(meta?.surface || "adgrid"),
        zone: String(meta?.zone || slot_id),
        countryCode: typeof meta?.country === "string" ? meta.country : undefined,
        corridorSlug: typeof meta?.corridor === "string" ? meta.corridor : undefined,
        sessionId: session_id ?? effectiveVisitor,
        userAgentSummary: `${uaHash}:${String(meta?.source || "client")}`,
    });
    const { error } = await svc.from(event.table).insert(event.payload);

    if (error) {
        console.error("[adgrid/events POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if ((event_type === "click" || event_type === "sponsor_cta_click") && adgridUuidOrNull(campaign_id)) {
        const click = buildAdgridClickInsert(
            { campaign_id: campaign_id ?? null, ab_variant: typeof meta?.variant === "string" ? meta.variant : null },
            {
                placementKey: page_type || String(meta?.surface || slot_id),
                country: typeof meta?.country === "string" ? meta.country : null,
                role: typeof meta?.role === "string" ? meta.role : null,
                slotId: slot_id,
                referrer: req.headers.get("referer"),
            },
        );
        if (click) await svc.from(click.table).insert(click.payload);
    }

    return new NextResponse(null, { status: 204 });
}
