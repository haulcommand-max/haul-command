"use client";

/**
 * components/hc-ask/HCAskResults.tsx
 *
 * Renders the HC Ask result cards below the search strip.
 * GUARDRAILS:
 *   - "Open in Maps" uses a plain URL (no API key, no SDK).
 *   - No photos or review summaries requested (would trigger Preferred SKU).
 *   - Results are dismissible to clear both cards and map pins.
 */

import React from "react";
import type { HCPlace } from "@/lib/google-places";

interface HCAskResultsProps {
  places: HCPlace[];
  onClear: () => void;
  query: string;
}

export function HCAskResults({ places, onClear, query }: HCAskResultsProps) {
  if (places.length === 0) {
    return (
      <div className="hc-ask-empty" role="status" aria-live="polite">
        <span className="hc-ask-empty-icon" aria-hidden="true">🔍</span>
        <p>No results found for <strong>&ldquo;{query}&rdquo;</strong></p>
        <button
          type="button"
          id="hc-ask-clear-empty"
          onClick={onClear}
          className="hc-ask-clear-link"
        >
          Clear
        </button>
      </div>
    );
  }

  return (
    <div className="hc-ask-results" role="region" aria-label={`HC Ask results for "${query}"`}>
      <div className="hc-ask-results-header">
        <span className="hc-ask-results-count">{places.length} place{places.length !== 1 ? "s" : ""} found</span>
        <button
          type="button"
          id="hc-ask-clear-results"
          onClick={onClear}
          className="hc-ask-clear-link"
          aria-label="Clear search results and map pins"
        >
          ✕ Clear
        </button>
      </div>

      <div className="hc-ask-results-grid">
        {places.map((place, idx) => (
          <article key={place.id} className="hc-ask-card" aria-label={place.name}>
            <div className="hc-ask-card-header">
              <div className="hc-ask-card-pin" aria-hidden="true">{idx + 1}</div>
              <div className="hc-ask-card-info">
                <h4 className="hc-ask-card-name">{place.name}</h4>
                {place.address && (
                  <p className="hc-ask-card-address">{place.address}</p>
                )}
              </div>
              {place.rating && (
                <div className="hc-ask-card-rating" aria-label={`Rating: ${place.rating}`}>
                  <span aria-hidden="true">★</span> {place.rating.toFixed(1)}
                </div>
              )}
            </div>

            {place.hours && place.hours.length > 0 && (
              <details className="hc-ask-card-hours">
                <summary>Hours</summary>
                <ul>
                  {place.hours.map((h, i) => <li key={i}>{h}</li>)}
                </ul>
              </details>
            )}

            <div className="hc-ask-card-actions">
              {place.phone && (
                <a
                  href={`tel:${place.phone}`}
                  id={`hc-ask-call-${place.id}`}
                  className="hc-ask-card-action hc-ask-card-action--secondary"
                  aria-label={`Call ${place.name}`}
                >
                  📞 Call
                </a>
              )}
              {/* Maps URL handoff — no API key required per Google docs */}
              <a
                href={place.mapsUrl}
                id={`hc-ask-maps-${place.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="hc-ask-card-action hc-ask-card-action--primary"
                aria-label={`Open ${place.name} in Google Maps`}
              >
                ↗ Open in Maps
              </a>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
