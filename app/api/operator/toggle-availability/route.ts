import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/operator/toggle-availability
 * Sets operator availability and presence status.
 */
export async function POST(req: NextRequest) {
    try {
        const { user_id, status } = await req.json();

        if (!user_id || !["available", "unavailable", "busy"].includes(status)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await sb.rpc("hc_toggle_availability", {
            p_user_id: user_id,
            p_status: status,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
