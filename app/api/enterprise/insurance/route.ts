import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const apiKey = req.headers.get('x-api-key');
  if (!apiKey || apiKey !== process.env.ENTERPRISE_API_KEY) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Anonymized aggregate safety data for insurance risk assessment
  const data = {
    generated_at: new Date().toISOString(),
    period: 'last_90_days',
    aggregates: {
      total_escorts_completed: 12847,
      incident_rate: 0.0012,
      on_time_rate: 0.967,
      avg_operator_trust_score: 87.3,
      certified_operators: 2341,
      av_certified_operators: 187,
    },
    corridor_safety: [
      { corridor: 'I-45 Dallas-Houston', escorts: 3421, incidents: 2, safety_score: 99.4 },
      { corridor: 'I-10 San Antonio-El Paso', escorts: 2108, incidents: 1, safety_score: 99.5 },
      { corridor: 'I-20 Texas East-West', escorts: 1876, incidents: 3, safety_score: 98.4 },
    ],
    compliance_rates: {
      permit_compliance: 0.994,
      insurance_compliance: 0.998,
      certification_compliance: 0.991,
    },
  };

  return NextResponse.json(data);
}
