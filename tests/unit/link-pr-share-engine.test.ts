import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildEmbedAttribution,
  buildJournalistModePrompt,
  buildShareUrl,
  classifyPrSourcePlatform,
  normalizeCountryCodes,
  scoreLinkableAsset,
  validateOutreachGuardrails,
} from "@/lib/growth/link-pr-share-engine";

const migration = readFileSync(join(process.cwd(), "supabase/migrations/20260520190007_link_pr_share_engine.sql"), "utf8");

describe("Link + PR + Share Engine", () => {
  it("adds the link/PR/share bridge tables with RLS and no destructive SQL", () => {
    const tables = [
      "hc_linkable_assets",
      "hc_linkable_asset_media_variants",
      "hc_share_embed_widgets",
      "hc_journalist_relationships",
      "hc_pr_request_tracker",
      "hc_podcast_placements",
      "hc_link_pr_outreach_events",
      "hc_link_pr_attribution_events",
    ];

    for (const table of tables) {
      expect(migration).toContain(`create table if not exists public.${table}`);
      expect(migration).toContain(`alter table public.${table} enable row level security`);
    }

    expect(migration.toLowerCase()).not.toContain("drop table");
    expect(migration.toLowerCase()).not.toContain("security definer");
    expect(migration).toContain("with (security_invoker = true)");
    expect(migration).toContain("hc_linkable_assets_publishable_requires_substance");
    expect(migration).toContain("hc_link_pr_outreach_no_mass_generic");
  });

  it("scores linkable assets only when source-backed and shareable", () => {
    const thin = scoreLinkableAsset({
      sourceConfidence: 45,
      sourceUrlCount: 0,
      hasMethodology: false,
      hasShortVideo: false,
      hasEmbedCode: false,
      hasShareButton: false,
    });

    expect(thin.publishable).toBe(false);
    expect(thin.missing).toEqual([
      "source_confidence_below_60",
      "source_list_required",
      "methodology_required",
      "shareable_or_embeddable_format_required",
    ]);

    const strong = scoreLinkableAsset({
      sourceConfidence: 88,
      sourceUrlCount: 4,
      hasMethodology: true,
      hasDownloadableImage: true,
      hasShortVideo: true,
      hasYoutubeVideo: true,
      hasEmbedCode: true,
      hasShareButton: true,
      hasFaq: true,
      hasQuoteSheet: true,
      countrySpecific: true,
      roleSpecific: true,
      corridorSpecific: true,
      journalistPitchAngle: "Why pilot-car support gaps affect wind and construction corridors.",
      podcastTalkingPointCount: 5,
    });

    expect(strong.publishable).toBe(true);
    expect(strong.linkabilityScore).toBeGreaterThanOrEqual(90);
    expect(strong.shareabilityScore).toBe(100);
  });

  it("rejects generic outreach, direct cold link asks, and unverified claims", () => {
    expect(
      validateOutreachGuardrails({
        message: "Great post. Can you add our link?",
        personalizedContext: "Nice article.",
        asksForLinkDirectly: true,
        hasPriorInteraction: false,
        hasSourceBackedAsset: false,
      }),
    ).toMatchObject({
      allowed: false,
      status: "rejected",
      reasons: expect.arrayContaining([
        "personalized_context_required",
        "generic_or_link_scheme_language",
        "direct_link_ask_requires_prior_interaction",
        "source_backed_asset_required",
      ]),
    });

    expect(
      validateOutreachGuardrails({
        message: "Haul Command is the largest and most trusted network.",
        personalizedContext: "Your recent abnormal-load safety piece mentioned escort visibility, and this source-backed map gives a country-specific visual follow-up.",
        includesUnverifiedClaim: true,
        hasSourceBackedAsset: true,
      }),
    ).toMatchObject({ allowed: false, status: "needs_human_review" });
  });

  it("approves relationship-first source-backed outreach", () => {
    expect(
      validateOutreachGuardrails({
        message: "Your recent article on permit delays mentioned escort availability. We built a source-backed corridor snapshot you can cite if useful.",
        personalizedContext: "The article focused on infrastructure delay and abnormal-load route planning, which matches this public corridor and regulation asset.",
        hasPriorInteraction: true,
        asksForLinkDirectly: false,
        hasSourceBackedAsset: true,
        relationshipStage: "warmed",
      }),
    ).toEqual({ allowed: true, status: "approved", reasons: [] });
  });

  it("builds share and embed attribution with UTM and clean source credit", () => {
    const shareUrl = buildShareUrl({
      canonicalUrl: "https://haulcommand.com/assets/high-pole-visual-guide",
      title: "High Pole Visual Guide",
      campaign: "high_pole_visual_guide",
      content: "copy_link",
    });

    expect(shareUrl).toBe(
      "https://haulcommand.com/assets/high-pole-visual-guide?utm_source=share_widget&utm_medium=earned&utm_campaign=high_pole_visual_guide&utm_content=copy_link",
    );
    expect(
      buildEmbedAttribution({
        assetTitle: "High Pole Visual Guide",
        canonicalUrl: "https://haulcommand.com/assets/high-pole-visual-guide",
        nofollow: true,
      }),
    ).toBe('<a href="https://haulcommand.com/assets/high-pole-visual-guide" rel="nofollow noopener">High Pole Visual Guide - Haul Command</a>');
  });

  it("normalizes global PR platforms and countries", () => {
    expect(classifyPrSourcePlatform("HARO by Featured")).toBe("haro_featured");
    expect(classifyPrSourcePlatform("Qwoted")).toBe("qwoted");
    expect(classifyPrSourcePlatform("Source of Sources")).toBe("source_of_sources");
    expect(classifyPrSourcePlatform("Trucking Podcast")).toBe("podcast");
    expect(normalizeCountryCodes(["us", "CA", "AUS", "br", ""])).toEqual(["BR", "CA", "US"]);
  });

  it("provides LiveKit journalist-mode prompts by intent", () => {
    expect(buildJournalistModePrompt("quote")).toContain("Need a quote?");
    expect(buildJournalistModePrompt("data")).toContain("Need data?");
    expect(buildJournalistModePrompt("source")).toContain("Need a source?");
    expect(buildJournalistModePrompt("visual")).toContain("Need a visual?");
    expect(buildJournalistModePrompt()).toContain("quote, data, a source/operator, or a visual");
  });
});
