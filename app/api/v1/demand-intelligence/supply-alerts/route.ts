import { NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type SupplyAlertRow = {
  id: string;
  city: string | null;
  state_code: string | null;
  corridor_id: string | null;
  alert_type: string | null;
  available_count: number | null;
  demand_rate: number | null;
  message: string | null;
  expires_at: string | null;
  created_at: string | null;
};

function isUnexpired(alert: SupplyAlertRow): boolean {
  if (!alert.expires_at) return true;
  return new Date(alert.expires_at).getTime() > Date.now();
}

export async function GET(req: Request) {
  const supabase = getSupabaseAdmin();
  const url = new URL(req.url);
  const limit = Math.min(Math.max(Number(url.searchParams.get("limit") ?? 5), 1), 25);
  const stateCode = url.searchParams.get("state_code")?.toUpperCase() ?? null;
  const corridorId = url.searchParams.get("corridor_id") ?? null;

  let query = supabase
    .from("supply_alerts")
    .select("id,city,state_code,corridor_id,alert_type,available_count,demand_rate,message,expires_at,created_at")
    .eq("active", true)
    .order("created_at", { ascending: false })
    .limit(limit * 2);

  if (stateCode) query = query.eq("state_code", stateCode);
  if (corridorId) query = query.eq("corridor_id", corridorId);

  const { data, error } = await query;

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        alerts_count: 0,
        alerts: [],
        source_status: "unavailable",
      },
      { headers: { "Cache-Control": "public, max-age=60, stale-while-revalidate=120" } },
    );
  }

  const alerts = ((data ?? []) as SupplyAlertRow[])
    .filter(isUnexpired)
    .slice(0, limit)
    .map((alert) => ({
      id: alert.id,
      city: alert.city,
      state_code: alert.state_code,
      corridor_id: alert.corridor_id,
      alert_type: alert.alert_type,
      available_count: alert.available_count,
      demand_rate: alert.demand_rate,
      message: alert.message,
      expires_at: alert.expires_at,
    }));

  return NextResponse.json(
    {
      ok: true,
      alerts_count: alerts.length,
      alerts,
      source_status: "live",
    },
    { headers: { "Cache-Control": "public, max-age=120, stale-while-revalidate=300" } },
  );
}
