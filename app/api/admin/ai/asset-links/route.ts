// app/api/admin/ai/asset-links/route.ts
// CRUD for hc_asset_entity_links — link / unlink / reorder assets ↔ entities
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

// POST — attach asset to entity
export async function POST(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();

  const assetId = body?.asset_id;
  const entityType = body?.entity_type;
  const entityId = body?.entity_id;
  const usageSlot = body?.usage_slot || "gallery";
  const sortOrder = typeof body?.sort_order === "number" ? body.sort_order : 0;
  const isPrimary = body?.is_primary ?? false;

  if (!assetId || !entityType || !entityId) {
    return Response.json(
      { error: "asset_id, entity_type, and entity_id are required" },
      { status: 400 }
    );
  }

  // If marking as primary, clear other primary for this entity+slot
  if (isPrimary) {
    await supabaseAdmin
      .from("hc_asset_entity_links")
      .update({ is_primary: false })
      .match({ entity_type: entityType, entity_id: entityId, usage_slot: usageSlot, is_primary: true });
  }

  const { data, error } = await supabaseAdmin
    .from("hc_asset_entity_links")
    .upsert(
      {
        asset_id: assetId,
        entity_type: entityType,
        entity_id: entityId,
        usage_slot: usageSlot,
        sort_order: sortOrder,
        is_primary: isPrimary,
      },
      { onConflict: "asset_id,entity_type,entity_id" }
    )
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, link: data });
}

// DELETE — unlink asset from entity
export async function DELETE(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const linkId = url.searchParams.get("id");

  if (!linkId) {
    return Response.json({ error: "id param is required" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("hc_asset_entity_links")
    .delete()
    .eq("id", linkId);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, deleted: linkId });
}

// PATCH — update link (set primary, change slot, reorder)
export async function PATCH(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const linkId = body?.id;

  if (!linkId) {
    return Response.json({ error: "id is required" }, { status: 400 });
  }

  const updates: Record<string, any> = {};

  if (typeof body.is_primary === "boolean") {
    // If setting primary, clear other primaries first
    if (body.is_primary) {
      const { data: linkRow } = await supabaseAdmin
        .from("hc_asset_entity_links")
        .select("entity_type,entity_id,usage_slot")
        .eq("id", linkId)
        .single();

      if (linkRow) {
        await supabaseAdmin
          .from("hc_asset_entity_links")
          .update({ is_primary: false })
          .match({
            entity_type: linkRow.entity_type,
            entity_id: linkRow.entity_id,
            usage_slot: linkRow.usage_slot,
            is_primary: true,
          });
      }
    }
    updates.is_primary = body.is_primary;
  }

  if (body.usage_slot) updates.usage_slot = body.usage_slot;
  if (typeof body.sort_order === "number") updates.sort_order = body.sort_order;

  if (Object.keys(updates).length === 0) {
    return Response.json({ error: "No updates provided" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin
    .from("hc_asset_entity_links")
    .update(updates)
    .eq("id", linkId)
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true, link: data });
}
