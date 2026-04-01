import { NextResponse } from 'next/server';

// Server-side Logic for Task 39: POST /api/quote/generate
// Dynamically prices a multi-capability escort load

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { distanceMiles, requiredRoles, countryCode = 'US' } = body;

    if (!distanceMiles || !requiredRoles || !Array.isArray(requiredRoles)) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
    }

    // Example dynamic pricing rules based on market scrape
    const baseRatePerMile = countryCode === 'US' ? 1.85 : 2.20; // Example USD
    let multiplier = 1.0;

    if (requiredRoles.includes('high_pole')) multiplier += 0.4;
    if (requiredRoles.includes('route_survey')) multiplier += 1.0;

    const finalPpm = baseRatePerMile * multiplier;
    const estTotal = distanceMiles * finalPpm;

    return NextResponse.json({
      currency: countryCode === 'US' ? 'USD' : 'EUR', // mock
      estimated_total: parseFloat(estTotal.toFixed(2)),
      breakdown: {
        base_rate_ppm: parseFloat(baseRatePerMile.toFixed(2)),
        applied_multiplier: parseFloat(multiplier.toFixed(2)),
        final_ppm: parseFloat(finalPpm.toFixed(2))
      },
      roles_priced: requiredRoles
    });
  } catch (err) {
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
