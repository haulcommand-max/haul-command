import { NextResponse } from 'next/server';

// Legacy Elai polling is retired. New video jobs should flow through the
// Media Cost Governor and provider-specific status route.
export async function GET() {
  return NextResponse.json(
    {
      ok: false,
      retired: true,
      error: 'Legacy Elai video polling is retired. Use /api/video/check-status for governed provider jobs.',
    },
    { status: 410 },
  );
}
