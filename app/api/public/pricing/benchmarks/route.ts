import { supabaseServer } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
    const supabase = supabaseServer();
    const searchParams = req.nextUrl.searchParams;
    const serviceKey = searchParams.get("service_key");
    const regionKey = searchParams.get("region_key");

    let query = supabase.from("pricing_benchmarks").select("*, service_types(label)");

    if (serviceKey) query = query.eq("service_key", serviceKey);
    if (regionKey) query = query.eq("region_key", regionKey);

    const { data } = await query;
    return NextResponse.json(data ?? []);
}
