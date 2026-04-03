"use client";

import { useState } from "react";
import { Share2, Check } from "lucide-react";

interface ShareButtonProps {
  title?: string;
  text?: string;
  url?: string;
  context?: "directory" | "blog" | "tool" | "corridor";
}

export function ShareButton({ title, text, url, context = "directory" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    const shareData = {
      title: title || "Haul Command",
      text: text || "Check out this logistics intelligence from Haul Command.",
      url: url || window.location.href,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
        // Track analytics event: "share_intent"
        return;
      } catch (err) {
        console.warn("Share API failed, falling back to clipboard", err);
      }
    }

    // Fallback
    await navigator.clipboard.writeText(shareData.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      onClick={handleShare}
      className="inline-flex items-center gap-2 px-4 py-2 bg-neutral-900 border border-neutral-700 hover:border-neutral-500 rounded-lg text-sm font-medium text-neutral-300 transition-all focus:ring-2 focus:ring-white/20"
      aria-label="Share this page"
    >
      {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
      <span>{copied ? "Link Copied" : "Share"}</span>
    </button>
  );
}
