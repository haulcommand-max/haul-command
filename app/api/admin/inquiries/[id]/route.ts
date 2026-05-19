import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isInternalRequest } from '@/lib/auth/internal-request';

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const adminSecret = req.headers.get('x-admin-secret');
  const isAdmin = Boolean(process.env.HC_ADMIN_SECRET && adminSecret === process.env.HC_ADMIN_SECRET);
  if (!isAdmin && !isInternalRequest(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const { status } = await req.json();
  const supabase = createClient();
  const { error } = await supabase.from('partner_inquiries').update({ status }).eq('id', id);
  if (error) {
    console.error('[admin-inquiries] status update failed:', error);
    return NextResponse.json({ error: 'Inquiry update failed' }, { status: 500 });
  }
  return NextResponse.json({ success: true });
}
