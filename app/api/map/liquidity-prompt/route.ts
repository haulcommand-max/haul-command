export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );
}

export async function GET() {
    const { data } = await getSupabase()
        .from("liquidity_prompts")
        .select("id,prompt_type,headline,body,cta_text,cta_href")
        .eq("active", true)
        .order("priority", { ascending: true })
        .limit(1)
        .single();

    return NextResponse.json(
        { prompt: data ?? null },
        { headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" } }
    );
}
