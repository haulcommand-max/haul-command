import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { entity_id, surface_type, page_family, country_code, region_code, language_code } = body;

    if (!entity_id || !page_family) {
      return NextResponse.json(
        { ok: false, error: { code: "missing_fields", message: "entity_id and page_family required." } },
        { status: 400 }
      );
    }

    // 1. Fetch entity for slug and name
    const { data: entity } = await supabaseAdmin
      .from("hc_entities")
      .select("canonical_name, slug, entity_type, country_code, region_code")
      .eq("id", entity_id)
      .single();

    if (!entity) {
      return NextResponse.json(
        { ok: false, error: { code: "entity_not_found", message: "Entity not found." } },
        { status: 404 }
      );
    }

    const effectiveCountry = country_code || entity.country_code || "US";
    const effectiveRegion = region_code || entity.region_code || "";
    const effectiveLang = language_code || "en";

    // 2. Generate surface draft
    const slug = `${page_family}/${entity.slug || entity.canonical_name.toLowerCase().replace(/\s+/g, "-")}`;

    const { data: surface, error } = await supabaseAdmin
      .from("hc_page_surfaces")
      .insert({
        surface_type: surface_type || "entity_surface",
        entity_id,
        page_family,
        country_code: effectiveCountry,
        region_code: effectiveRegion,
        language_code: effectiveLang,
        slug,
        title: `${entity.canonical_name} — ${page_family.replace(/_/g, " ")}`,
        h1: entity.canonical_name,
        meta_description: `Find ${entity.canonical_name} — verified ${entity.entity_type.replace(/_/g, " ")} in ${effectiveRegion}, ${effectiveCountry}.`,
        rendering_mode: "standard",
        status: "draft",
      })
      .select("id, slug, status")
      .single();

    if (error) throw error;

    // 3. Enqueue internal link generation
    await supabaseAdmin.from("hc_agent_jobs").insert({
      agent_name: "internal_link_agent",
      job_type: "generate_link_slots",
      target_type: "surface",
      target_id: surface.id,
      priority: 120,
    });

    return NextResponse.json({
      ok: true,
      data: { surface_id: surface.id, slug: surface.slug, status: surface.status },
      meta: { server_time: new Date().toISOString() },
    });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: { code: "surface_generate_failed", message: e.message || "Surface generation failed." } },
      { status: 500 }
    );
  }
}
