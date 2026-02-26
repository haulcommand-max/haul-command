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

const DEFAULTS = {
    enabled: true,
    radius_miles: 30,
    corridor_ids: [],
    alert_types: ["load_posted", "offer_received", "corridor_hot", "nearby_driver_needed"],
    quiet_hours_enabled: false,
    quiet_start: null,
    quiet_end: null,
    max_push_per_hour: 6,
    max_push_per_day: 40,
};

export async function GET() {
    const profileId = await getAuthId();
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { data } = await getServiceSupabase()
        .from("alert_settings")
        .select("*")
        .eq("profile_id", profileId)
        .single();

    // Return defaults if no row yet
    return NextResponse.json(data ?? { profile_id: profileId, ...DEFAULTS });
}

export async function POST(req: Request) {
    const profileId = await getAuthId();
    if (!profileId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();

    const { error } = await getServiceSupabase()
        .from("alert_settings")
        .upsert({ profile_id: profileId, ...body, updated_at: new Date().toISOString() });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
}
