// app/api/swarm/scoreboard/route.ts
// Swarm Scoreboard API — required visibility layer
// Metrics: executions/day, claims driven, listings created, loads captured,
//          matches, revenue influenced, sponsor inventory, AI citations, no-dead-end fixes

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();

  const { data, error } = await supabase
    .from("swarm_scoreboard")
    .select("*")
    .order("computed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // If no scoreboard exists yet, return zeroed metrics
  const scoreboard = data ?? {
    executions_today: 0,
    claims_driven: 0,
    listings_created: 0,
    loads_captured: 0,
    matches_created: 0,
    revenue_influenced: 0,
    sponsor_inventory_filled: 0,
    ai_citation_pages: 0,
    no_dead_end_fixes: 0,
    market_activations: 0,
    computed_at: new Date().toISOString(),
  };

  return NextResponse.json({ scoreboard });
}
