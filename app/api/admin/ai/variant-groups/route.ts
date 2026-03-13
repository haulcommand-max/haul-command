// app/api/admin/ai/variant-groups/route.ts
// Actions on variant groups: make_primary, make_live, archive_losers, rollback
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

type ActionType =
  | "make_primary"
  | "make_live"
  | "archive_losers"
  | "rollback"
  | "move_slot"
  | "approve"
  | "reject";

interface VariantGroupAction {
  action: ActionType;
  asset_id?: string;
  variant_group_id?: string;
  entity_type?: string;
  entity_id?: string;
  usage_slot?: string;
  new_slot?: string;
  notes?: string;
}

export async function PATCH(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: VariantGroupAction = await req.json();
  const { action, asset_id, variant_group_id, entity_type, entity_id, usage_slot, new_slot, notes } = body;

  if (!action) {
    return Response.json({ error: "action is required" }, { status: 400 });
  }

  switch (action) {
    // ── Make Primary: set this asset as the primary for its entity+slot ──
    case "make_primary": {
      if (!asset_id) return Response.json({ error: "asset_id required" }, { status: 400 });

      const { data: asset } = await supabaseAdmin
        .from("hc_generated_assets")
        .select("id, entity_type, entity_id, usage_slot")
        .eq("id", asset_id)
        .single();

      if (!asset) return Response.json({ error: "Asset not found" }, { status: 404 });

      const eType = entity_type || asset.entity_type;
      const eId = entity_id || asset.entity_id;
      const eSlot = usage_slot || asset.usage_slot || "gallery";

      // Get current primary
      const { data: currentPrimary } = await supabaseAdmin
        .from("hc_asset_entity_links")
        .select("id, asset_id")
        .match({ entity_type: eType, entity_id: eId, usage_slot: eSlot, is_primary: true })
        .maybeSingle();

      // Clear current primary
      if (currentPrimary) {
        await supabaseAdmin
          .from("hc_asset_entity_links")
          .update({ is_primary: false })
          .eq("id", currentPrimary.id);
      }

      // Set new primary
      await supabaseAdmin.from("hc_asset_entity_links").upsert(
        {
          asset_id: asset_id,
          entity_type: eType,
          entity_id: eId,
          usage_slot: eSlot,
          is_primary: true,
          sort_order: 0,
        },
        { onConflict: "asset_id,entity_type,entity_id" }
      );

      // Store previous primary for rollback
      if (currentPrimary) {
        await supabaseAdmin
          .from("hc_generated_assets")
          .update({ previous_primary_id: currentPrimary.asset_id })
          .eq("id", asset_id);
      }

      // Record history
      await supabaseAdmin.from("hc_entity_media_history").insert({
        entity_type: eType,
        entity_id: eId,
        usage_slot: eSlot,
        action: "set_primary",
        old_asset_id: currentPrimary?.asset_id || null,
        new_asset_id: asset_id,
        notes,
      });

      // Record template win if applicable
      const { data: fullAsset } = await supabaseAdmin
        .from("hc_generated_assets")
        .select("template_id, run_id")
        .eq("id", asset_id)
        .single();

      if (fullAsset?.template_id) {
        await supabaseAdmin.from("hc_template_win_events").insert({
          template_id: fullAsset.template_id,
          asset_id: asset_id,
          run_id: fullAsset.run_id,
          entity_type: eType,
          entity_id: eId,
          usage_slot: eSlot,
          event_type: "selected_primary",
        });

        // Increment win_count
        const { data: tmpl } = await supabaseAdmin
          .from("hc_prompt_templates")
          .select("win_count")
          .eq("id", fullAsset.template_id)
          .single();

        if (tmpl) {
          await supabaseAdmin
            .from("hc_prompt_templates")
            .update({ win_count: (tmpl.win_count || 0) + 1 })
            .eq("id", fullAsset.template_id);
        }
      }

      return Response.json({ ok: true, action: "make_primary", asset_id });
    }

    // ── Make Live: approve and publish the asset ──
    case "make_live": {
      if (!asset_id) return Response.json({ error: "asset_id required" }, { status: 400 });

      await supabaseAdmin
        .from("hc_generated_assets")
        .update({ status: "published" })
        .eq("id", asset_id);

      const { data: asset } = await supabaseAdmin
        .from("hc_generated_assets")
        .select("entity_type, entity_id, usage_slot")
        .eq("id", asset_id)
        .single();

      if (asset) {
        await supabaseAdmin.from("hc_entity_media_history").insert({
          entity_type: asset.entity_type,
          entity_id: asset.entity_id,
          usage_slot: asset.usage_slot || "gallery",
          action: "make_live",
          new_asset_id: asset_id,
          notes,
        });
      }

      return Response.json({ ok: true, action: "make_live", asset_id });
    }

    // ── Archive Losers: archive all non-primary in a variant group ──
    case "archive_losers": {
      if (!variant_group_id)
        return Response.json({ error: "variant_group_id required" }, { status: 400 });

      // Get all assets in the group
      const { data: groupAssets } = await supabaseAdmin
        .from("hc_generated_assets")
        .select("id")
        .eq("variant_group_id", variant_group_id);

      if (!groupAssets || groupAssets.length === 0)
        return Response.json({ error: "No assets in group" }, { status: 404 });

      // Get primary asset IDs
      const { data: primaryLinks } = await supabaseAdmin
        .from("hc_asset_entity_links")
        .select("asset_id")
        .in("asset_id", groupAssets.map((a) => a.id))
        .eq("is_primary", true);

      const primaryIds = new Set((primaryLinks || []).map((l) => l.asset_id));
      const loserIds = groupAssets
        .map((a) => a.id)
        .filter((id) => !primaryIds.has(id));

      if (loserIds.length > 0) {
        await supabaseAdmin
          .from("hc_generated_assets")
          .update({ status: "archived", is_archived: true })
          .in("id", loserIds);
      }

      return Response.json({
        ok: true,
        action: "archive_losers",
        archived_count: loserIds.length,
        kept_count: primaryIds.size,
      });
    }

    // ── Rollback: revert to previous primary ──
    case "rollback": {
      if (!asset_id) return Response.json({ error: "asset_id required" }, { status: 400 });

      const { data: current } = await supabaseAdmin
        .from("hc_generated_assets")
        .select("id, previous_primary_id, entity_type, entity_id, usage_slot")
        .eq("id", asset_id)
        .single();

      if (!current?.previous_primary_id)
        return Response.json({ error: "No previous primary to rollback to" }, { status: 404 });

      const eType = current.entity_type;
      const eId = current.entity_id;
      const eSlot = current.usage_slot || "gallery";

      // Clear current primary
      await supabaseAdmin
        .from("hc_asset_entity_links")
        .update({ is_primary: false })
        .match({ entity_type: eType, entity_id: eId, usage_slot: eSlot });

      // Restore previous as primary
      await supabaseAdmin.from("hc_asset_entity_links").upsert(
        {
          asset_id: current.previous_primary_id,
          entity_type: eType,
          entity_id: eId,
          usage_slot: eSlot,
          is_primary: true,
          sort_order: 0,
        },
        { onConflict: "asset_id,entity_type,entity_id" }
      );

      // Record history
      await supabaseAdmin.from("hc_entity_media_history").insert({
        entity_type: eType,
        entity_id: eId,
        usage_slot: eSlot,
        action: "rollback",
        old_asset_id: asset_id,
        new_asset_id: current.previous_primary_id,
        notes: notes || "Rolled back to previous primary",
      });

      return Response.json({
        ok: true,
        action: "rollback",
        rolled_back_from: asset_id,
        rolled_back_to: current.previous_primary_id,
      });
    }

    // ── Move Slot: reassign asset to a different slot ──
    case "move_slot": {
      if (!asset_id || !new_slot)
        return Response.json({ error: "asset_id and new_slot required" }, { status: 400 });

      await supabaseAdmin
        .from("hc_generated_assets")
        .update({ usage_slot: new_slot })
        .eq("id", asset_id);

      await supabaseAdmin
        .from("hc_asset_entity_links")
        .update({ usage_slot: new_slot, is_primary: false })
        .eq("asset_id", asset_id);

      return Response.json({ ok: true, action: "move_slot", asset_id, new_slot });
    }

    // ── Approve / Reject ──
    case "approve": {
      if (!asset_id) return Response.json({ error: "asset_id required" }, { status: 400 });
      await supabaseAdmin.from("hc_generated_assets").update({ status: "approved" }).eq("id", asset_id);
      return Response.json({ ok: true, action: "approve", asset_id });
    }

    case "reject": {
      if (!asset_id) return Response.json({ error: "asset_id required" }, { status: 400 });
      await supabaseAdmin.from("hc_generated_assets").update({ status: "rejected" }).eq("id", asset_id);
      return Response.json({ ok: true, action: "reject", asset_id });
    }

    default:
      return Response.json({ error: `Unknown action: ${action}` }, { status: 400 });
  }
}

// GET — list variant groups with assets for an entity
export async function GET(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const entityType = url.searchParams.get("entityType");
  const entityId = url.searchParams.get("entityId");
  const variantGroupId = url.searchParams.get("variantGroupId");

  let qb = supabaseAdmin
    .from("hc_generated_assets")
    .select("*")
    .not("variant_group_id", "is", null)
    .order("variant_index", { ascending: true });

  if (entityType) qb = qb.eq("entity_type", entityType);
  if (entityId) qb = qb.eq("entity_id", entityId);
  if (variantGroupId) qb = qb.eq("variant_group_id", variantGroupId);

  const { data, error } = await qb.limit(200);

  if (error) return Response.json({ error: error.message }, { status: 500 });

  // Group by variant_group_id
  const groups: Record<string, any[]> = {};
  for (const asset of data || []) {
    const gid = asset.variant_group_id;
    if (!groups[gid]) groups[gid] = [];
    groups[gid].push(asset);
  }

  return Response.json({ groups });
}
