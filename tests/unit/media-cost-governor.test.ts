import { describe, expect, it } from "vitest";
import { evaluateMediaJob } from "@/lib/media-engine/cost-governor";
import { scoreMediaOpportunity } from "@/lib/media-engine/opportunity-score";
import { auditVideoSeoPacket } from "@/lib/media-engine/video-seo-packet";
import { auditLinkableAsset } from "@/lib/media-engine/link-pr-share";

describe("Media Command Center cost governor", () => {
  it("blocks HeyGen avatar jobs without a money path and high human-needed score", () => {
    const decision = evaluateMediaJob({
      assetType: "video",
      sourceType: "manual_script",
      moneyPath: "none",
      humanNeededScore: 40,
      expectedValueCents: 5_000,
      estimatedCostCents: 200,
      requiresAvatar: true,
    });

    expect(decision.allowed).toBe(false);
    expect(decision.engine).toBe("manual_review");
    expect(decision.blockedReasons).toContain("paid_media_requires_money_path");
    expect(decision.blockedReasons).toContain("avatar_requires_human_needed_score_80");
  });

  it("allows avatar only for high-value manually approved conversion work", () => {
    const decision = evaluateMediaJob({
      assetType: "video",
      sourceType: "manual_script",
      moneyPath: "sponsor",
      humanNeededScore: 90,
      expectedValueCents: 25_000,
      estimatedCostCents: 500,
      requiresAvatar: true,
      manualApproval: true,
    });

    expect(decision.allowed).toBe(true);
    expect(decision.engine).toBe("heygen_avatar");
    expect(decision.roiMultiple).toBe(50);
    expect(decision.requiredPacket).toContain("VideoObject_schema");
  });

  it("routes structured data video volume to Remotion and page capture to HyperFrames", () => {
    expect(evaluateMediaJob({
      assetType: "short",
      sourceType: "supabase_data",
      canUseStructuredData: true,
      moneyPath: "training",
    }).engine).toBe("remotion");

    expect(evaluateMediaJob({
      assetType: "video",
      sourceType: "existing_page",
      canUsePageCapture: true,
      moneyPath: "claim",
    }).engine).toBe("hyperframes");
  });

  it("scores repeated questions and money paths into the priority queue", () => {
    const score = scoreMediaOpportunity({
      searchDemand: 90,
      moneyValue: 90,
      localSupplyGap: 80,
      countryTier: 80,
      trainingValue: 75,
      adGridValue: 80,
      claimLikelihood: 85,
      faqFrequency: 75,
      liveKitQuestionFrequency: 70,
      youtubePotential: 70,
      linkabilityScore: 70,
      shareabilityScore: 70,
    });

    expect(score.tier).toBe("priority");
    expect(score.reasons).toContain("strong_money_path");
    expect(score.reasons).toContain("claim_conversion_likely");
  });

  it("requires video SEO packets before serious publishing", () => {
    const audit = auditVideoSeoPacket({
      title: "High Pole Basics",
      videoUrl: "https://example.com/video.mp4",
      thumbnailUrl: "https://example.com/thumb.jpg",
      transcript: "Transcript",
      cta: "Find support",
      internalLinks: ["/training/high-pole"],
      schemaStatus: "ready",
      sitemapStatus: "queued",
    });

    expect(audit.ready).toBe(false);
    expect(audit.missing).toContain("watch_page_url");
  });

  it("treats linkable assets as source-backed share/embed products", () => {
    const audit = auditLinkableAsset({
      assetType: "corridor_snapshot",
      hasMethodology: true,
      hasSourceList: true,
      hasDownloadableImage: true,
      hasEmbedCode: true,
      hasShareButton: true,
      hasShortVideo: true,
      hasFaq: true,
      hasUtmAttribution: true,
      hasJournalistPitchAngle: true,
      noSpamGuardrails: true,
    });

    expect(audit.ready).toBe(true);
  });
});
