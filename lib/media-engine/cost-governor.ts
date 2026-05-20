export type MediaMoneyPath =
  | "claim"
  | "sponsor"
  | "broker_post"
  | "training"
  | "data_product"
  | "adgrid"
  | "route_packet"
  | "partner_recruitment"
  | "press_link"
  | "none";

export type MediaSourceType =
  | "supabase_data"
  | "existing_page"
  | "livekit_transcript"
  | "ugc_upload"
  | "official_source"
  | "manual_script";

export type MediaAssetType =
  | "video"
  | "short"
  | "voiceover"
  | "translation"
  | "thumbnail"
  | "image_alt"
  | "transcript"
  | "ocr"
  | "embedding"
  | "linkable_asset";

export type MediaEngine =
  | "text_image"
  | "remotion"
  | "hyperframes"
  | "fly_hf_tts"
  | "fly_hf_transcription"
  | "fly_hf_ocr"
  | "fly_hf_embeddings"
  | "heygen_tts"
  | "heygen_avatar"
  | "manual_review";

export interface MediaCostGovernorInput {
  assetType: MediaAssetType;
  sourceType: MediaSourceType;
  moneyPath?: MediaMoneyPath;
  humanNeededScore?: number;
  expectedValueCents?: number;
  estimatedCostCents?: number;
  requiresAvatar?: boolean;
  requiresVoice?: boolean;
  premiumVoiceRequested?: boolean;
  isTranslation?: boolean;
  winnerSignal?: boolean;
  manualApproval?: boolean;
  canUseTextOrImage?: boolean;
  canUsePageCapture?: boolean;
  canUseStructuredData?: boolean;
  regulatoryOrSafetyClaim?: boolean;
}

export interface MediaCostDecision {
  allowed: boolean;
  engine: MediaEngine;
  requiresManualApproval: boolean;
  blockedReasons: string[];
  reasons: string[];
  roiMultiple: number | null;
  requiredPacket: string[];
}

const DEFAULT_PACKET = [
  "media_asset_ledger_row",
  "money_path",
  "cta",
  "tracking_utm",
  "source_page_or_source_record",
];

const VIDEO_PACKET = [
  "transcript",
  "captions",
  "thumbnail_url",
  "VideoObject_schema",
  "watch_page",
  "sitemap_or_video_sitemap_entry",
  "internal_links",
  "LiveKit_escalation_cta",
];

function clampScore(score: number | undefined): number {
  if (!Number.isFinite(score)) return 0;
  return Math.max(0, Math.min(100, Math.round(score ?? 0)));
}

function roi(expectedValueCents = 0, estimatedCostCents = 0): number | null {
  if (!estimatedCostCents || estimatedCostCents <= 0) return null;
  return Math.round((expectedValueCents / estimatedCostCents) * 100) / 100;
}

function hasMoneyPath(path: MediaMoneyPath | undefined): boolean {
  return Boolean(path && path !== "none");
}

function packetFor(input: MediaCostGovernorInput): string[] {
  const packet = new Set(DEFAULT_PACKET);

  if (["video", "short", "translation", "voiceover"].includes(input.assetType)) {
    VIDEO_PACKET.forEach((item) => packet.add(item));
  }

  if (input.regulatoryOrSafetyClaim || input.sourceType === "official_source") {
    packet.add("source_list");
    packet.add("last_verified_at");
    packet.add("verify_before_dispatch_disclaimer");
  }

  if (input.moneyPath === "press_link" || input.assetType === "linkable_asset") {
    packet.add("methodology");
    packet.add("embed_code");
    packet.add("share_button");
    packet.add("journalist_pitch_angle");
  }

  return Array.from(packet);
}

export function evaluateMediaJob(input: MediaCostGovernorInput): MediaCostDecision {
  const humanNeededScore = clampScore(input.humanNeededScore);
  const roiMultiple = roi(input.expectedValueCents, input.estimatedCostCents);
  const reasons: string[] = [];
  const blockedReasons: string[] = [];
  const requiredPacket = packetFor(input);
  const moneyPathPresent = hasMoneyPath(input.moneyPath);

  if (input.isTranslation && !input.winnerSignal) {
    blockedReasons.push("paid_translation_requires_winner_signal");
  }

  if ((input.requiresAvatar || input.premiumVoiceRequested || input.isTranslation) && !moneyPathPresent) {
    blockedReasons.push("paid_media_requires_money_path");
  }

  if (input.requiresAvatar) {
    if (humanNeededScore < 80) blockedReasons.push("avatar_requires_human_needed_score_80");
    if (roiMultiple !== null && roiMultiple < 25 && !input.manualApproval) {
      blockedReasons.push("avatar_requires_25x_roi_or_manual_approval");
    }

    return {
      allowed: blockedReasons.length === 0,
      engine: blockedReasons.length === 0 ? "heygen_avatar" : "manual_review",
      requiresManualApproval: !input.manualApproval,
      blockedReasons,
      reasons: [
        "HeyGen avatar is reserved for high-trust conversion moments",
        `human_needed_score=${humanNeededScore}`,
        ...reasons,
      ],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.premiumVoiceRequested) {
    if (humanNeededScore < 50) blockedReasons.push("premium_voice_requires_human_needed_score_50");
    if (roiMultiple !== null && roiMultiple < 25 && !input.manualApproval) {
      blockedReasons.push("premium_voice_requires_25x_roi_or_manual_approval");
    }

    return {
      allowed: blockedReasons.length === 0,
      engine: blockedReasons.length === 0 ? "heygen_tts" : "fly_hf_tts",
      requiresManualApproval: Boolean(blockedReasons.length && !input.manualApproval),
      blockedReasons,
      reasons: ["voice-only is cheaper than avatar when a face is not required", `human_needed_score=${humanNeededScore}`],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.requiresVoice || input.assetType === "voiceover") {
    return {
      allowed: true,
      engine: "fly_hf_tts",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["open-source or low-cost TTS should be tried before paid avatar generation"],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.assetType === "transcript") {
    return {
      allowed: true,
      engine: "fly_hf_transcription",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["transcription is a Fly/Hugging Face utility job, not a premium video job"],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.assetType === "ocr") {
    return {
      allowed: true,
      engine: "fly_hf_ocr",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["OCR should run as cheap worker utility before any paid media step"],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.assetType === "embedding") {
    return {
      allowed: true,
      engine: "fly_hf_embeddings",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["embeddings power FAQ, LiveKit, and linkable asset clustering"],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.canUseTextOrImage && !input.requiresVoice) {
    return {
      allowed: true,
      engine: "text_image",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["text or image can solve the user job before video spend"],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.sourceType === "existing_page" || input.canUsePageCapture) {
    return {
      allowed: true,
      engine: "hyperframes",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["HyperFrames is preferred for existing page, funnel, or UI capture"],
      roiMultiple,
      requiredPacket,
    };
  }

  if (input.sourceType === "supabase_data" || input.canUseStructuredData) {
    return {
      allowed: true,
      engine: "remotion",
      requiresManualApproval: false,
      blockedReasons,
      reasons: ["Remotion is preferred for structured Supabase-driven media at scale"],
      roiMultiple,
      requiredPacket,
    };
  }

  return {
    allowed: true,
    engine: "remotion",
    requiresManualApproval: false,
    blockedReasons,
    reasons: ["Remotion is the default volume engine when no premium human layer is needed"],
    roiMultiple,
    requiredPacket,
  };
}

export function assertPaidProviderAllowed(input: MediaCostGovernorInput): MediaCostDecision {
  const decision = evaluateMediaJob(input);
  if (!decision.allowed) return decision;

  if (!["heygen_avatar", "heygen_tts"].includes(decision.engine)) {
    return {
      ...decision,
      allowed: false,
      blockedReasons: [...decision.blockedReasons, "paid_provider_not_selected_by_cost_governor"],
    };
  }

  return decision;
}
