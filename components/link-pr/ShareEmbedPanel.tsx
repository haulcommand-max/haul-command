"use client";

import { useMemo, useState } from "react";
import { Check, Copy, ExternalLink, Share2 } from "lucide-react";
import { buildEmbedAttribution, buildShareUrl } from "@/lib/growth/link-pr-share-engine";

type ShareEmbedPanelProps = {
  title: string;
  description: string;
  canonicalUrl: string;
  campaign: string;
  embedAvailable?: boolean;
  embedTitle?: string;
};

async function copyText(value: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
      return true;
    }
  } catch {
    return false;
  }
  return false;
}

export function ShareEmbedPanel({
  title,
  description,
  canonicalUrl,
  campaign,
  embedAvailable = false,
  embedTitle,
}: ShareEmbedPanelProps) {
  const [copied, setCopied] = useState<"share" | "embed" | null>(null);

  const shareUrl = useMemo(
    () =>
      buildShareUrl({
        canonicalUrl,
        title,
        campaign,
        content: "linkable_asset_panel",
      }),
    [canonicalUrl, campaign, title],
  );

  const embedAttribution = useMemo(
    () =>
      buildEmbedAttribution({
        assetTitle: embedTitle ?? title,
        canonicalUrl,
        nofollow: false,
      }),
    [canonicalUrl, embedTitle, title],
  );

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title, text: description, url: shareUrl });
        return;
      } catch {
        // Fall through to copy so the user still gets a useful result.
      }
    }

    if (await copyText(shareUrl)) {
      setCopied("share");
      window.setTimeout(() => setCopied(null), 1800);
    }
  };

  const handleCopyEmbed = async () => {
    if (await copyText(embedAttribution)) {
      setCopied("embed");
      window.setTimeout(() => setCopied(null), 1800);
    }
  };

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.035] p-5" aria-labelledby="asset-share-heading">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 id="asset-share-heading" className="text-lg font-semibold text-white">
            Share and Cite
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-white/65">
            Use the tracked public URL and attribution snippet when this asset is approved for pitching or embedding.
          </p>
        </div>
        <button
          type="button"
          onClick={handleNativeShare}
          className="inline-flex items-center justify-center gap-2 rounded-md border border-[#F1A91B]/40 bg-[#F1A91B] px-4 py-2 text-sm font-semibold text-[#0B0F14] transition hover:bg-[#d4950e]"
        >
          {copied === "share" ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
          {copied === "share" ? "Copied" : "Share"}
        </button>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">Tracked URL</span>
            <ExternalLink className="h-4 w-4 text-white/35" aria-hidden="true" />
          </div>
          <p className="break-all text-xs leading-5 text-white/70">{shareUrl}</p>
        </div>

        <div className="rounded-md border border-white/10 bg-[#0B0F14] p-4">
          <div className="mb-2 flex items-center justify-between gap-3">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] text-white/45">
              {embedAvailable ? "Embed attribution" : "Attribution snippet"}
            </span>
            <button
              type="button"
              onClick={handleCopyEmbed}
              className="inline-flex items-center gap-1 rounded border border-white/10 px-2 py-1 text-xs font-semibold text-white/70 transition hover:border-[#F1A91B]/50 hover:text-[#F1A91B]"
            >
              {copied === "embed" ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied === "embed" ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="block break-all text-xs leading-5 text-white/70">{embedAttribution}</code>
        </div>
      </div>
    </section>
  );
}
