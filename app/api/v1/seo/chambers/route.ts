// app/api/v1/seo/chambers/route.ts
//
// GET  /api/v1/seo/chambers?country_code=US&status=identified
// POST /api/v1/seo/chambers — add a chamber record
// PATCH /api/v1/seo/chambers — update backlink/partnership status

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export const runtime = "nodejs";

export async function GET(req: Request) {
    const supabase = getSupabaseAdmin();
    const url = new URL(req.url);

    const countryCode = url.searchParams.get("country_code");
    const backlinkStatus = url.searchParams.get("backlink_status");
    const partnershipStatus = url.searchParams.get("partnership_status");
    const limit = Math.min(parseInt(url.searchParams.get("limit") ?? "50"), 200);

    let query = supabase
        .from("chambers_of_commerce")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(limit);

    if (countryCode) query = query.eq("country_code", countryCode);
    if (backlinkStatus) query = query.eq("backlink_status", backlinkStatus);
    if (partnershipStatus) query = query.eq("partnership_status", partnershipStatus);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    const chambers = (data ?? []) as any[];
    const summary = {
        total: chambers.length,
        backlinks_verified: chambers.filter((c) => c.backlink_status === "verified").length,
        partners: chambers.filter((c) => c.partnership_status === "partner").length,
        opportunities: chambers.filter((c) => c.backlink_opportunity).length,
    };

    return NextResponse.json({ ok: true, summary, chambers });
}

export async function POST(req: Request) {
    const supabase = getSupabaseAdmin();

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.chamber_name || !body.country_code) {
        return NextResponse.json({ error: "chamber_name and country_code required" }, { status: 400 });
    }

    const { data, error } = await supabase
        .from("chambers_of_commerce")
        .insert({
            chamber_name: body.chamber_name,
            country_code: body.country_code,
            region_code: body.region_code ?? null,
            city: body.city ?? null,
            website_url: body.website_url ?? null,
            membership_required: body.membership_required ?? false,
            backlink_opportunity: body.backlink_opportunity ?? false,
            contact_email: body.contact_email ?? null,
            contact_name: body.contact_name ?? null,
            domain_authority: body.domain_authority ?? null,
            notes: body.notes ?? null,
        })
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, chamber: data });
}

export async function PATCH(req: Request) {
    const supabase = getSupabaseAdmin();

    let body;
    try { body = await req.json(); }
    catch { return NextResponse.json({ error: "Invalid JSON" }, { status: 400 }); }

    if (!body.id) {
        return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const updates: Record<string, any> = { updated_at: new Date().toISOString() };
    if (body.backlink_status) updates.backlink_status = body.backlink_status;
    if (body.backlink_url) updates.backlink_url = body.backlink_url;
    if (body.partnership_status) updates.partnership_status = body.partnership_status;
    if (body.domain_authority) updates.domain_authority = body.domain_authority;
    if (body.notes) updates.notes = body.notes;

    const { data, error } = await supabase
        .from("chambers_of_commerce")
        .update(updates)
        .eq("id", body.id)
        .select()
        .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, chamber: data });
}
