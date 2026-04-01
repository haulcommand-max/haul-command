import { NextResponse } from 'next/server';

// Haul Command OS
// Task 37: Intake endpoint for Brokers to flag bad operators.

export async function POST(request: Request) {
  try {
    const { targetCompanyId, infractionType, evidenceUrl } = await request.json();

    if (!targetCompanyId || !infractionType) {
      return NextResponse.json({ error: 'Missing reporting parameters.' }, { status: 400 });
    }

    // In production, this inserts into hc_fraud_flags which requires manual admin resolve.
    // If double-brokering is verified, trust score = 0 unconditionally.

    return NextResponse.json({
      status: 'flagged_for_investigation',
      infraction: infractionType,
      target: targetCompanyId,
      notice: 'The target operator\'s trust score has been temporarily suspended pending admin review.'
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to submit fraud flag.' }, { status: 500 });
  }
}
