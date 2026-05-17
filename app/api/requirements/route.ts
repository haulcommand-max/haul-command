import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Server-side Logic for Task 31: GET /api/requirements Engine
// Source-gated evaluation of heavy haul limits per jurisdiction.

type EscortRequirement = {
  code: string;
  local_name: string;
};

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
  
  const reqs: EscortRequirement[] = [];
  const warnings = [];
  const jurisdiction = `${country}-${state.toUpperCase()}`;

  const supabase = createClient();
  const { data: jurisdictionRows, error: jurisdictionError } = await supabase.rpc('hc_get_jurisdiction_requirements', {
    p_jurisdiction: jurisdiction,
  });

  if (jurisdictionRows && jurisdictionRows.length > 0) {
    return NextResponse.json({
      jurisdiction,
      base_dimensions: { width: widthMeters, height: heightMeters },
      requirements: jurisdictionRows,
      source: 'hc_get_jurisdiction_requirements',
      confidence_label: 'source_backed',
      disclaimer: 'Requirements are source-backed but must still be verified with the issuing authority before dispatch.',
      timestamp: new Date().toISOString()
    });
  }

  if (jurisdictionError) {
    warnings.push('Jurisdiction requirements table/RPC unavailable; returning low-confidence safety proxy.');
  } else {
    warnings.push(`No source-backed jurisdiction requirement rows found for ${jurisdiction}; returning low-confidence safety proxy.`);
  }

  // Low-confidence safety proxy only; not an official rule determination.
  if (country === 'US' && state.toUpperCase() === 'TX') {
    if (widthMeters >= 3.65) reqs.push({ code: 'lead_car', local_name: 'Lead Pilot Car' });
    if (widthMeters >= 4.26) reqs.push({ code: 'chase_car', local_name: 'Chase Pilot Car' });
    if (heightMeters >= 5.18) reqs.push({ code: 'high_pole', local_name: 'High Pole Escort' });
  } else if (country === 'FR' && state.toUpperCase() === 'IDF') {
    if (widthMeters >= 3.0) reqs.push({ code: 'front', local_name: 'Voiture Pilote (Cat 2)' });
    if (widthMeters >= 4.0 || heightMeters > 4.5) reqs.push({ code: 'cat3', local_name: 'Convoi Exceptionnel (Cat 3)' });
  } else {
    if (widthMeters >= 3.5) reqs.push({ code: 'generic_front', local_name: 'Generic Front Escort' });
  }

  return NextResponse.json({
    jurisdiction,
    base_dimensions: { width: widthMeters, height: heightMeters },
    escorts_required: reqs,
    warnings,
    source: 'static_safety_proxy',
    confidence_label: 'low_confidence',
    disclaimer: 'This is not a permit, legal opinion, or official jurisdiction rule. Verify current requirements with the permitting authority before dispatch.',
    timestamp: new Date().toISOString()
  });
}
