import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    const url = new URL(req.url);
    const params = new URLSearchParams({
        product_code: url.searchParams.get("product_code") ?? "LOAD_BOOST",
        placement: url.searchParams.get("placement") ?? "map_glow",
        corridor_id: url.searchParams.get("corridor_id") ?? "",
        cell_id: url.searchParams.get("cell_id") ?? "",
        viewer_profile_id: url.searchParams.get("viewer_profile_id") ?? "",
    });

    // Proxy to Supabase Edge Function
    const res = await fetch(
        `${SUPABASE_URL}/functions/v1/placements-resolve?${params}`,
        { headers: { Authorization: `Bearer ${SUPABASE_ANON_KEY}` } }
    );

    const data = await res.json();
    return NextResponse.json(data, {
        headers: { "Cache-Control": "no-store" },
    });
}
