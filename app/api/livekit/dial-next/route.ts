import { NextResponse } from "next/server";

export async function POST() {
  return NextResponse.json(
    {
      error: "outbound_dialer_not_available",
      status: "requires_internal_auth_and_consent_gate",
      message:
        "Automated outbound dialing is held until internal authentication, consent, quiet-hours, and opt-out enforcement are wired end to end.",
    },
    { status: 501 },
  );
}
