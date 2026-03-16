// app/api/v1/legal-intelligence/legality/route.ts
//
// GET /api/v1/legal-intelligence/legality?operator_id=...&region_code=...&country_code=US
// Returns legality decision for one operator in one region.
//
// GET /api/v1/legal-intelligence/legality?operator_id=...&country_code=US&all_regions=true
// Returns legality decisions across all regions with jurisdiction rules.

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import {
    resolveLegality,
    resolveAllRegions,
} from "@/lib/legal-intelligence/legality-resolver";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const operatorId = url.searchParams.get("operator_id");
    const countryCode = url.searchParams.get("country_code") ?? "US";
    const regionCode = url.searchParams.get("region_code");
    const allRegions = url.searchParams.get("all_regions") === "true";

    if (!operatorId) {
        return NextResponse.json({ error: "operator_id required" }, { status: 400 });
    }

    try {
        if (allRegions) {
            // Full legality map across all regions
            const decisions = await resolveAllRegions(operatorId, countryCode);

            const summary = {
                legal: decisions.filter((d) => d.status === "legal").length,
                conditional: decisions.filter((d) => d.status === "conditional").length,
                illegal: decisions.filter((d) => d.status === "illegal").length,
                total: decisions.length,
            };

            // Aggregate earnings unlock potential
            const totalUnlockPotential = decisions.reduce(
                (s, d) => s + d.unlocks.reduce((us, u) => us + u.estimated_annual_revenue, 0),
                0
            );

            return NextResponse.json({
                ok: true,
                operator_id: operatorId,
                country_code: countryCode,
                summary,
                total_unlock_potential_annual: totalUnlockPotential,
                decisions,
            });
        }

        if (!regionCode) {
            return NextResponse.json(
                { error: "region_code required (or set all_regions=true)" },
                { status: 400 }
            );
        }

        const decision = await resolveLegality(operatorId, countryCode, regionCode);

        return NextResponse.json({
            ok: true,
            ...decision,
        });
    } catch (err: any) {
        console.error("[Legality Resolver Error]", err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
