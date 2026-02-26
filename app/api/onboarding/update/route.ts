export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

// Only these keys are allowed to be patched via this endpoint
const ALLOWED_KEYS = new Set([
    "display_name", "phone", "email", "availability",
    "home_base_city", "home_base_state", "radius_miles",
    "capabilities", "onboarding_step", "onboarding_completed_at",
    "lat", "lng", "city", "state",
]);

export async function POST(req: Request) {
    const body = await req.json();
    const { userId, patch } = body as { userId: string; patch: Record<string, any> };

    if (!userId) return NextResponse.json({ error: "userId required" }, { status: 400 });
    if (!patch || typeof patch !== "object") return NextResponse.json({ error: "patch required" }, { status: 400 });

    const { data: profile, error: perr } = await getSupabase()
        .from("profiles")
        .select("id,onboarding_step")
        .eq("user_id", userId)
        .single();

    if (perr || !profile) return NextResponse.json({ error: "profile not found" }, { status: 404 });

    // Allowlist guard â€” silently drop unauthorized keys
    const clean: Record<string, any> = {};
    for (const [k, v] of Object.entries(patch)) {
        if (ALLOWED_KEYS.has(k)) clean[k] = v;
    }

    const { error: uerr } = await getSupabase()
        .from("profiles")
        .update(clean)
        .eq("id", profile.id);

    if (uerr) return NextResponse.json({ error: uerr.message }, { status: 500 });

    return NextResponse.json({ ok: true });
}
