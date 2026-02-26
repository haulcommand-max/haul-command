export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

async function getAuthId(): Promise<string | null> {
    try {
        const cookieStore = await cookies();
        const supabase = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            { cookies: { getAll: () => cookieStore.getAll() } }
        );
        const { data: { user } } = await supabase.auth.getUser();
        return user?.id ?? null;
    } catch { return null; }
}

export async function POST(req: Request) {
    const profileId = await getAuthId();
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { daily_budget_micros = 10_000_000, total_budget_micros = 300_000_000, bid_cpm_micros = 2_000_000 } = body;

    const { error } = await getServiceSupabase().from("ad_campaigns").upsert({
        buyer_profile_id: profileId,
        product_code: "PROFILE_FEATURED",
        target_profile_id: profileId,
        bid_cpm_micros,
        daily_budget_micros,
        total_budget_micros,
        status: "active",
    }, { onConflict: "target_profile_id,product_code" });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
