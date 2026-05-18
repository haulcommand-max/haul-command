import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'skill_run_not_available',
      status: 'requires_tenant_api_contract',
      message:
        'Public skill execution is disabled until API keys, tenant ownership, rate limits, and run-audit policies are enforced.',
    },
    { status: 501 },
  );
}
