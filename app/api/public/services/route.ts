import { supabaseServer } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
    const supabase = supabaseServer();
    const { data } = await supabase.from("service_types").select("*, pricing_benchmarks(*)").eq("is_active", true);
    return NextResponse.json(data ?? []);
}
