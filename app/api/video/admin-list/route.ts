/**
 * GET  /api/video/admin-list   — list all video jobs for admin
 * PATCH /api/video/admin-list  — approve or reject a video job
 */
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET() {
  const supabase = await createClient();

  const { data: jobs, error } = await supabase
    .from('video_jobs')
    .select(`
      id, language, status, heygen_status, video_url, youtube_url,
      admin_approved, admin_rejected, topic_slug, duration_secs,
      created_at, script_text, provider,
      blog_post_id
    `)
    .order('created_at', { ascending: false })
    .limit(200);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ jobs: jobs ?? [] });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { job_id, action } = body; // action: 'approve' | 'reject'

  if (!job_id || !['approve','reject'].includes(action)) {
    return NextResponse.json({ error: 'job_id and action (approve|reject) required' }, { status: 400 });
  }

  const supabase = await createClient();

  if (action === 'approve') {
    const { data: job } = await supabase.from('video_jobs').select('*').eq('id', job_id).single();
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    await supabase.from('video_jobs').update({
      admin_approved:   true,
      admin_approved_at: new Date().toISOString(),
    }).eq('id', job_id);

    // Trigger YouTube publish + translation for English jobs
    if (job.language === 'en') {
      const publishBody = {
        blog_post_id:     job.blog_post_id || null,
        content_queue_id: job.content_queue_id || null,
        languages: ['en'],
      };
      // Fire and forget — don't await, just trigger
      fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'https://haulcommand.com'}/api/video/publish-youtube`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-secret': process.env.ADMIN_SECRET || '',
        },
        body: JSON.stringify(publishBody),
      }).catch(console.error);
    }

    return NextResponse.json({ ok: true, action: 'approved' });
  }

  // Reject
  await supabase.from('video_jobs').update({ admin_rejected: true }).eq('id', job_id);
  return NextResponse.json({ ok: true, action: 'rejected' });
}
