import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'browser_grid_session_create_not_available',
      status: 'requires_internal_automation_contract',
      message:
        'Public browser-grid session creation is disabled until internal authorization, target allowlists, cost controls, and audit policies are enforced.',
    },
    { status: 501 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'browser_grid_session_status_not_available',
      status: 'requires_internal_automation_contract',
      message:
        'Public browser-grid session status is disabled until ownership and output redaction policies are enforced.',
    },
    { status: 501 },
  );
}
