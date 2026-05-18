import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Crowdsourced corridor alerts are disabled until authenticated authorship, evidence review, and anti-gaming controls are enforced.",
    },
    { status: 501 },
  );
}
