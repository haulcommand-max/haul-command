export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET(_req: Request, { params }: { params: Promise<{ profileId: string }> }) {
    const { profileId } = await params;

    const { data, error } = await getSupabase()
        .from("trust_profile_corridor_view")
        .select("*")
        .eq("profile_id", profileId)
        .order("confidence", { ascending: false })
        .order("trust_score", { ascending: false })
        .limit(5);

    if (error) {
        return NextResponse.json({ corridors: [] });
    }

    return NextResponse.json(
        { corridors: data ?? [] },
        { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
    );
}
