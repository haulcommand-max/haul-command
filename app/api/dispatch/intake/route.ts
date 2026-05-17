import { NextResponse } from 'next/server';

// Haul Command Dispatch Intake Engine
// Task 32: Parses incoming load requests, parses routing, matches to local capabilities.

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { customerId, routeOrigin, routeDestination, loadDimensions } = data;

    if (!customerId || !routeOrigin || !routeDestination || !loadDimensions) {
      return NextResponse.json({ error: 'Missing dispatch configuration parameters.' }, { status: 400 });
    }

    console.log(`[Dispatch] Received new load from ${customerId} | Origin: ${routeOrigin.state} -> Dest: ${routeDestination.state}`);

    return NextResponse.json({
      error: 'dispatch_intake_not_connected',
      status: 'not_queued',
      diagnostics: {
        analyzed_corridor: `${routeOrigin.state}-${routeDestination.state}`,
        dimension_flags: loadDimensions.width > 12 ? ['overwidth'] : [],
        recommended_action: 'Use the canonical load creation or route request flow until dispatch intake persistence is wired.'
      },
      source: 'truthful_stub',
      disclaimer: 'No dispatch request was created and no operators were notified.'
    }, { status: 501 });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process dispatch payload.' }, { status: 500 });
  }
}
