// app/api/v1/legal-intelligence/route-check/route.ts
//
// POST /api/v1/legal-intelligence/route-check
// Route-aware legality: checks legality across all states/provinces a route crosses.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { resolveRouteLegality } from "@/lib/legal-intelligence/legality-resolver";

export const runtime = "nodejs";

interface RouteCheckBody {
    operator_id: string;
    country_code?: string;
    route_regions: string[]; // ordered state/province codes the route traverses
}

export async function POST(req: Request) {
    let body: RouteCheckBody;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.operator_id) {
        return NextResponse.json({ error: "operator_id required" }, { status: 400 });
    }
    if (!body.route_regions?.length) {
        return NextResponse.json({ error: "route_regions required (array of state/province codes)" }, { status: 400 });
    }

    try {
        const result = await resolveRouteLegality(
            body.operator_id,
            body.country_code ?? "US",
            body.route_regions
        );

        return NextResponse.json({
            ok: true,
            operator_id: body.operator_id,
            ...result,
        });
    } catch (err: any) {
        console.error("[Route Legality Check Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
