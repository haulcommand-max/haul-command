export type RenderedVisualAssetJob = {
  id: string;
  object_type: string;
  object_id?: string | null;
  object_label?: string | null;
  country?: string | null;
  region?: string | null;
  city?: string | null;
  corridor?: string | null;
  role?: string | null;
  language?: string | null;
  locale?: string | null;
  source_page?: string | null;
  script_hints?: string[] | null;
  cta?: string | null;
};

export type RenderedVisualAssetBody = {
  storage_url?: string | null;
  social_caption?: string | null;
  external_provider?: string | null;
};

type SupabaseInsertClient = {
  from(table: string): {
    insert(payload: Record<string, unknown>): Promise<{ error?: { message?: string; code?: string } | null }>;
  };
};

function isSchemaDriftError(error?: { message?: string; code?: string } | null) {
  const message = error?.message?.toLowerCase() ?? "";
  return (
    error?.code === "42P01" ||
    error?.code === "42703" ||
    message.includes("does not exist") ||
    message.includes("column")
  );
}

function visualAssetTypeForJob(job: RenderedVisualAssetJob) {
  if (["adgrid_sponsor", "house_ad", "sponsor_recap"].includes(job.object_type)) {
    return "sponsor_creative";
  }

  if (["trust_score", "operator_recap", "broker_recap", "data_product_report", "graphify_report"].includes(job.object_type)) {
    return "report_card_graphic";
  }

  return "hero_video";
}

function storagePathFromUrl(url: string) {
  try {
    const parsed = new URL(url);
    return parsed.pathname.replace(/^\/+/, "") || url;
  } catch {
    return url;
  }
}

function visualAssetAltText(job: RenderedVisualAssetJob) {
  const label = job.object_label ?? job.object_id ?? job.object_type;
  return `${label} ${job.object_type.replaceAll("_", " ")} video`;
}

export async function registerRenderedVisualAsset(
  supabase: SupabaseInsertClient,
  job: RenderedVisualAssetJob,
  body: RenderedVisualAssetBody,
) {
  if (!body.storage_url) return { ok: false, skipped: true };

  const { error } = await supabase.from("visual_assets").insert({
    asset_type: visualAssetTypeForJob(job),
    route: job.source_page,
    locale: job.locale ?? (job.language ? `${job.language}` : "en-US"),
    market: [job.country, job.region].filter(Boolean).join("-").toLowerCase() || job.country?.toLowerCase() || null,
    country_code: job.country,
    subdivision: job.region,
    city_slug: job.city,
    corridor_slug: job.corridor,
    role: job.role ?? job.object_type,
    prompt_hash: `media-render:${job.id}`,
    prompt_text: (job.script_hints ?? []).join("\n").slice(0, 4000),
    model_used: body.external_provider ?? "hyperframes",
    storage_path: storagePathFromUrl(body.storage_url),
    storage_bucket: "visual-assets",
    cdn_url: body.storage_url,
    format: body.storage_url.toLowerCase().includes(".mp4") ? "mp4" : "webp",
    alt_text: visualAssetAltText(job),
    caption: body.social_caption ?? job.cta ?? null,
    approval_status: "pending_review",
    is_monetizable: ["adgrid_sponsor", "house_ad", "sponsor_recap"].includes(job.object_type),
  });

  if (!error) return { ok: true };
  if (isSchemaDriftError(error)) return { ok: false, ignored: true, error: error.message };
  return { ok: false, error: error.message };
}
