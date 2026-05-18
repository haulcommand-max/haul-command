import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "UGC review submission is disabled until reviewer identity, completed-work proof, and moderation are enforced.",
    },
    { status: 501 },
  );
}
