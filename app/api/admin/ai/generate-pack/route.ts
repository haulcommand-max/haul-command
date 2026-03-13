// app/api/admin/ai/generate-pack/route.ts
// One-click pack generation — generates one image per slot for a given entity
import { randomUUID } from "node:crypto";
import { gemini, HC_IMAGE_MODEL } from "@/lib/ai/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120;

const BUCKET = "hc-generated-images";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

function extFromMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

// Slot presets by entity type
const SLOT_PACKS: Record<string, Array<{ slot: string; promptSuffix: string }>> = {
  directory_listing: [
    { slot: "hero", promptSuffix: "wide cinematic hero banner, 16:9 aspect ratio, dramatic lighting" },
    { slot: "thumbnail", promptSuffix: "clean square thumbnail, centered composition, bold and simple" },
    { slot: "og", promptSuffix: "social media open graph preview image, 1200x630, clear text-safe zone" },
  ],
  broker_profile: [
    { slot: "hero", promptSuffix: "professional corporate hero banner, logistics theme, 16:9" },
    { slot: "logo", promptSuffix: "clean modern logo mark, white on dark, minimal" },
    { slot: "og", promptSuffix: "social preview image for a brokerage company page, 1200x630" },
  ],
  partner_profile: [
    { slot: "hero", promptSuffix: "industrial partnership banner, heavy equipment theme, 16:9" },
    { slot: "thumbnail", promptSuffix: "square partnership thumbnail, professional" },
  ],
  marketplace_item: [
    { slot: "hero", promptSuffix: "product showcase hero, bright commercial styling, 16:9" },
    { slot: "gallery", promptSuffix: "product detail photo, angled view, studio lighting" },
  ],
  social_campaign: [
    { slot: "post", promptSuffix: "social media post image, vibrant, catchy, 1:1 square" },
    { slot: "story", promptSuffix: "vertical story image, 9:16, bold text-safe layout" },
    { slot: "og", promptSuffix: "link preview image, 1200x630, clean" },
  ],
};

interface PackRequest {
  entity_type: string;
  entity_id: string;
  base_prompt: string;
  model?: string;
}

export async function POST(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: PackRequest = await req.json();

  const entityType = body.entity_type;
  const entityId = body.entity_id;
  const basePrompt = (body.base_prompt || "").trim();
  const model = body.model || HC_IMAGE_MODEL;

  if (!entityType || !entityId || !basePrompt) {
    return Response.json(
      { error: "entity_type, entity_id, and base_prompt are required" },
      { status: 400 }
    );
  }

  const slots = SLOT_PACKS[entityType] || SLOT_PACKS.directory_listing;
  const packGroupId = randomUUID();
  const results: Array<{ slot: string; asset?: any; error?: string }> = [];

  for (const { slot, promptSuffix } of slots) {
    const fullPrompt = `${basePrompt}\n\nStyle requirements: ${promptSuffix}`;

    try {
      const response = await gemini.models.generateContent({
        model,
        contents: fullPrompt,
        config: {
          responseModalities: ["TEXT", "IMAGE"],
        },
      });

      const parts = response?.candidates?.[0]?.content?.parts ?? [];
      let text: string | null = null;
      let inlineData: { data?: string; mimeType?: string } | null = null;

      for (const part of parts) {
        if ((part as any)?.text && !text) text = (part as any).text;
        if ((part as any)?.inlineData?.data && !inlineData) {
          inlineData = (part as any).inlineData;
        }
      }

      if (!inlineData?.data) {
        results.push({ slot, error: "No image returned" });
        continue;
      }

      const mimeType = inlineData.mimeType || "image/png";
      const ext = extFromMime(mimeType);
      const filePath = `packs/${entityType}/${entityId}/${packGroupId}/${slot}.${ext}`;
      const buffer = Buffer.from(inlineData.data, "base64");

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        results.push({ slot, error: uploadError.message });
        continue;
      }

      const { data: publicData } = supabaseAdmin.storage
        .from(BUCKET)
        .getPublicUrl(filePath);

      const { data: asset, error: insertError } = await supabaseAdmin
        .from("hc_generated_assets")
        .insert({
          source: "gemini",
          model,
          prompt: fullPrompt,
          kind: slot,
          entity_type: entityType,
          entity_id: entityId,
          storage_bucket: BUCKET,
          storage_path: filePath,
          public_url: publicData.publicUrl,
          mime_type: mimeType,
          notes: text,
          status: "draft",
          variant_group_id: packGroupId,
          variant_index: results.filter((r) => r.asset).length,
          usage_slot: slot,
          meta: { pack_group: packGroupId, pack_slot: slot },
        })
        .select()
        .single();

      if (insertError) {
        results.push({ slot, error: insertError.message });
        continue;
      }

      // Auto-attach
      await supabaseAdmin.from("hc_asset_entity_links").upsert(
        {
          asset_id: asset.id,
          entity_type: entityType,
          entity_id: entityId,
          usage_slot: slot,
          sort_order: 0,
          is_primary: false,
        },
        { onConflict: "asset_id,entity_type,entity_id" }
      );

      results.push({ slot, asset });
    } catch (err: any) {
      results.push({ slot, error: err.message || "Unknown error" });
    }
  }

  const successCount = results.filter((r) => r.asset).length;

  return Response.json({
    ok: successCount > 0,
    pack_group_id: packGroupId,
    total_slots: slots.length,
    generated: successCount,
    results,
  });
}
