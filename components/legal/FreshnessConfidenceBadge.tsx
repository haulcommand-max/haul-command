// components/legal/FreshnessConfidenceBadge.tsx
// Displays legal confidence state with appropriate warnings
"use client";
import React from "react";
import { CONFIDENCE_DISPLAY, type LegalConfidence } from "@/lib/legal/freshness-confidence";

interface Props {
  confidence: LegalConfidence;
  lastVerified?: string | null;
  officialSource?: string | null;
  officialSourceUrl?: string | null;
  compact?: boolean;
}

export function FreshnessConfidenceBadge({
  confidence, lastVerified, officialSource, officialSourceUrl, compact = false,
}: Props) {
  const display = CONFIDENCE_DISPLAY[confidence];

  return (
    <div className="legal-freshness-badge" data-confidence={confidence}>
      <div className="legal-freshness-top">
        <span className="legal-freshness-icon">{display.icon}</span>
        <span className="legal-freshness-label" style={{ color: display.color }}>
          {display.label}
        </span>
        {lastVerified && (
          <span className="legal-freshness-date">
            Verified: <time dateTime={lastVerified}>{new Date(lastVerified).toLocaleDateString()}</time>
          </span>
        )}
      </div>

      {!compact && display.warning && (
        <p className="legal-freshness-warning">{display.warning}</p>
      )}

      {!compact && officialSource && (
        <p className="legal-freshness-source">
          Official source:{" "}
          {officialSourceUrl ? (
            <a href={officialSourceUrl} target="_blank" rel="noopener noreferrer">
              {officialSource}
            </a>
          ) : officialSource}
        </p>
      )}
    </div>
  );
}
