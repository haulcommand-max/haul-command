// app/api/v1/crm/prospects/route.ts
//
// GET  /api/v1/crm/prospects — list prospects with filters
// POST /api/v1/crm/prospects — create a new prospect

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';
import { computeLeadScore } from "@/lib/crm/lead-scoring";

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    const countryCode = url.searchParams.get("country_code");
    const tier = url.searchParams.get("tier");
    const status = url.searchParams.get("status");
    const segment = url.searchParams.get("segment");
    const minScore = url.searchParams.get("min_score");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

    let query = supabase
        .from("prospects")
        .select("*")
        .order("lead_score", { ascending: false })
        .limit(limit);

    if (countryCode) query = query.eq("country_code", countryCode);
    if (tier) query = query.eq("prospect_tier", tier);
    if (status) query = query.eq("lead_status", status);
    if (segment) query = query.eq("industry_segment", segment);
    if (minScore) query = query.gte("lead_score", parseInt(minScore));

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const prospects = (data ?? []) as any[];

    // Summary
    const summary = {
        total: prospects.length,
        by_tier: {} as Record<string, number>,
        by_status: {} as Record<string, number>,
        by_country: {} as Record<string, number>,
    };
    for (const p of prospects) {
        summary.by_tier[p.prospect_tier] = (summary.by_tier[p.prospect_tier] || 0) + 1;
        summary.by_status[p.lead_status] = (summary.by_status[p.lead_status] || 0) + 1;
        summary.by_country[p.country_code] = (summary.by_country[p.country_code] || 0) + 1;
    }

    return NextResponse.json({ ok: true, summary, prospects });
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();

    let body;
    try {
        body = await req.json();
    } catch {
        return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.company_name || !body.country_code) {
        return NextResponse.json({ error: "company_name and country_code required" }, { status: 400 });
    }

    // Auto-compute lead score
    const scoreResult = computeLeadScore({
        industry_segment: body.industry_segment,
        energy_sector: ["energy_power", "oil_gas"].includes(body.category ?? ""),
        international_operations: body.country_code !== "US",
    });

    const { data, error } = await supabase
        .from("prospects")
        .insert({
            company_name: body.company_name,
            country_code: body.country_code,
            prospect_tier: body.prospect_tier ?? scoreResult.priority_tier,
            industry_segment: body.industry_segment ?? null,
            category: body.category ?? null,
            contact_name: body.contact_name ?? null,
            contact_title: body.contact_title ?? null,
            contact_email: body.contact_email ?? null,
            contact_phone: body.contact_phone ?? null,
            linkedin_url: body.linkedin_url ?? null,
            website_url: body.website_url ?? null,
            lead_score: scoreResult.total_score,
            lead_status: "new",
            notes: body.notes ?? null,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({
        ok: true,
        prospect: data,
        lead_score: scoreResult,
    });
}
