// app/api/admin/ai/edit-image/route.ts
import { randomUUID } from "node:crypto";
import { gemini } from "@/lib/ai/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "hc-generated-images";
const DEFAULT_MODEL = "gemini-2.0-flash-exp";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

function extFromMime(mimeType: string) {
  if (mimeType === "image/jpeg") return "jpg";
  if (mimeType === "image/webp") return "webp";
  return "png";
}

export async function POST(req: Request) {
  try {
    if (!isAllowedAdminRequest(req)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const form = await req.formData();

    const file = form.get("file");
    const prompt = String(form.get("prompt") || "").trim();
    const kind = String(form.get("kind") || "edited-image").trim();
    const model = String(form.get("model") || DEFAULT_MODEL).trim();

    const entityTypeRaw = form.get("entityType");
    const entityIdRaw = form.get("entityId");
    const sourceAssetIdRaw = form.get("sourceAssetId");

    const entityType = entityTypeRaw ? String(entityTypeRaw) : null;
    const entityId = entityIdRaw ? String(entityIdRaw) : null;
    const sourceAssetId = sourceAssetIdRaw ? String(sourceAssetIdRaw) : null;

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    if (!(file instanceof File)) {
      return Response.json({ error: "Image file is required" }, { status: 400 });
    }

    if (!file.type.startsWith("image/")) {
      return Response.json({ error: "Uploaded file must be an image" }, { status: 400 });
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer());
    const inputBase64 = inputBuffer.toString("base64");

    const response = await gemini.models.generateContent({
      model,
      contents: [
        { text: prompt },
        {
          inlineData: {
            mimeType: file.type,
            data: inputBase64,
          },
        },
      ],
      config: {
        responseModalities: ["TEXT", "IMAGE"],
      },
    });

    const parts = response?.candidates?.[0]?.content?.parts ?? [];

    let notes: string | null = null;
    let outputInlineData: { data?: string; mimeType?: string } | null = null;

    for (const part of parts) {
      if ((part as any)?.text && !notes) notes = (part as any).text;
      if ((part as any)?.inlineData?.data && !outputInlineData) {
        outputInlineData = (part as any).inlineData;
      }
    }

    if (!outputInlineData?.data) {
      return Response.json(
        { error: "Gemini returned no edited image.", model, notes },
        { status: 422 }
      );
    }

    const outputMimeType = outputInlineData.mimeType || "image/png";
    const ext = extFromMime(outputMimeType);
    const filePath = `${kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const outputBuffer = Buffer.from(outputInlineData.data, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, outputBuffer, {
        contentType: outputMimeType,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicData } = supabaseAdmin.storage
      .from(BUCKET)
      .getPublicUrl(filePath);

    const publicUrl = publicData.publicUrl;

    const { data: row, error: insertError } = await supabaseAdmin
      .from("hc_generated_assets")
      .insert({
        source: "gemini",
        model,
        prompt,
        kind,
        entity_type: entityType,
        entity_id: entityId,
        source_asset_id: sourceAssetId,
        storage_bucket: BUCKET,
        storage_path: filePath,
        public_url: publicUrl,
        mime_type: outputMimeType,
        notes,
        meta: {
          input_filename: file.name,
          input_mime_type: file.type,
          input_size_bytes: file.size,
          action: "edit-image",
        },
      })
      .select()
      .single();

    if (insertError) {
      return Response.json(
        { error: insertError.message, publicUrl, filePath },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, asset: row, notes });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
