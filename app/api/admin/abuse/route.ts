export const dynamic = 'force-dynamic';
import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(req: Request) {
    // Lazy init — avoids module-level env access that fails during Next.js build
    const supabase = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const url = new URL(req.url);
    const openOnly = url.searchParams.get("open") === "1";

    let query = supabase
        .from("abuse_flags")
        .select("*")
        .order("severity", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(100);

    if (openOnly) query = query.is("resolved_at", null);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json(data ?? []);
}
