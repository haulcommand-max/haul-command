export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

function getServiceSupabase() {
    return getSupabaseAdmin();
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

    const safeDailyBudgetMicros = Math.min(Math.max(Number(daily_budget_micros) || 10_000_000, 1_000_000), 50_000_000);
    const safeTotalBudgetMicros = Math.min(Math.max(Number(total_budget_micros) || 300_000_000, safeDailyBudgetMicros), 1_500_000_000);
    const safeBidCpmMicros = Math.min(Math.max(Number(bid_cpm_micros) || 2_000_000, 500_000), 10_000_000);

    const { error } = await getServiceSupabase().from("ad_campaigns").upsert({
        buyer_profile_id: profileId,
        product_code: "PROFILE_FEATURED",
        target_profile_id: profileId,
        bid_cpm_micros: safeBidCpmMicros,
        daily_budget_micros: safeDailyBudgetMicros,
        total_budget_micros: safeTotalBudgetMicros,
        status: "pending_payment",
    }, { onConflict: "target_profile_id,product_code" });

    if (error) {
        console.error("[profile/featured] pending featured campaign failed:", error.message);
        return NextResponse.json({ error: "featured_request_failed" }, { status: 503 });
    }
    return NextResponse.json({ ok: true, status: "pending_payment" });
}
