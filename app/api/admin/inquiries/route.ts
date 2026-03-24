import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase
    .from('partner_inquiries')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(100);
  return NextResponse.json(data || []);
}
