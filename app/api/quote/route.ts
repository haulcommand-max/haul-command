import { NextResponse } from 'next/server';

// Server-side Logic for Task 39: POST /api/quote/generate
// Produces a planning estimate for a multi-capability escort load.

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { distanceMiles, requiredRoles, countryCode = 'US' } = body;
    const normalizedCountryCode = typeof countryCode === 'string' ? countryCode.toUpperCase() : 'US';

    const miles = Number(distanceMiles);
    if (!Number.isFinite(miles) || miles <= 0 || !requiredRoles || !Array.isArray(requiredRoles)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    const normalizedRoles = requiredRoles
      .filter((role): role is string => typeof role === 'string')
      .map((role) => role.trim().toLowerCase())
      .filter(Boolean);

    // Static planning formula. It is not a live market scrape or binding quote.
    const baseRatePerMile = normalizedCountryCode === 'US' ? 1.85 : 2.20;
    let multiplier = 1.0;

    if (normalizedRoles.includes('high_pole')) multiplier += 0.4;
    if (normalizedRoles.includes('route_survey')) multiplier += 1.0;

    const finalPpm = baseRatePerMile * multiplier;
    const estTotal = miles * finalPpm;

    return NextResponse.json({
      currency: 'USD',
      currency_note: normalizedCountryCode === 'US' ? null : 'Non-US local currency conversion is not connected in this estimator.',
      estimated_total: parseFloat(estTotal.toFixed(2)),
      breakdown: {
        base_rate_ppm: parseFloat(baseRatePerMile.toFixed(2)),
        applied_multiplier: parseFloat(multiplier.toFixed(2)),
        final_ppm: parseFloat(finalPpm.toFixed(2))
      },
      roles_priced: normalizedRoles,
      pricing_source: 'static_planning_formula',
      confidence_label: 'planning_estimate',
      disclaimer: 'This is a non-binding planning estimate. Confirm live market rates, route constraints, permits, escort availability, and currency before quoting or dispatching.'
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
