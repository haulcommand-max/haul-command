import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { normalizeMediaRenderRequest } from "@/lib/contracts/mediaRender";
import { createMediaRenderJob } from "@/lib/media/media-render-jobs";
import { requireInternalRequest } from "@/lib/security/internal-request-auth";

export async function POST(request: NextRequest) {
  const authFailure = requireInternalRequest(request);
  if (authFailure) return authFailure;

  try {
    const payload = normalizeMediaRenderRequest(await request.json());
    const job = await createMediaRenderJob(payload);
    return NextResponse.json({ ok: true, job });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to queue media render job.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  const authFailure = requireInternalRequest(request);
  if (authFailure) return authFailure;

  const jobId = request.nextUrl.searchParams.get("jobId");
  if (!jobId) return NextResponse.json({ ok: false, error: "jobId is required" }, { status: 400 });

  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("hc_media_render_jobs")
    .select("id, object_type, object_label, template_id, video_format, render_status, storage_url, thumbnail_url, transcript, social_caption, created_at, updated_at")
    .eq("id", jobId)
    .single();

  if (error) return NextResponse.json({ ok: false, error: error.message }, { status: 404 });
  return NextResponse.json({ ok: true, job: data });
}
