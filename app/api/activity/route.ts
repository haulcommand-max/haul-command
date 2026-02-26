export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Generates human-friendly ticker rows from real DB activity.
// NO fakery â€” derived only from loads + presence rows that exist.
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit") ?? 12), 30);

    const [loadsRes, presRes] = await Promise.all([
        getSupabase()
        .from("loads")
            .select("id,title,origin_city,origin_state,urgency,created_at,status")
            .in("status", ["open", "matched"])
            .order("created_at", { ascending: false })
            .limit(Math.ceil(limit / 2)),
        getSupabase()
        .from("presence_heartbeats")
            .select("profile_id,last_seen_at")
            .gte("last_seen_at", new Date(Date.now() - 60 * 60 * 1000).toISOString())
            .order("last_seen_at", { ascending: false })
            .limit(Math.ceil(limit / 2)),
    ]);

    if (loadsRes.error) return NextResponse.json({ error: loadsRes.error.message }, { status: 500 });
    if (presRes.error) return NextResponse.json({ error: presRes.error.message }, { status: 500 });

    const items: Array<{ id: string; ts: string; text: string; kind: string }> = [];

    for (const l of loadsRes.data ?? []) {
        const loc = [l.origin_city, l.origin_state].filter(Boolean).join(", ");
        const urgency = Number(l.urgency ?? 0);
        const tag = urgency >= 80 ? "URGENT" : urgency >= 50 ? "FILLING FAST" : "NEW LOAD";
        items.push({
            id: `load_${l.id}`,
            ts: l.created_at,
            kind: "load",
            text: `${tag}: ${l.title}${loc ? ` near ${loc}` : ""}`,
        });
    }

    for (const p of presRes.data ?? []) {
        items.push({
            id: `presence_${p.profile_id}_${p.last_seen_at}`,
            ts: p.last_seen_at,
            kind: "presence",
            text: "Driver activity detected in your network",
        });
    }

    items.sort((a, b) => new Date(b.ts).getTime() - new Date(a.ts).getTime());

    return NextResponse.json(
        { items: items.slice(0, limit) },
        { headers: { "Cache-Control": "no-store" } }
    );
}
