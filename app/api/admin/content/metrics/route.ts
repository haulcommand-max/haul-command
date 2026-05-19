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
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

  const [publishedRes, linkedinRes, youtubeRes, inquiriesRes] = await Promise.all([
    supabase.from('blog_posts')
      .select('id', { count: 'exact', head: true })
      .eq('published', true)
      .gte('published_at', startOfMonth),
    supabase.from('content_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'ready_to_post'),
    supabase.from('content_queue')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'script_ready'),
    supabase.from('partner_inquiries')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'new'),
  ]);

  return NextResponse.json({
    published_this_month: publishedRes.count || 0,
    linkedin_pending: linkedinRes.count || 0,
    youtube_scripts: youtubeRes.count || 0,
    new_inquiries: inquiriesRes.count || 0,
  });
}
