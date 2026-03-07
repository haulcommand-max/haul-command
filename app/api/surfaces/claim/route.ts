import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
);

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { surface_id, user_id, verification_route = "phone" } = body;

        if (!surface_id) {
            return NextResponse.json({ ok: false, error: "surface_id required" }, { status: 400 });
        }

        // Initiate claim via RPC
        const { data, error } = await supabase.rpc("claim_surface", {
            p_surface_id: surface_id,
            p_user_id: user_id || null,
            p_verification_route: verification_route,
        });

        if (error) {
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
}
