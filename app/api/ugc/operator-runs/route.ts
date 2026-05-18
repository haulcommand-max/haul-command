import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      ok: false,
      error:
        "Operator run submissions are disabled until authenticated ownership and source validation are enforced.",
    },
    { status: 501 },
  );
}
