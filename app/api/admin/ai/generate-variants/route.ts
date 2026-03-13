// app/api/admin/ai/generate-variants/route.ts
// Generate multiple image variants for an entity+slot using a template or raw prompt
import { randomUUID } from "node:crypto";
import { gemini, HC_IMAGE_MODEL } from "@/lib/ai/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 120; // variant generation can be slow

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

interface VariantRequest {
  entity_type: string;
  entity_id: string;
  usage_slot?: string;
  template_id?: string;
  prompt?: string;
  variant_count?: number;
  model?: string;
  auto_attach?: boolean;
}

export async function POST(req: Request) {
  if (!isAllowedAdminRequest(req)) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body: VariantRequest = await req.json();

  const entityType = body.entity_type;
  const entityId = body.entity_id;
  const usageSlot = body.usage_slot || "hero";
  const variantCount = Math.min(Math.max(body.variant_count || 3, 1), 6);
  const model = body.model || HC_IMAGE_MODEL;
  const autoAttach = body.auto_attach !== false;

  if (!entityType || !entityId) {
    return Response.json(
      { error: "entity_type and entity_id are required" },
      { status: 400 }
    );
  }

  // Resolve prompt from template or raw
  let promptText = body.prompt || "";
  let templateId: string | null = body.template_id || null;

  if (templateId) {
    const { data: tmpl } = await supabaseAdmin
      .from("hc_prompt_templates")
      .select("prompt_template, id")
      .eq("id", templateId)
      .single();

    if (!tmpl) {
      return Response.json({ error: "Template not found" }, { status: 404 });
    }

    promptText = tmpl.prompt_template;

    // Increment use_count directly
    await supabaseAdmin
      .from("hc_prompt_templates")
      .update({ use_count: ((tmpl as any).use_count || 0) + 1 })
      .eq("id", templateId);
  }

  if (!promptText.trim()) {
    return Response.json(
      { error: "prompt or template_id with valid template required" },
      { status: 400 }
    );
  }

  // Create the variant generation run
  const variantGroupId = randomUUID();

  const { data: run, error: runError } = await supabaseAdmin
    .from("hc_variant_generation_runs")
    .insert({
      entity_type: entityType,
      entity_id: entityId,
      usage_slot: usageSlot,
      template_id: templateId,
      prompt_used: promptText,
      variant_count: variantCount,
      status: "generating",
      model,
    })
    .select()
    .single();

  if (runError) {
    return Response.json({ error: runError.message }, { status: 500 });
  }

  // Generate variants sequentially (Gemini doesn't support batch images yet via this SDK)
  const assets: any[] = [];
  const errors: string[] = [];

  for (let i = 0; i < variantCount; i++) {
    try {
      // Add slight variation to prompt for diversity
      const variantPrompt =
        variantCount > 1
          ? `${promptText}\n\n[Variation ${i + 1} of ${variantCount}: create a unique visual interpretation]`
          : promptText;

      const response = await gemini.models.generateContent({
        model,
        contents: variantPrompt,
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
        errors.push(`Variant ${i + 1}: No image returned`);
        continue;
      }

      const mimeType = inlineData.mimeType || "image/png";
      const ext = extFromMime(mimeType);
      const filePath = `variants/${entityType}/${entityId}/${usageSlot}/${variantGroupId}/${i}.${ext}`;
      const buffer = Buffer.from(inlineData.data, "base64");

      const { error: uploadError } = await supabaseAdmin.storage
        .from(BUCKET)
        .upload(filePath, buffer, {
          contentType: mimeType,
          upsert: false,
          cacheControl: "3600",
        });

      if (uploadError) {
        errors.push(`Variant ${i + 1}: Upload failed — ${uploadError.message}`);
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
          prompt: promptText,
          kind: usageSlot,
          entity_type: entityType,
          entity_id: entityId,
          storage_bucket: BUCKET,
          storage_path: filePath,
          public_url: publicData.publicUrl,
          mime_type: mimeType,
          notes: text,
          status: "draft",
          template_id: templateId,
          variant_group_id: variantGroupId,
          variant_index: i,
          run_id: run.id,
          usage_slot: usageSlot,
          meta: { variant_of: variantGroupId },
        })
        .select()
        .single();

      if (insertError) {
        errors.push(`Variant ${i + 1}: DB insert failed — ${insertError.message}`);
        continue;
      }

      // Auto-attach to entity
      if (autoAttach && asset) {
        await supabaseAdmin.from("hc_asset_entity_links").upsert(
          {
            asset_id: asset.id,
            entity_type: entityType,
            entity_id: entityId,
            usage_slot: usageSlot,
            sort_order: i,
            is_primary: false,
          },
          { onConflict: "asset_id,entity_type,entity_id" }
        );
      }

      assets.push(asset);
    } catch (err: any) {
      errors.push(`Variant ${i + 1}: ${err.message || "Unknown error"}`);
    }
  }

  // Update run status
  const finalStatus = assets.length > 0 ? "completed" : "failed";
  await supabaseAdmin
    .from("hc_variant_generation_runs")
    .update({
      status: finalStatus,
      asset_ids: assets.map((a) => a.id),
      error_message: errors.length > 0 ? errors.join("; ") : null,
    })
    .eq("id", run.id);

  return Response.json({
    ok: assets.length > 0,
    variant_group_id: variantGroupId,
    run_id: run.id,
    generated: assets.length,
    requested: variantCount,
    assets,
    errors: errors.length > 0 ? errors : undefined,
  });
}
