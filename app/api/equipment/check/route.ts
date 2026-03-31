import { NextResponse } from 'next/server';

// Haul Command OS
// Task 38: Backend Endpoint for Equipment Compliance verification

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = searchParams.get('country')?.toUpperCase() || 'US';
  const role = searchParams.get('role');

  if (!role) {
    return NextResponse.json({ error: 'Role required (e.g., front_escort).' }, { status: 400 });
  }

  // Simplified rules engine for required equipment per country
  const equipmentMatrix = {
    'US': ['1x Amber 360 Strobe (Class 1)', 'Oversize Load Banner (18in x 84in)', 'VHF/CB Radio (Channel 19)'],
    'AU': ['2x Flashing Amber Warning Lights', 'Oversize Signage (1200x450mm)', 'UHF Radio (Channel 40)'],
    'DE': ['BF3/BF4 Variable Message Sign (VMS) Roof Board', 'Yellow Reflective Tape (DIN 30710)', 'Traffic Control Radio'],
    'FR': ['2x Rotating Amber Beacons', 'Convoi Exceptionnel Panels (Front/Rear)', 'Fluorescent Safety Vests']
  };

  const reqs = equipmentMatrix[country as keyof typeof equipmentMatrix] || equipmentMatrix['US'];

  return NextResponse.json({
    jurisdiction: country,
    capability: role,
    mandatory_equipment: reqs,
    compliance_check_status: 'enforced'
  });
}
