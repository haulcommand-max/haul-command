"use client";

/**
 * components/hc-ask/HCAskStrip.tsx
 *
 * The main HC Ask utility bar — additive intelligence strip.
 *
 * GUARDRAILS:
 *   1. Directory context uses Haul Command directory search when no map/route context exists.
 *   2. Google Places calls happen only for explicit route/map place searches.
 *   3. Results are pinned to the EXISTING Mapbox map instance via HCAskMapBridge.
 *   4. Clearing results removes ONLY the HC Ask layer — Traccar and load pins untouched.
 *   5. Mobile: collapses to icon + slide-up panel below 768px.
 */

import React, { useState, useCallback, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { HCAskChips } from "./HCAskChips";
import { HCAskResults } from "./HCAskResults";
import type { HCPlace } from "@/lib/google-places";

interface HCAskStripProps {
  /** Context page — determines chip set and placeholder text */
  context?: "directory" | "corridor";
  /** Mapbox GL map instance — passed down so HC Ask can add/remove its own layer */
  mapInstance?: any; // mapbox-gl Map | null
  /** Current map viewport bounds — used to bias searches */
  viewportBounds?: {
    sw: { latitude: number; longitude: number };
    ne: { latitude: number; longitude: number };
  };
  /** User's current lat/lng — used for chip-based nearby queries */
  userLocation?: { latitude: number; longitude: number };
}

type State = "idle" | "loading" | "results" | "error";

const DIRECTORY_PLACEHOLDERS = [
  "Search pilot cars, escorts, permits, yards, repair, parking…",
  "Find high-pole escorts, route survey help, or staging support…",
  "Search truck stops, oversize parking, mobile mechanics, port support…",
  "Look up a role, company, city, country, route need, or support gap…",
];

const CORRIDOR_PLACEHOLDERS = [
  "Find fuel stops near this route…",
  "Show hotels with truck parking…",
  "Find weigh stations in this corridor…",
  "Search rest areas along I-40…",
];

const DIRECTORY_CATEGORY_MAP: Record<string, string> = {
  "Pilot Car Operators": "pilot-car",
  "Escort Vehicles": "escort",
  "High-Pole Escorts": "high-pole",
  "Permit Support": "permit",
  "Route Survey": "route-survey",
  "Traffic Control": "traffic-control",
  "Staging Yards": "staging",
  "Truck Stops": "truck-stop",
  "Oversize Parking": "parking",
  "Mobile Mechanics": "repair",
  "Port Support": "port",
  "Weigh Stations": "weigh-station",
};

export function HCAskStrip({
  context = "directory",
  mapInstance,
  viewportBounds,
  userLocation,
}: HCAskStripProps) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [state, setState] = useState<State>("idle");
  const [places, setPlaces] = useState<HCPlace[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isExpanded, setIsExpanded] = useState(false); // mobile expand
  const [placeholder, setPlaceholder] = useState(DIRECTORY_PLACEHOLDERS[0]);
  const inputRef = useRef<HTMLInputElement>(null);
  const placeholderIdx = useRef(0);

  // Rotate placeholder text every 4s for visual engagement.
  useEffect(() => {
    const rotations = context === "directory" ? DIRECTORY_PLACEHOLDERS : CORRIDOR_PLACEHOLDERS;
    placeholderIdx.current = 0;
    setPlaceholder(rotations[0]);
    const id = setInterval(() => {
      placeholderIdx.current = (placeholderIdx.current + 1) % rotations.length;
      setPlaceholder(rotations[placeholderIdx.current]);
    }, 4000);
    return () => clearInterval(id);
  }, [context]);

  const routeDirectorySearch = useCallback((searchQuery: string, chip?: string) => {
    const clean = (chip || searchQuery).trim();
    if (!clean) return;

    const params = new URLSearchParams();
    const category = chip ? DIRECTORY_CATEGORY_MAP[chip] : undefined;
    if (category) {
      params.set("category", category);
      params.set("q", clean);
    } else {
      params.set("q", clean);
    }

    router.push(`/directory?${params.toString()}`);
  }, [router]);

  // ── Map layer management ──────────────────────────────────────────────────

  const addMapPins = useCallback(
    (pins: HCPlace[]) => {
      if (!mapInstance) return;
      try {
        // Remove stale HC Ask layer/source if present
        if (mapInstance.getLayer("hc-ask-pins"))   mapInstance.removeLayer("hc-ask-pins");
        if (mapInstance.getLayer("hc-ask-labels"))  mapInstance.removeLayer("hc-ask-labels");
        if (mapInstance.getSource("hc-ask-places")) mapInstance.removeSource("hc-ask-places");

        const geojson = {
          type: "FeatureCollection" as const,
          features: pins.map((p, i) => ({
            type: "Feature" as const,
            geometry: { type: "Point" as const, coordinates: [p.location.longitude, p.location.latitude] },
            properties: {
              id: p.id,
              name: p.name,
              address: p.address,
              rating: p.rating ?? null,
              idx: i + 1,
              mapsUrl: p.mapsUrl,
            },
          })),
        };

        mapInstance.addSource("hc-ask-places", { type: "geojson", data: geojson });

        // HC Ask pins — teal, distinct from Traccar blue / load red
        mapInstance.addLayer({
          id: "hc-ask-pins",
          type: "circle",
          source: "hc-ask-places",
          paint: {
            "circle-radius": ["interpolate", ["linear"], ["zoom"], 4, 7, 10, 12],
            "circle-color": "#14B8A6",
            "circle-stroke-width": 2.5,
            "circle-stroke-color": "#ffffff",
            "circle-opacity": 0.92,
          },
        });

        // Numbered labels
        mapInstance.addLayer({
          id: "hc-ask-labels",
          type: "symbol",
          source: "hc-ask-places",
          layout: {
            "text-field": ["to-string", ["get", "idx"]],
            "text-size": 10,
            "text-anchor": "center",
          },
          paint: {
            "text-color": "#ffffff",
            "text-halo-color": "#14B8A6",
            "text-halo-width": 1,
          },
        });
      } catch (err) {
        console.warn("[HCAsk] Map pin error (non-fatal):", err);
      }
    },
    [mapInstance]
  );

  const clearMapPins = useCallback(() => {
    if (!mapInstance) return;
    try {
      if (mapInstance.getLayer("hc-ask-pins"))   mapInstance.removeLayer("hc-ask-pins");
      if (mapInstance.getLayer("hc-ask-labels"))  mapInstance.removeLayer("hc-ask-labels");
      if (mapInstance.getSource("hc-ask-places")) mapInstance.removeSource("hc-ask-places");
    } catch (_) {}
  }, [mapInstance]);

  // ── Query execution ────────────────────────────────────────────────────

  const executeSearch = useCallback(
    async (searchQuery: string, chip?: string) => {
      if (!searchQuery.trim() && !chip) return;

      // Directory pages already have Supabase/Typesense-backed results. Do not
      // call Google Places from a standalone directory search bar, because that
      // creates avoidable API cost/errors and ignores Haul Command's own data.
      if (context === "directory" && !mapInstance && !viewportBounds && !userLocation) {
        routeDirectorySearch(searchQuery, chip);
        return;
      }

      setState("loading");
      setError(null);

      try {
        const payload: Record<string, unknown> = { maxResults: 10 };

        if (chip && userLocation) {
          payload.chip = chip;
          payload.location = userLocation;
        } else if (chip && viewportBounds) {
          // Fall back to text search with chip label if no user location
          payload.mode = "text";
          payload.query = `${chip} near me`;
          payload.bounds = viewportBounds;
        } else {
          payload.mode = "text";
          payload.query = searchQuery.trim();
          if (viewportBounds) payload.bounds = viewportBounds;
        }

        const res = await fetch("/api/places/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error ?? "Search failed");
        }

        const { places: found } = await res.json();
        setPlaces(found ?? []);
        setState("results");
        addMapPins(found ?? []);
      } catch (err: any) {
        setError(err.message ?? "Search failed. Please try again.");
        setState("error");
      }
    },
    [context, mapInstance, viewportBounds, userLocation, routeDirectorySearch, addMapPins]
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      executeSearch(query);
    },
    [query, executeSearch]
  );

  const handleChip = useCallback(
    (label: string) => {
      setQuery(label);
      executeSearch(label, label);
    },
    [executeSearch]
  );

  const handleClear = useCallback(() => {
    setQuery("");
    setPlaces([]);
    setError(null);
    setState("idle");
    clearMapPins();
    inputRef.current?.focus();
  }, [clearMapPins]);

  const isLoading = state === "loading";
  const searchLabel = context === "directory"
    ? "Search Haul Command support directory"
    : "Ask HC about places near your route or region";

  // ── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      className={`hc-ask-strip${isExpanded ? " hc-ask-strip--expanded" : ""}`}
      id="hc-ask-strip"
      role="search"
      aria-label={searchLabel}
    >
      {/* Mobile toggle button */}
      <button
        type="button"
        id="hc-ask-mobile-toggle"
        className="hc-ask-mobile-toggle"
        onClick={() => setIsExpanded((v) => !v)}
        aria-expanded={isExpanded}
        aria-controls="hc-ask-panel"
      >
        <span className="hc-ask-mobile-toggle-icon" aria-hidden="true">🔍</span>
        <span>HC Ask</span>
        <span className="hc-ask-mobile-toggle-chevron" aria-hidden="true">
          {isExpanded ? "▲" : "▼"}
        </span>
      </button>

      {/* Main panel */}
      <div className="hc-ask-panel" id="hc-ask-panel">
        <form onSubmit={handleSubmit} className="hc-ask-form" noValidate>
          <div className="hc-ask-input-row">
            <span className="hc-ask-input-prefix" aria-hidden="true">🔍</span>
            <input
              ref={inputRef}
              id="hc-ask-input"
              type="search"
              className="hc-ask-input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={placeholder}
              aria-label={searchLabel}
              disabled={isLoading}
              autoComplete="off"
              spellCheck={false}
            />
            {query && (
              <button
                type="button"
                id="hc-ask-input-clear"
                className="hc-ask-input-clear"
                onClick={handleClear}
                aria-label="Clear query"
              >
                ✕
              </button>
            )}
            <button
              type="submit"
              id="hc-ask-submit"
              className="hc-ask-submit"
              disabled={isLoading || !query.trim()}
              aria-label="Search"
            >
              {isLoading ? (
                <span className="hc-ask-spinner" aria-hidden="true" />
              ) : (
                "Search"
              )}
            </button>
          </div>
        </form>

        <HCAskChips
          context={context}
          onChipSelect={handleChip}
          disabled={isLoading}
        />

        {/* Error state */}
        {state === "error" && error && (
          <div className="hc-ask-error" role="alert">
            <span aria-hidden="true">⚠️</span> {error}
            <button
              type="button"
              id="hc-ask-error-clear"
              onClick={handleClear}
              className="hc-ask-clear-link"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* Results */}
        {state === "results" && (
          <HCAskResults places={places} query={query} onClear={handleClear} />
        )}

        {/* Loading skeleton */}
        {isLoading && (
          <div className="hc-ask-loading" role="status" aria-live="polite">
            <div className="hc-ask-skeleton" />
            <div className="hc-ask-skeleton hc-ask-skeleton--short" />
            <div className="hc-ask-skeleton" />
          </div>
        )}

        {/* Attribution — required by Google Places ToS */}
        {state === "results" && places.length > 0 && (
          <p className="hc-ask-attribution" aria-label="Powered by Google Places">
            Results via Google Places · Traccar &amp; Mapbox unaffected
          </p>
        )}
      </div>
    </div>
  );
}
