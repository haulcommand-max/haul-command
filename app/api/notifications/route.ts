import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

/**
 * GET /api/notifications
 * Fetches notifications for the authenticated user.
 * Supports polling or can be replaced with Supabase realtime.
 */
export async function GET(req: NextRequest) {
    try {
        const userId = req.nextUrl.searchParams.get("user_id");
        const unread = req.nextUrl.searchParams.get("unread");
        const limit = parseInt(req.nextUrl.searchParams.get("limit") || "25");

        if (!userId) {
            return NextResponse.json({ error: "user_id required" }, { status: 400 });
        }

        const sb = getSupabaseAdmin();

        let query = sb
            .from("hc_notifications")
            .select("*")
            .eq("identity_id", userId)
            .order("created_at", { ascending: false })
            .limit(limit);

        if (unread === "true") {
            query = query.is("read_at", null);
        }

        const { data, error } = await query;

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({
            ok: true,
            notifications: data,
            unread_count: data?.filter((n: { read_at: string | null }) => !n.read_at).length || 0,
        });
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

/**
 * POST /api/notifications — Mark notifications as read
 */
export async function POST(req: NextRequest) {
    try {
        const { notification_ids, user_id } = await req.json();

        const sb = getSupabaseAdmin();

        const { error } = await sb
            .from("hc_notifications")
            .update({ read_at: new Date().toISOString() })
            .eq("identity_id", user_id)
            .in("notification_id", notification_ids);

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json({ ok: true });
    } catch {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
