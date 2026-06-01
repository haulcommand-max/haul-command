import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { MEDIA_RENDER_STATUSES } from "@/lib/contracts/mediaRender";
import { registerRenderedVisualAsset } from "@/lib/media/register-rendered-visual-asset";

function isAuthorized(request: NextRequest) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) return false;
  return request.headers.get("authorization") === `Bearer ${cronSecret}`;
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ jobId: string }> }) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  }

  const { jobId } = await params;
  const body = await request.json();
  const status = typeof body.render_status === "string" ? body.render_status : body.status;

  if (status && !(MEDIA_RENDER_STATUSES as readonly string[]).includes(status)) {
    return NextResponse.json({ ok: false, error: "Invalid render_status" }, { status: 400 });
  }

  const update = {
    render_status: status,
    storage_url: body.storage_url ?? null,
    thumbnail_url: body.thumbnail_url ?? null,
    transcript: body.transcript ?? null,
    schema_json: body.schema_json ?? {},
    social_caption: body.social_caption ?? null,
    external_job_id: body.external_job_id ?? null,
    external_provider: body.external_provider ?? "hyperframes",
    performance_metrics: body.performance_metrics ?? {},
    last_worker_error: body.last_worker_error ?? null,
  };

  const supabase = getSupabaseAdmin();
  const { data: existingJob } = await supabase
    .from("hc_media_render_jobs")
    .select("id, object_type, object_id, object_label, country, region, city, corridor, role, language, locale, source_page, script_hints, cta")
    .eq("id", jobId)
    .single();

  const visualAsset = status === "rendered" && existingJob
    ? await registerRenderedVisualAsset(supabase, existingJob, {
      storage_url: body.storage_url ?? null,
      social_caption: body.social_caption ?? null,
      external_provider: body.external_provider ?? "hyperframes",
    })
    : { ok: false, skipped: true };

  const { data, error } = await supabase
    .from("hc_media_render_jobs")
    .update({
      ...update,
      performance_metrics: {
        ...(body.performance_metrics ?? {}),
        visual_asset_registered: visualAsset.ok === true,
        visual_asset_error: visualAsset.ok === true || visualAsset.skipped || visualAsset.ignored ? null : visualAsset.error,
      },
      last_worker_error: visualAsset.ok === true || visualAsset.skipped || visualAsset.ignored
        ? update.last_worker_error
        : `Visual asset registration failed: ${visualAsset.error}`,
    })
    .eq("id", jobId)
    .select("id, render_status, storage_url, thumbnail_url, updated_at")
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true, job: data });
}
