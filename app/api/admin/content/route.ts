import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase
    .from('content_queue')
    .select('id, topic, content_type, target_audience, status, scheduled_for, published_url, generated_content, created_at')
    .not('status', 'eq', 'rejected')
    .order('created_at', { ascending: false })
    .limit(100);
  return NextResponse.json(data || []);
}
