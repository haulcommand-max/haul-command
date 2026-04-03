// app/api/swarm/activity/route.ts
// Swarm Activity Feed API — required visibility layer
// Shows: agent_name, trigger_reason, action_taken, surfaces_touched,
//        revenue_or_trust_impact, country, market, status

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";

export async function GET(req: NextRequest) {
  const supabase = getSupabaseAdmin();
  const { searchParams } = new URL(req.url);

  const limit = Math.min(parseInt(searchParams.get("limit") ?? "50"), 200);
  const domain = searchParams.get("domain");
  const country = searchParams.get("country");
  const status = searchParams.get("status");

  let query = supabase
    .from("swarm_activity_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit);

  if (domain) query = query.eq("domain", domain);
  if (country) query = query.eq("country", country);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ entries: data ?? [], count: data?.length ?? 0 });
}
