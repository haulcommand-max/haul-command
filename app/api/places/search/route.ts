/**
 * app/api/places/search/route.ts
 *
 * Server-side proxy for HC Ask place searches.
 * GUARDRAILS:
 *   - API key is NEVER exposed to client — all Google API calls go through here.
 *   - Validates request body before forwarding to Places API.
 *   - Rate-limit friendly: relies on lib/google-places in-process cache.
 */

import { NextRequest, NextResponse } from "next/server";
import { textSearch, nearbySearch, CHIP_TYPE_MAP, type ViewportBounds, type LatLng } from "@/lib/google-places";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { mode, query, bounds, location, radiusMeters, chip, maxResults } = body;

    // ── Chip shortcut: map to nearbySearch with includedTypes ──────────────
    if (chip && location) {
      const types = CHIP_TYPE_MAP[chip as string];
      if (!types) {
        return NextResponse.json({ error: `Unknown chip type: ${chip}` }, { status: 400 });
      }
      const places = await nearbySearch({
        location: location as LatLng,
        includedTypes: types,
        radiusMeters: radiusMeters ?? 50_000,
        maxResults: maxResults ?? 10,
      });
      return NextResponse.json({ places });
    }

    // ── Text search (primary) ──────────────────────────────────────────────
    if (mode === "text" || (!mode && query)) {
      if (!query || typeof query !== "string" || query.trim().length < 2) {
        return NextResponse.json({ error: "Query too short." }, { status: 400 });
      }
      const places = await textSearch({
        query: query.trim(),
        bounds: bounds as ViewportBounds | undefined,
        maxResults: maxResults ?? 10,
      });
      return NextResponse.json({ places });
    }

    // ── Nearby search (when caller sends lat/lng directly) ─────────────────
    if (mode === "nearby" && location) {
      const places = await nearbySearch({
        location: location as LatLng,
        radiusMeters: radiusMeters ?? 50_000,
        maxResults: maxResults ?? 10,
      });
      return NextResponse.json({ places });
    }

    return NextResponse.json({ error: "Invalid request parameters." }, { status: 400 });
  } catch (err: any) {
    console.error("[HC Ask] /api/places/search error:", err);
    // Don't leak API key or internal details
    const message = err?.message?.includes("GOOGLE_PLACES_API_KEY")
      ? "Places API is not configured."
      : err?.message ?? "Search failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
