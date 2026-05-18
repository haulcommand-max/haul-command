import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(
    {
      error: 'workflow_run_status_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public workflow-run status is disabled until run ownership, step redaction, and tenant API-key checks are enforced.',
    },
    { status: 501 },
  );
}
