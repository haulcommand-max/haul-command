import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'offline_action_sync_not_available',
      status: 'requires_mobile_auth_contract',
      message:
        'Offline action sync is disabled until verified-device auth, user ownership, payload validation, and replay protection are enforced.',
    },
    { status: 501 },
  );
}
