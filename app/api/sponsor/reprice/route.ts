import { NextRequest, NextResponse } from "next/server";
import { runSponsorRepriceWorker } from "@/workers/sponsor-reprice.worker";
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

    const result = await runSponsorRepriceWorker();

    return NextResponse.json({
      ok: true,
      result,
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
