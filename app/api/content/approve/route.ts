import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { parseDistributionJobs } from "@/lib/contracts/market-signal";
import { env } from "@/lib/env";
import { triggerIndexNow } from "@/lib/seo/indexnow";

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
    const approvedBy = body.approved_by as string | undefined;
    const jobs = parseDistributionJobs(body.jobs ?? []);

    if (!packetId) {
      return NextResponse.json({ ok: false, error: "packet_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();

    const { error: updateError } = await supabase
      .from("hc_content_packets")
      .update({
        status: "approved",
        approved_by: approvedBy ?? null,
        approved_at: new Date().toISOString(),
      })
      .eq("id", packetId);

    if (updateError) throw updateError;

    const { data: queued, error: queueError } = await supabase.rpc("rpc_queue_distribution_jobs", {
      p_content_packet_id: packetId,
      p_jobs: jobs,
    });

    if (queueError) throw queueError;

    // S3-04: Trigger IndexNow for newly approved content pages
    // Fire-and-forget: approval must not fail if indexing is unavailable
    const { data: packet } = await supabase
      .from("hc_content_packets")
      .select("target_slug, content_type")
      .eq("id", packetId)
      .single();

    if (packet?.target_slug) {
      const path = (() => {
        switch (packet.content_type) {
          case 'glossary': return `/glossary/${packet.target_slug}`;
          case 'corridor': return `/routes/${packet.target_slug}`;
          case 'regulation': return `/regulations/${packet.target_slug}`;
          case 'blog': return `/intelligence/${packet.target_slug}`;
          default: return `/${packet.target_slug}`;
        }
      })();
      triggerIndexNow([path]).catch(() => {});
    }

    return NextResponse.json({
      ok: true,
      packet_id: packetId,
      queued_jobs: queued,
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
