import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "outbound_calling_not_available",
      status: "requires_internal_auth_and_consent_gate",
      message:
        "Outbound SIP calling is disabled until target consent, DNC/opt-out checks, quiet-hours rules, and internal-only authorization are enforced.",
    },
    { status: 501 },
  );
}
