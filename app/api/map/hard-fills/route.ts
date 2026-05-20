export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import {
  buildHardFillFeatureCollection,
  emptyHardFillFeatureCollection,
  type HardFillIntelRow,
} from "@/lib/maps/hard-fill-features";
import type { Database } from "@/types/supabase";

type LoadMapRow = Pick<
  Database["public"]["Tables"]["loads"]["Row"],
  "id" | "title" | "origin_lat" | "origin_lng" | "origin_city" | "origin_state" | "status"
>;

const DEFAULT_LABELS = ["Critical", "High", "Medium"];
const MAX_LIMIT = 200;

function normalizeLimit(value: string | null): number {
  const parsed = Number(value ?? 100);
  if (!Number.isFinite(parsed) || parsed <= 0) return 100;
  return Math.min(Math.trunc(parsed), MAX_LIMIT);
}

function normalizeLabels(value: string | null): string[] {
  if (!value) return DEFAULT_LABELS;

  const labels = value
    .split(",")
    .map((label) => label.trim())
    .filter(Boolean);

  return labels.length > 0 ? labels.slice(0, DEFAULT_LABELS.length + 1) : DEFAULT_LABELS;
}

function geoJsonResponse(
  body: ReturnType<typeof emptyHardFillFeatureCollection> | ReturnType<typeof buildHardFillFeatureCollection>,
) {
  return NextResponse.json(body, {
    headers: {
      "Cache-Control": "public, s-maxage=30, stale-while-revalidate=120",
      "Access-Control-Allow-Origin": "*",
    },
  });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const limit = normalizeLimit(searchParams.get("limit"));
  const labels = normalizeLabels(searchParams.get("labels"));
  const state = searchParams.get("state")?.trim();

  try {
    const supabase = getSupabaseAdmin();
    let intelQuery = supabase
      .from("hard_fill_intelligence")
      .select("load_id,computed_at,hard_fill_risk_score_01,hard_fill_label,top_reasons")
      .in("hard_fill_label", labels)
      .order("hard_fill_risk_score_01", { ascending: false })
      .limit(limit);

    const { data: intelData, error: intelError } = await intelQuery;
    if (intelError) return geoJsonResponse(emptyHardFillFeatureCollection("source_error"));

    const intelRows = (intelData ?? []) as HardFillIntelRow[];
    const loadIds = intelRows.map((row) => row.load_id).filter(Boolean);
    if (loadIds.length === 0) {
      return geoJsonResponse(emptyHardFillFeatureCollection("source_backed_empty"));
    }

    let loadsQuery = supabase
      .from("loads")
      .select("id,title,origin_lat,origin_lng,origin_city,origin_state,status")
      .in("id", loadIds)
      .not("origin_lat", "is", null)
      .not("origin_lng", "is", null);

    if (state) loadsQuery = loadsQuery.eq("origin_state", state);

    const { data: loadData, error: loadsError } = await loadsQuery;
    if (loadsError) return geoJsonResponse(emptyHardFillFeatureCollection("source_error"));

    const featureCollection = buildHardFillFeatureCollection(
      intelRows,
      (loadData ?? []) as LoadMapRow[],
    );

    return geoJsonResponse(featureCollection);
  } catch {
    return geoJsonResponse(emptyHardFillFeatureCollection("not_configured"));
  }
}
