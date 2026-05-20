export interface LinkableAssetRequirementsInput {
  assetType: "data_page" | "visual_guide" | "calculator_result" | "report_card" | "training_badge" | "corridor_snapshot";
  hasMethodology?: boolean;
  hasSourceList?: boolean;
  hasDownloadableImage?: boolean;
  hasEmbedCode?: boolean;
  hasShareButton?: boolean;
  hasShortVideo?: boolean;
  hasFaq?: boolean;
  hasUtmAttribution?: boolean;
  hasJournalistPitchAngle?: boolean;
  noSpamGuardrails?: boolean;
}

export function auditLinkableAsset(input: LinkableAssetRequirementsInput) {
  const missing: string[] = [];

  if (!input.hasMethodology) missing.push("methodology");
  if (!input.hasSourceList) missing.push("source_list");
  if (!input.hasDownloadableImage) missing.push("downloadable_image");
  if (!input.hasEmbedCode) missing.push("embed_code");
  if (!input.hasShareButton) missing.push("share_button");
  if (!input.hasShortVideo) missing.push("short_video");
  if (!input.hasFaq) missing.push("faq");
  if (!input.hasUtmAttribution) missing.push("utm_attribution");
  if (!input.hasJournalistPitchAngle) missing.push("journalist_pitch_angle");
  if (!input.noSpamGuardrails) missing.push("no_spam_guardrails");

  return {
    ready: missing.length === 0,
    missing,
  };
}
