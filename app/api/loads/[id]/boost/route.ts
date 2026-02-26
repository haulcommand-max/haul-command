export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;
    const body = await req.json();
    const { bid_cpm_micros = 2500000, daily_budget_micros = 20000000, total_budget_micros = 100000000 } = body;

    const { data: load } = await getSupabase()
        .from("loads")
        .select("id,profile_id")
        .eq("id", id)
        .single();

    if (!load) return NextResponse.json({ error: "Load not found" }, { status: 404 });

    const { data, error } = await getSupabase()
        .from("ad_campaigns")
        .upsert({
            buyer_profile_id: load.profile_id,
            product_code: "LOAD_BOOST",
            target_load_id: id,
            bid_cpm_micros,
            daily_budget_micros,
            total_budget_micros,
            status: "active",
        }, { onConflict: "target_load_id,product_code" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
