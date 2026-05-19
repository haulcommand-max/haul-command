import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error: {
        code: "review_submission_disabled",
        message:
          "Raw review ingestion is disabled until authenticated reviewer identity, proof checks, and moderation are enforced.",
      },
    },
    { status: 501 },
  );
}
