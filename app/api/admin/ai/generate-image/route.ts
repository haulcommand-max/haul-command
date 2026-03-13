// app/api/admin/ai/generate-image/route.ts
import { randomUUID } from "node:crypto";
import { gemini, HC_IMAGE_MODEL } from "@/lib/ai/gemini";
import { supabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const BUCKET = "hc-generated-images";

function isAllowedAdminRequest(req: Request) {
  const adminSecret = req.headers.get("x-hc-admin-secret");
  return adminSecret && adminSecret === process.env.HC_ADMIN_SECRET;
}

export async function POST(req: Request) {
  try {
    if (!isAllowedAdminRequest(req)) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();

    const prompt = String(body?.prompt || "").trim();
    const kind = String(body?.kind || "general").trim();
    const entityType = body?.entityType ? String(body.entityType) : null;
    const entityId = body?.entityId ? String(body.entityId) : null;
    const model = String(body?.model || HC_IMAGE_MODEL);

    if (!prompt) {
      return Response.json({ error: "Prompt is required" }, { status: 400 });
    }

    const response = await gemini.models.generateContent({
      model,
      contents: prompt,
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
      return Response.json(
        { error: "Gemini returned no image.", model, text },
        { status: 422 }
      );
    }

    const mimeType = inlineData.mimeType || "image/png";
    const ext =
      mimeType === "image/jpeg"
        ? "jpg"
        : mimeType === "image/webp"
        ? "webp"
        : "png";

    const filePath = `${kind}/${new Date().toISOString().slice(0, 10)}/${randomUUID()}.${ext}`;
    const buffer = Buffer.from(inlineData.data, "base64");

    const { error: uploadError } = await supabaseAdmin.storage
      .from(BUCKET)
      .upload(filePath, buffer, {
        contentType: mimeType,
        upsert: false,
        cacheControl: "3600",
      });

    if (uploadError) {
      return Response.json(
        { error: uploadError.message },
        { status: 500 }
      );
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
        storage_bucket: BUCKET,
        storage_path: filePath,
        public_url: publicUrl,
        mime_type: mimeType,
        notes: text,
        meta: {},
      })
      .select()
      .single();

    if (insertError) {
      return Response.json(
        { error: insertError.message, publicUrl, filePath },
        { status: 500 }
      );
    }

    return Response.json({ ok: true, asset: row, text });
  } catch (error: any) {
    return Response.json(
      { error: error?.message || "Unknown error" },
      { status: 500 }
    );
  }
}
