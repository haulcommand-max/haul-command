import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseDistributionJobs } from "@/lib/contracts/market-signal";
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

    const body = await request.json();
    const packetId = body.packet_id as string | undefined;

    if (!packetId) {
      return NextResponse.json({ ok: false, error: "packet_id is required" }, { status: 400 });
    }

    const jobs = parseDistributionJobs(body.jobs ?? []);
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc("rpc_queue_distribution_jobs", {
      p_content_packet_id: packetId,
      p_jobs: jobs,
    });

    if (error) throw error;

    return NextResponse.json({
      ok: true,
      queued_jobs: data,
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
