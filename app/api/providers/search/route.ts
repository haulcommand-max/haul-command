import { NextResponse } from 'next/server';

// Haul Command OS
// Task 36: Provide a search endpoint for the training school marketplace.

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q')?.toLowerCase() || '';

  // In production, this queries hc_training_providers
  const mockDatabase = [
    { id: '1', name: 'Evergreen Safety Council', region: 'WA', certified: true, courses: ['PEVO'] },
    { id: '2', name: 'Florida Pilot Training', region: 'FL', certified: true, courses: ['Defensive Driving', 'FL Certification'] },
    { id: '3', name: 'NHVR National Escorts', region: 'AU-NSW', certified: true, courses: ['Level 1', 'Level 2'] }
  ];

  const results = mockDatabase.filter(p => p.name.toLowerCase().includes(q) || p.region.toLowerCase().includes(q));

  return NextResponse.json({
    query: q,
    results_found: results.length,
    providers: results
  });
}
