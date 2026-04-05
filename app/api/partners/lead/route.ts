import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase/admin';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { partner_type, usdot, estimated_gallons, email, phone } = body;

    if (!partner_type) {
      return NextResponse.json({ error: 'partner_type is required' }, { status: 400 });
    }

    const admin = getSupabaseAdmin();
    const { error } = await admin.from('hc_partner_leads').insert({
      partner_type,
      usdot,
      estimated_gallons: estimated_gallons ? String(estimated_gallons) : null,
      email,
      phone,
    });

    if (error) {
      console.error('[partner_lead] insert error:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[partner_lead] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
