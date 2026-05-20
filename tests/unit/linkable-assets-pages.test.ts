import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import {
  canIndexLinkableAsset,
  getLinkableAssetScore,
  getLinkableAssets,
} from "@/lib/growth/linkable-asset-registry";

const libraryPage = readFileSync(join(process.cwd(), "app/linkable-assets/page.tsx"), "utf8");
const detailPage = readFileSync(join(process.cwd(), "app/linkable-assets/[slug]/page.tsx"), "utf8");
const sourceDeskPage = readFileSync(join(process.cwd(), "app/press/source-desk/page.tsx"), "utf8");
const shareEmbedPanel = readFileSync(join(process.cwd(), "components/link-pr/ShareEmbedPanel.tsx"), "utf8");

describe("Linkable asset public wiring", () => {
  it("registers the first 15 linkable asset briefs without indexing thin assets", () => {
    const assets = getLinkableAssets();
    expect(assets).toHaveLength(15);

    for (const asset of assets) {
      expect(asset.title.length).toBeGreaterThan(12);
      expect(asset.summary.length).toBeGreaterThan(60);
      expect(asset.methodologyNote.length).toBeGreaterThan(40);
      expect(asset.journalistPitchAngle.length).toBeGreaterThan(40);
      expect(asset.podcastTalkingPoints.length).toBeGreaterThanOrEqual(3);

      const score = getLinkableAssetScore(asset);
      if (asset.sourceUrls.length === 0 || asset.sourceConfidence < 60 || !score.publishable) {
        expect(canIndexLinkableAsset(asset)).toBe(false);
        expect(asset.indexabilityStatus).toBe("noindex");
      }
    }
  });

  it("keeps public pages noindexed until source confidence and methodology are ready", () => {
    expect(libraryPage).toContain("robots");
    expect(libraryPage).toContain("index: false");
    expect(detailPage).toContain("canIndexLinkableAsset(asset)");
    expect(detailPage).toContain("Noindex until sourced");
    expect(detailPage).toContain("Source list pending");
  });

  it("wires share and embed UI into the detail page with tracked URLs", () => {
    expect(detailPage).toContain("ShareEmbedPanel");
    expect(shareEmbedPanel).toContain("buildShareUrl");
    expect(shareEmbedPanel).toContain("buildEmbedAttribution");
    expect(shareEmbedPanel).toContain("content: \"linkable_asset_panel\"");
    expect(shareEmbedPanel).toContain("navigator.share");
  });

  it("adds a LiveKit-ready journalist source desk without claiming live voice is connected", () => {
    expect(libraryPage).toContain('data-livekit-mode="journalist-source-desk"');
    expect(libraryPage).toContain("Journalist Source Desk");
    expect(libraryPage).toContain("Need a quote");
    expect(libraryPage).toContain("Need data");
    expect(libraryPage).toContain("Need a source");
    expect(libraryPage).toContain("Need a visual");
    expect(libraryPage).toContain("LiveKit can attach");
    expect(sourceDeskPage).toContain('data-livekit-mode="journalist-source-desk"');
    expect(sourceDeskPage).toContain("Need a Quote");
    expect(sourceDeskPage).toContain("Need Data");
    expect(sourceDeskPage).toContain("Need a Source");
    expect(sourceDeskPage).toContain("Need a Visual");
    expect(sourceDeskPage).toContain("LiveKit voice intake can attach");
    expect(sourceDeskPage).not.toContain("LiveKit is connected");
    expect(sourceDeskPage).not.toContain("live agent is available");
  });

  it("blocks unsupported authority claims from the new public layer", () => {
    const combined = `${libraryPage}\n${detailPage}\n${sourceDeskPage}\n${shareEmbedPanel}`;
    expect(combined.toLowerCase()).not.toContain("guaranteed jobs");
    expect(combined.toLowerCase()).not.toContain("largest network");
    expect(combined.toLowerCase()).not.toContain("most trusted");
    expect(combined.toLowerCase()).not.toContain("verified demand");
  });
});
