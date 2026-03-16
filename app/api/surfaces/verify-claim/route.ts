import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const supabase = getSupabaseAdmin();

export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { surface_id, user_id } = body;

        if (!surface_id) {
            return NextResponse.json({ ok: false, error: "surface_id required" }, { status: 400 });
        }

        const { data, error } = await supabase.rpc("verify_surface_claim", {
            p_surface_id: surface_id,
            p_user_id: user_id || null,
        });

        if (error) {
            return NextResponse.json({ ok: false, error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (e) {
        return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
    }
}
