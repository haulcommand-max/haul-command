import { NextRequest, NextResponse } from "next/server";
import { parseSignalIngestPayload } from "@/lib/contracts/market-signal";
import { emitSignalEvent } from "@/lib/events/emit";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const payload = parseSignalIngestPayload(body);
    const eventId = await emitSignalEvent(payload);

    return NextResponse.json({
      ok: true,
      event_id: eventId,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 400 },
    );
  }
}
