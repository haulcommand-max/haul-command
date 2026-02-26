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
        .from("trust_profile_view")
        .select("*")
        .eq("profile_id", profileId)
        .single();

    if (error || !data) {
        return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    }

    return NextResponse.json(data, {
        headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
    });
}
