import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  void req;
  return NextResponse.json(
    {
      error: 'Legacy QuickPay advances are disabled. Use /api/payments/quickpay so payouts are risk-scored, reserved, and recorded before money movement.',
      replacement: '/api/payments/quickpay',
    },
    { status: 410 },
  );
}

export async function GET() {
  return NextResponse.json(
    {
      error: 'Use /api/quickpay for legacy advance history or /api/payments/quickpay/history for canonical QuickPay history.',
      replacement: '/api/payments/quickpay/history',
    },
    { status: 410 },
  );
}
