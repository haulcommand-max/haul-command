import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { inferSignalTypeFromEventName, materializeSignal } from "@/lib/signals/materialize";
import { env } from "@/lib/env";

const authorize = (request: NextRequest) => {
  const token = request.headers.get("x-internal-token");
  return token === env.INTERNAL_WORKER_TOKEN;
};

export async function POST(request: NextRequest) {
  try {
    if (!authorize(request)) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const supabase = getSupabaseAdmin();

    const { data: events, error } = await supabase
      .from("hc_signal_events")
      .select("*")
      .eq("status", "queued")
      .order("created_at", { ascending: true })
      .limit(100);

    if (error) throw error;

    const processed: Array<{ event_id: string; signal_id: string }> = [];

    for (const event of events ?? []) {
      const signalType = inferSignalTypeFromEventName(event.event_name);

      const signalId = await materializeSignal({
        signal_type: signalType,
        source_event_id: event.id,
        object_type: event.object_type,
        object_id: event.object_id,
        geo_scope: event.city_slug ? "city" : event.region_code ? "region" : event.country_code ? "country" : "global",
        country_code: event.country_code,
        region_code: event.region_code,
        city_slug: event.city_slug,
        corridor_id: event.corridor_id,
        signal_score: Number(event.severity ?? 0),
        urgency_score: Number(event.severity ?? 0),
        seo_value_score: signalType === "corridor_heat" ? 0.7 : 0.4,
        claim_value_score: signalType === "claim_pressure" ? 0.8 : 0.2,
        monetization_value_score: signalType === "corridor_heat" ? 0.7 : 0.3,
        liquidity_value_score: signalType === "urgent_load" ? 0.9 : 0.2,
        quality_score: Number(event.confidence ?? 0),
        meta_json: event.payload_json ?? {},
      });

      await supabase
        .from("hc_signal_events")
        .update({
          status: "processed",
          processed_at: new Date().toISOString(),
        })
        .eq("id", event.id);

      processed.push({
        event_id: event.id,
        signal_id: signalId,
      });
    }

    return NextResponse.json({
      ok: true,
      processed_count: processed.length,
      processed,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
}
