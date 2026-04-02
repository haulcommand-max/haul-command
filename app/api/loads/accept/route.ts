import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@/lib/supabase/server';

export async function POST(req: Request) {
  // Mobile app passes payload and a signature
  const { payload, signature } = await req.json();

  // 1. Swipe-To-Accept Cryptography verification
  // Reconstruct hash to ensure broker/operator hasn't spoofed payload
  const secretKey = process.env.PAYLOAD_SIGNING_SECRET || 'fallback_dev_secret';
  const expectedSig = crypto
      .createHmac('sha256', secretKey)
      .update(JSON.stringify(payload))
      .digest('hex');

  if (signature !== expectedSig) {
      return NextResponse.json({ error: 'Payload cryptography invalid. Swipe rejected.' }, { status: 403 });
  }

  // 2. Safe execution
  const { operator_id, load_id } = payload;
  const supabase = createClient();
  
  // Verify load is still available
  const { data: loadCheck } = await supabase
    .from('hc_loads_active')
    .select('network_status')
    .eq('id', load_id)
    .single();

  if (!loadCheck || loadCheck.network_status !== 'OPEN') {
      return NextResponse.json({ error: 'Load already claimed.' }, { status: 410 });
  }

  // Accept and secure
  const { error } = await supabase
    .from('hc_loads_active')
    .update({ 
      network_status: 'ESCROW_HOLD',
      assigned_operator_id: operator_id,
      accepted_at: new Date().toISOString()
    })
    .eq('id', load_id);

  if (error) {
    return NextResponse.json({ error: 'Failed DB Transaction' }, { status: 500 });
  }

  return NextResponse.json({ success: true, message: 'Load successfully secured.' });
}
