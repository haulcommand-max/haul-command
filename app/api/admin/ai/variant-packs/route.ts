// app/api/admin/ai/variant-packs/route.ts
// Variant pack management — list, filter, and manage generated image packs
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

/**
 * GET /api/admin/ai/variant-packs
 * Lists variant packs (grouped by variant_group_id) with filtering.
 */
export async function GET(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entity_type");
  const entityId = url.searchParams.get("entity_id");
  const status = url.searchParams.get("status");
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "20", 10), 100);
  const offset = parseInt(url.searchParams.get("offset") || "0", 10);

  let query = supabaseAdmin
    .from("hc_generated_assets")
    .select("*", { count: "exact" })
    .not("variant_group_id", "is", null)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (entityType) query = query.eq("entity_type", entityType);
  if (entityId) query = query.eq("entity_id", entityId);
  if (status) query = query.eq("status", status);

  const { data: assets, error, count } = await query;

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  // Group by variant_group_id
  const packs = new Map<string, { group_id: string; entity_type: string; entity_id: string; assets: any[]; created_at: string }>();
  for (const asset of (assets || [])) {
    const gid = asset.variant_group_id;
    if (!packs.has(gid)) {
      packs.set(gid, {
        group_id: gid,
        entity_type: asset.entity_type,
        entity_id: asset.entity_id,
        assets: [],
        created_at: asset.created_at,
      });
    }
    packs.get(gid)!.assets.push(asset);
  }

  return Response.json({
    packs: Array.from(packs.values()),
    total: count ?? 0,
    limit,
    offset,
  });
}

/**
 * POST /api/admin/ai/variant-packs
 * Bulk status update for a variant pack.
 */
export async function POST(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { group_id, status } = body;

  if (!group_id || !status) {
    return Response.json({ error: "group_id and status are required" }, { status: 400 });
  }

  const validStatuses = ["draft", "approved", "rejected", "archived"];
  if (!validStatuses.includes(status)) {
    return Response.json({ error: `Invalid status. Must be one of: ${validStatuses.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("hc_generated_assets")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("variant_group_id", group_id)
    .select("id, status, usage_slot");

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  if (status === "approved" && data && data.length > 0) {
    for (const asset of data) {
      await supabaseAdmin
        .from("hc_asset_entity_links")
        .update({ is_primary: true })
        .eq("asset_id", asset.id);
    }
  }

  return Response.json({
    ok: true,
    group_id,
    status,
    updated_count: data?.length ?? 0,
  });
}
