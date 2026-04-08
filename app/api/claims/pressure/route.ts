import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
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

    const { data: recomputeCount, error: rpcError } = await supabase.rpc(
      "rpc_score_claim_pressure_targets",
    );

    if (rpcError) throw rpcError;

    const { data: topTargets, error: selectError } = await supabase
      .from("hc_claim_pressure_targets")
      .select("*")
      .eq("status", "open")
      .order("priority_score", { ascending: false })
      .limit(50);

    if (selectError) throw selectError;

    return NextResponse.json({
      ok: true,
      recompute_count: recomputeCount,
      top_targets: topTargets ?? [],
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
