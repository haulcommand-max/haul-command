import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isInternalRequest } from '@/lib/auth/internal-request';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret');
  const isAdmin = Boolean(process.env.HC_ADMIN_SECRET && adminSecret === process.env.HC_ADMIN_SECRET);
  if (!isAdmin && !isInternalRequest(req.headers)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const { data } = await supabase
    .from('content_queue')
    .select('id, topic, content_type, target_audience, status, scheduled_for, published_url, generated_content, created_at')
    .not('status', 'eq', 'rejected')
    .order('created_at', { ascending: false })
    .limit(100);
  return NextResponse.json(data || []);
}
