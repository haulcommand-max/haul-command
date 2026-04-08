import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { buildDefaultPacketFromSignal, insertContentPacket } from "@/lib/content/build-packet";
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
    const signalId = body.signal_id as string | undefined;

    if (!signalId) {
      return NextResponse.json({ ok: false, error: "signal_id is required" }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    const { data: signal, error } = await supabase
      .from("hc_market_signals")
      .select("*")
      .eq("id", signalId)
      .single();

    if (error) throw error;
    if (!signal) throw new Error("Signal not found");

    const packet = buildDefaultPacketFromSignal(signal);
    const packetId = await insertContentPacket(packet);

    return NextResponse.json({
      ok: true,
      packet_id: packetId,
      preview: packet,
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
