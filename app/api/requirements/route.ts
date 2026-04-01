import { NextResponse } from 'next/server';

// Server-side Logic for Task 31: GET /api/requirements Engine
// Dynamic evaluation of heavy haul limits per jurisdiction

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const country = (searchParams.get('country') || 'US').toUpperCase();
  const state = searchParams.get('state');
  const widthStr = searchParams.get('width');
  const heightStr = searchParams.get('height');

  if (!state || !widthStr) {
    return NextResponse.json({ error: 'Missing required parameters: state, width' }, { status: 400 });
  }

  const widthMeters = parseFloat(widthStr);
  const heightMeters = heightStr ? parseFloat(heightStr) : 0;
  
  // Note: In production this queries hc_jurisdiction_requirements
  const reqs = [];
  const warnings = [];

  // MOCK RULES ENGINE BASED ON COMPETITIVE SCRAPING TIER A
  if (country === 'US' && state.toUpperCase() === 'TX') {
    if (widthMeters >= 3.65) reqs.push({ code: 'lead_car', local_name: 'Lead Pilot Car' });
    if (widthMeters >= 4.26) reqs.push({ code: 'chase_car', local_name: 'Chase Pilot Car' });
    if (heightMeters >= 5.18) reqs.push({ code: 'high_pole', local_name: 'High Pole Escort' });
  } else if (country === 'FR' && state.toUpperCase() === 'IDF') {
    if (widthMeters >= 3.0) reqs.push({ code: 'front', local_name: 'Voiture Pilote (Cat 2)' });
    if (widthMeters >= 4.0 || heightMeters > 4.5) reqs.push({ code: 'cat3', local_name: 'Convoi Exceptionnel (Cat 3)' });
  } else {
    warnings.push(`Rules for ${country}-${state} are not locally mocked, defaulting to safety proxy.`);
    if (widthMeters >= 3.5) reqs.push({ code: 'generic_front', local_name: 'Generic Front Escort' });
  }

  return NextResponse.json({
    jurisdiction: `${country}-${state.toUpperCase()}`,
    base_dimensions: { width: widthMeters, height: heightMeters },
    escorts_required: reqs,
    warnings: warnings,
    timestamp: new Date().toISOString()
  });
}
