import { registerRenderedVisualAsset } from "@/lib/media/register-rendered-visual-asset";

type MediaRenderJobRow = {
  id: string;
  object_type: string;
  object_id: string | null;
  object_label: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  corridor: string | null;
  role: string | null;
  language: string | null;
  locale: string | null;
  template_id: string;
  video_format: string;
  tone: string | null;
  source_page: string | null;
  script_hints: string[] | null;
  cta: string | null;
  priority: string | null;
  worker_attempts: number | null;
};

type RenderResponseBody = {
  external_job_id?: string | null;
  job_id?: string | null;
  storage_url?: string | null;
  thumbnail_url?: string | null;
  transcript?: string | null;
  schema_json?: Record<string, unknown> | null;
  social_caption?: string | null;
  performance_metrics?: Record<string, unknown> | null;
};

type SupabaseUpdateChain = {
  eq(column: string, value: string): Promise<{ error?: { message?: string; code?: string } | null }>;
};

type SupabaseQueryChain = {
  select(columns: string): SupabaseQueryChain;
  in(column: string, values: string[]): SupabaseQueryChain;
  lt(column: string, value: number): SupabaseQueryChain;
  order(column: string, options: { ascending: boolean }): SupabaseQueryChain;
  limit(limit: number): Promise<{ data?: MediaRenderJobRow[] | null; error?: { message?: string } | null }>;
  update(payload: Record<string, unknown>): SupabaseUpdateChain;
  insert(payload: Record<string, unknown>): Promise<{ error?: { message?: string; code?: string } | null }>;
};

type SupabaseMediaClient = {
  from(table: string): SupabaseQueryChain;
};

export interface MediaRenderWorkerOptions {
  limit?: number;
  supabase?: SupabaseMediaClient;
  rendererEndpoint?: string | null;
  rendererToken?: string | null;
  fetchImpl?: typeof fetch;
}

export interface MediaRenderWorkerResult {
  configured: boolean;
  scanned_count: number;
  submitted_count: number;
  visual_assets_registered: number;
  failed_count: number;
  skipped_count: number;
}

async function getDefaultSupabase() {
  const { getSupabaseAdmin } = await import("@/lib/supabase/admin");
  return getSupabaseAdmin() as unknown as SupabaseMediaClient;
}

export function buildHyperframesRenderPayload(job: MediaRenderJobRow) {
  return {
    job_id: job.id,
    object_type: job.object_type,
    object_id: job.object_id,
    object_label: job.object_label,
    country: job.country,
    region: job.region,
    city: job.city,
    corridor: job.corridor,
    role: job.role,
    language: job.language ?? "en",
    locale: job.locale,
    template_id: job.template_id,
    video_format: job.video_format,
    tone: job.tone,
    source_page: job.source_page,
    script_hints: job.script_hints ?? [],
    cta: job.cta,
    brand: "Haul Command",
  };
}

function endpointFromEnv() {
  return process.env.HYPERFRAMES_RENDER_ENDPOINT ?? process.env.MEDIA_RENDER_WORKER_URL ?? null;
}

function tokenFromEnv() {
  return process.env.HYPERFRAMES_RENDER_TOKEN ?? process.env.MEDIA_RENDER_WORKER_TOKEN ?? null;
}

export async function runMediaRenderWorker(options: MediaRenderWorkerOptions = {}): Promise<MediaRenderWorkerResult> {
  const supabase = options.supabase ?? await getDefaultSupabase();
  const limit = Math.min(Math.max(options.limit ?? 20, 1), 100);
  const rendererEndpoint = options.rendererEndpoint ?? endpointFromEnv();
  const rendererToken = options.rendererToken ?? tokenFromEnv();
  const fetcher = options.fetchImpl ?? fetch;

  const { data: jobs, error } = await supabase
    .from("hc_media_render_jobs")
    .select("id, object_type, object_id, object_label, country, region, city, corridor, role, language, locale, template_id, video_format, tone, source_page, script_hints, cta, priority, worker_attempts")
    .in("render_status", ["queued", "failed"])
    .lt("worker_attempts", 3)
    .order("created_at", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message ?? "Failed to load media render jobs.");

  const result: MediaRenderWorkerResult = {
    configured: Boolean(rendererEndpoint),
    scanned_count: (jobs ?? []).length,
    submitted_count: 0,
    visual_assets_registered: 0,
    failed_count: 0,
    skipped_count: 0,
  };

  if (!rendererEndpoint) {
    result.skipped_count = result.scanned_count;
    return result;
  }

  for (const job of jobs ?? []) {
    const attempts = job.worker_attempts ?? 0;

    const { error: claimError } = await supabase
      .from("hc_media_render_jobs")
      .update({ render_status: "rendering", worker_attempts: attempts + 1, last_worker_error: null })
      .eq("id", job.id);

    if (claimError) {
      result.failed_count += 1;
      continue;
    }

    try {
      const response = await fetcher(rendererEndpoint, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          ...(rendererToken ? { authorization: `Bearer ${rendererToken}` } : {}),
        },
        body: JSON.stringify(buildHyperframesRenderPayload(job)),
      });

      if (!response.ok) throw new Error(`Renderer returned ${response.status}`);

      const body = await response.json().catch(() => ({})) as RenderResponseBody;
      const visualAsset = await registerRenderedVisualAsset(supabase, job, {
        storage_url: body.storage_url,
        social_caption: body.social_caption,
        external_provider: "hyperframes",
      });
      await supabase
        .from("hc_media_render_jobs")
        .update({
          external_provider: "hyperframes",
          external_job_id: body.external_job_id ?? body.job_id ?? null,
          render_status: body.storage_url ? "rendered" : "rendering",
          storage_url: body.storage_url ?? null,
          thumbnail_url: body.thumbnail_url ?? null,
          transcript: body.transcript ?? null,
          schema_json: body.schema_json ?? {},
          social_caption: body.social_caption ?? null,
          performance_metrics: {
            ...(body.performance_metrics ?? {}),
            visual_asset_registered: visualAsset.ok === true,
            visual_asset_error: visualAsset.ok === true || visualAsset.skipped || visualAsset.ignored ? null : visualAsset.error,
          },
          last_worker_error: visualAsset.ok === true || visualAsset.skipped || visualAsset.ignored
            ? null
            : `Visual asset registration failed: ${visualAsset.error}`,
        })
        .eq("id", job.id);

      result.submitted_count += 1;
      if (visualAsset.ok) result.visual_assets_registered += 1;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown media renderer failure";
      await supabase
        .from("hc_media_render_jobs")
        .update({
          render_status: attempts + 1 >= 3 ? "failed" : "queued",
          last_worker_error: message.slice(0, 1000),
        })
        .eq("id", job.id);
      result.failed_count += 1;
    }
  }

  return result;
}
