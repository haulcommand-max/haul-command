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

    // In production, this fires off Supabase RPC 'create_dispatch_request'
    // and triggers LiveKit voice or push notifications to match vendors.
    console.log(`[Dispatch] Received new load from ${customerId} | Origin: ${routeOrigin.state} -> Dest: ${routeDestination.state}`);

    // Mock response simulating a database insert.
    return NextResponse.json({
      status: 'queued_for_matching',
      dispatch_id: 'mock-uuid-9428-abcd',
      diagnostics: {
        analyzed_corridor: `${routeOrigin.state}-${routeDestination.state}`,
        dimension_flags: loadDimensions.width > 12 ? ['overwidth'] : [],
        recommended_action: 'Searching vendor pool for capable matches'
      }
    });

  } catch (error) {
    return NextResponse.json({ error: 'Failed to process dispatch payload.' }, { status: 500 });
  }
}
