// app/api/feed/route.ts
// GET — social activity feed for LiveActivityFeed component
//       ?region=TX&limit=20&cursor=<occurred_at ISO>
//
// Returns: { events: ActivityFeedEvent[], next_cursor: string | null }

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface ActivityFeedEvent {
    id: string;
    operator_id: string;
    operator_name: string | null;
    operator_state: string | null;
    event_type: string;
    region_code: string | null;
    corridor_key: string | null;
    title: string;
    description: string | null;
    meta: Record<string, unknown>;
    occurred_at: string;
}

async function makeSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );
}

export async function GET(req: NextRequest) {
    const supabase = await makeSupabase();
    const { searchParams } = new URL(req.url);

    const region = searchParams.get("region");       // state/province code filter (optional)
    const corridor = searchParams.get("corridor");   // corridor key filter (optional)
    const cursor = searchParams.get("cursor");        // ISO timestamp for pagination
    const limit = Math.min(Number(searchParams.get("limit") ?? "20"), 50);

    let query = supabase
        .from("hc_activity_feed")
        .select(`
            id,
            operator_id,
            event_type,
            region_code,
            corridor_key,
            title,
            description,
            meta,
            occurred_at,
            profiles!operator_id (
                full_name,
                company_name,
                state
            )
        `)
        .eq("is_visible", true)
        .order("occurred_at", { ascending: false })
        .limit(limit + 1); // fetch one extra to determine if there's a next page

    // Optional filters
    if (region) query = query.eq("region_code", region);
    if (corridor) query = query.eq("corridor_key", corridor);

    // Cursor-based pagination
    if (cursor) {
        query = query.lt("occurred_at", cursor);
    }

    const { data, error } = await query;

    if (error) {
        console.error("[feed GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const rows = data ?? [];
    const hasMore = rows.length > limit;
    if (hasMore) rows.pop(); // remove the extra sentinel row

    const events: ActivityFeedEvent[] = rows.map((r: any) => ({
        id: r.id,
        operator_id: r.operator_id,
        operator_name: r.profiles?.company_name ?? r.profiles?.full_name ?? null,
        operator_state: r.profiles?.state ?? null,
        event_type: r.event_type,
        region_code: r.region_code,
        corridor_key: r.corridor_key,
        title: r.title,
        description: r.description,
        meta: r.meta ?? {},
        occurred_at: r.occurred_at,
    }));

    const next_cursor = hasMore && events.length > 0
        ? events[events.length - 1].occurred_at
        : null;

    return NextResponse.json({ events, next_cursor });
}

// POST — write a feed event (called internally by other API routes / RPCs)
// Requires service-role auth header or authenticated operator
export async function POST(req: NextRequest) {
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { event_type, region_code, corridor_key, title, description, meta } = body;

    if (!event_type || !title) {
        return NextResponse.json({ error: "event_type and title required" }, { status: 400 });
    }

    const VALID_TYPES = new Set([
        "completed_escort",
        "gate_success",
        "new_review_received",
        "photo_uploaded",
        "milestone_unlocked",
    ]);
    if (!VALID_TYPES.has(event_type)) {
        return NextResponse.json({ error: "Invalid event_type" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("hc_activity_feed")
        .insert({
            operator_id: user.id,
            event_type,
            region_code: region_code ?? null,
            corridor_key: corridor_key ?? null,
            title,
            description: description ?? null,
            meta: meta ?? {},
        })
        .select("id")
        .single();

    if (error) {
        console.error("[feed POST]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ id: data.id }, { status: 201 });
}
