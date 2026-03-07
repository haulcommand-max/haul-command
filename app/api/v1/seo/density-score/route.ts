// app/api/v1/seo/density-score/route.ts
//
// GET  /api/v1/seo/density-score?country_code=US
// POST /api/v1/seo/density-score/compute-all  (cron: recompute all countries)

import { NextResponse } from "next/server";
import {
    computeCountryDensityScore,
    computeAllCountryCDS,
    evaluatePageIndexability,
} from "@/lib/seo/country-density-score";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const url = new URL(req.url);
    const countryCode = url.searchParams.get("country_code");
    const allCountries = url.searchParams.get("all") === "true";
    const pagePath = url.searchParams.get("check_page");

    // Page indexability check
    if (pagePath && countryCode) {
        const check = await evaluatePageIndexability(pagePath, countryCode);
        return NextResponse.json({ ok: true, ...check });
    }

    // All countries overview
    if (allCountries) {
        const supabase = getSupabaseAdmin();
        const { data } = await supabase
            .from("country_density_scores")
            .select("*")
            .order("density_score", { ascending: false });

        const scores = (data ?? []) as any[];
        const summary = {
            total: scores.length,
            dominant: scores.filter((s) => s.density_band === "dominant").length,
            credible: scores.filter((s) => s.density_band === "credible").length,
            emerging: scores.filter((s) => s.density_band === "emerging").length,
            stealth: scores.filter((s) => s.density_band === "stealth").length,
        };

        return NextResponse.json({ ok: true, summary, scores });
    }

    // Single country
    if (!countryCode) {
        return NextResponse.json({ error: "country_code required" }, { status: 400 });
    }

    const result = await computeCountryDensityScore(countryCode);
    return NextResponse.json({ ok: true, ...result });
}

export async function POST() {
    // Recompute all countries (cron job)
    const results = await computeAllCountryCDS();

    const summary = {
        total: results.length,
        dominant: results.filter((r) => r.density_band === "dominant").length,
        credible: results.filter((r) => r.density_band === "credible").length,
        emerging: results.filter((r) => r.density_band === "emerging").length,
        stealth: results.filter((r) => r.density_band === "stealth").length,
    };

    return NextResponse.json({ ok: true, summary, results });
}
