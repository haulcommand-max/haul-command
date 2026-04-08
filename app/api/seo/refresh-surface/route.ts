import { NextRequest, NextResponse } from "next/server";
import { queueSurfaceRefresh } from "@/lib/seo/refresh-surface";
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

    const id = await queueSurfaceRefresh({
      surface_type: body.surface_type,
      surface_key: body.surface_key,
      source_object_type: body.source_object_type,
      source_object_id: body.source_object_id,
      reason: body.reason,
      priority_score: Number(body.priority_score ?? 0),
      payload_json: body.payload_json ?? {},
    });

    return NextResponse.json({
      ok: true,
      refresh_job_id: id,
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
