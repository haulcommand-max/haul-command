import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

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

export async function GET(req: NextRequest) {
  void req;
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { data: advances, error } = await supabase
      .from('quickpay_advances')
      .select('*')
      .eq('operator_id', user.id)
      .order('created_at', { ascending: false });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ advances: advances || [] });
  } catch {
    return NextResponse.json({ error: 'Failed to load advances' }, { status: 500 });
  }
}
