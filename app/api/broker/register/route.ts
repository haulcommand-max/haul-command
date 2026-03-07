import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

/**
 * POST /api/broker/register
 * Register a new broker profile.
 */
export async function POST(req: NextRequest) {
    try {
        const { user_id, company_name, email, mc_number } = await req.json();

        if (!user_id || !company_name) {
            return NextResponse.json({ error: "user_id and company_name required" }, { status: 400 });
        }

        const sb = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data, error } = await sb.rpc("hc_register_broker", {
            p_user_id: user_id,
            p_company_name: company_name,
            p_email: email || null,
            p_mc_number: mc_number || null,
        });

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }

        return NextResponse.json(data);
    } catch (err) {
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
