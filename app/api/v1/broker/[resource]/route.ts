export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "broker_resource_not_available",
      status: "requires_broker_api_contract",
      message:
        "This broker allocation endpoint is held until tenant authentication, response redaction, and paid-placement disclosure are wired.",
    },
    { status: 501 },
  );
}
