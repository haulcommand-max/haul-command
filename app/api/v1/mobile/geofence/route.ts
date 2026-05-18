import { NextResponse } from 'next/server';

export async function POST() {
  return NextResponse.json(
    {
      error: 'mobile_geofence_manifest_not_available',
      status: 'requires_mobile_auth_contract',
      message:
        'Mobile geofence manifests are disabled until accepted-load ownership, route privacy, source-backed jurisdiction data, and verified-device auth are enforced.',
    },
    { status: 501 },
  );
}
