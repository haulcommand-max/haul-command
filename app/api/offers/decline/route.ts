/**
 * POST /api/offers/decline
 * Marks an offer as declined by the escort.
 */

import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
    try {
        const { offer_id } = await req.json();
        if (!offer_id) return NextResponse.json({ error: "offer_id required" }, { status: 400 });

        const cookieStore = await cookies();
        const supabaseUser = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await supabaseUser.auth.getUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const admin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { error } = await admin
            .from("offers")
            .update({ status: "declined", responded_at: new Date().toISOString() })
            .eq("id", offer_id)
            .eq("driver_id", user.id);

        if (error) return NextResponse.json({ error: "Failed to decline" }, { status: 500 });

        // Audit
        await admin.from("audit_events").insert({
            event_type: "offer_declined",
            actor_id: user.id,
            subject_type: "offer",
            subject_id: offer_id,
            payload: {},
        });

        return NextResponse.json({ ok: true });
    } catch (err) {
        return NextResponse.json({ error: "Server error", detail: String(err) }, { status: 500 });
    }
}
