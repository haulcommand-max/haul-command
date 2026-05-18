export const dynamic = "force-dynamic";

import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "broker_exposure_not_available",
      status: "requires_broker_api_contract",
      message:
        "Exposure allocation is not exposed publicly. It requires authenticated broker tenants, redacted operator identifiers, and paid-placement disclosure.",
    },
    { status: 501 },
  );
}
