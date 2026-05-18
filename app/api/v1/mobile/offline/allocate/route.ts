import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'offline_route_manifest_not_available',
      status: 'requires_mobile_auth_contract',
      message:
        'Offline route manifest generation is disabled until accepted-load ownership, route-coordinate privacy, and audited mobile auth are enforced.',
    },
    { status: 501 },
  );
}
