import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from '@/lib/supabase/admin';

const SECRET = process.env.HC_ADMIN_SECRET;
function ok(req: NextRequest) {
    const a = req.headers.get("x-admin-secret") || req.headers.get("authorization")?.replace("Bearer ", "");
    return !!SECRET && a === SECRET;
}

export async function GET(req: NextRequest) {
    if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const sb = getSupabaseAdmin();
    const et = req.nextUrl.searchParams.get("entity_type");
    let q = sb.from("hc_prompt_templates").select("*").eq("is_active", true).order("win_count", { ascending: false });
    if (et) q = q.eq("entity_type", et);
    const { data, error } = await q;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ templates: data });
}

export async function POST(req: NextRequest) {
    if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { name, entity_type, usage_slot, prompt_template, description, is_system } = await req.json();
    if (!name || !entity_type || !prompt_template) return NextResponse.json({ error: "name, entity_type, prompt_template required" }, { status: 400 });
    const sb = getSupabaseAdmin();
    const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    const { data, error } = await sb.from("hc_prompt_templates").insert({ name, slug, version: 1, entity_type, usage_slot: usage_slot || "hero", prompt_template, description: description || null, is_system: is_system ?? false, is_active: true, win_count: 0, use_count: 0 }).select("id,name,slug").single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, template: data });
}

export async function PATCH(req: NextRequest) {
    if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const { id, ...updates } = await req.json();
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const sb = getSupabaseAdmin();
    const allowed = ['name','prompt_template','description','is_active','usage_slot','entity_type'];
    const filtered: Record<string,any> = {};
    for (const k of allowed) if (k in updates) filtered[k] = updates[k];
    if ('prompt_template' in filtered) {
        const { data: cur } = await sb.from("hc_prompt_templates").select("version").eq("id", id).single();
        filtered.version = (cur?.version ?? 0) + 1;
    }
    const { error } = await sb.from("hc_prompt_templates").update(filtered).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
    if (!ok(req)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const id = req.nextUrl.searchParams.get("id");
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("hc_prompt_templates").update({ is_active: false }).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ success: true, archived: true });
}
