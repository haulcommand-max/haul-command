// app/api/adgrid/pricing/route.ts
// GET — returns compute_adgrid_suggested_price RPC output for a port+slot combo.
// Used by PortSponsorBlock scarcity meter.

import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const portId = searchParams.get("port_id");
    const slotId = searchParams.get("slot_id") ?? "adgrid_port_hero_sponsor";

    if (!portId) {
        return NextResponse.json({ error: "port_id required" }, { status: 400 });
    }

    const cookieStore = await cookies();
    const svc = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { cookies: { getAll: () => cookieStore.getAll() } }
    );

    const { data, error } = await svc.rpc("compute_adgrid_suggested_price", {
        p_port_id: portId,
        p_slot_id: slotId,
    });

    if (error) {
        console.error("[adgrid/pricing GET]", error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
        return NextResponse.json({ error: "Port not found" }, { status: 404 });
    }

    return NextResponse.json({
        suggested_price: Number(row.suggested_price),
        reserve_price: Number(row.reserve_price),
        scarcity_multiplier: Number(row.scarcity_multiplier),
        demand_score: Number(row.demand_score),
        sponsor_competition: Number(row.sponsor_competition),
    });
}
