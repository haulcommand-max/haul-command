export interface VideoSeoPacketInput {
  assetId?: string;
  title?: string;
  watchPageUrl?: string;
  videoUrl?: string;
  thumbnailUrl?: string;
  transcript?: string;
  captionsUrl?: string;
  cta?: string;
  internalLinks?: string[];
  schemaStatus?: "missing" | "draft" | "ready";
  sitemapStatus?: "missing" | "queued" | "submitted";
  liveKitEscalation?: string;
}

export interface VideoSeoPacketAudit {
  ready: boolean;
  missing: string[];
  warnings: string[];
}

export function auditVideoSeoPacket(input: VideoSeoPacketInput): VideoSeoPacketAudit {
  const missing: string[] = [];
  const warnings: string[] = [];

  if (!input.title) missing.push("title");
  if (!input.watchPageUrl) missing.push("watch_page_url");
  if (!input.videoUrl) missing.push("video_url");
  if (!input.thumbnailUrl) missing.push("thumbnail_url");
  if (!input.transcript) missing.push("transcript");
  if (!input.captionsUrl) warnings.push("captions_url_missing");
  if (!input.cta) missing.push("cta");
  if (!input.internalLinks?.length) missing.push("internal_links");
  if (input.schemaStatus !== "ready") missing.push("VideoObject_schema_ready");
  if (input.sitemapStatus === "missing" || !input.sitemapStatus) missing.push("sitemap_status");
  if (!input.liveKitEscalation) warnings.push("livekit_escalation_missing");

  return {
    ready: missing.length === 0,
    missing,
    warnings,
  };
}
