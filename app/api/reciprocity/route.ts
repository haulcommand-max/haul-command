import { NextResponse } from 'next/server';

// Server-side Logic for Task 34: GET /api/reciprocity Engine
// Resolves complex graph logic from the Evergreen Safety Council audit.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const originState = searchParams.get('from')?.toUpperCase();
  const targetState = searchParams.get('to')?.toUpperCase();

  if (!originState || !targetState) {
    return NextResponse.json({ error: 'Provide origin (from) and target (to)' }, { status: 400 });
  }

  // MOCK LOGIC BASED ON EVERGREEN SCRAPE MAP
  let status = 'not_accepted';
  const addons = [];

  if (originState === 'WA') {
    if (['OR', 'ID', 'MT', 'CO', 'NV'].includes(targetState)) {
      status = 'full_acceptance';
    } else if (targetState === 'FL') {
      status = 'requires_addon';
      addons.push({ rule: 'defensive_driving', desc: 'Must hold active Defensive Driving Course' });
      addons.push({ rule: 'amber_light_cert', desc: 'Specific FL strobe pattern' });
    }
  }

  return NextResponse.json({
    query: { from: originState, to: targetState },
    reciprocity_status: status,
    required_addons: addons,
    source: 'Evergreen / Haul Command Registry'
  });
}
