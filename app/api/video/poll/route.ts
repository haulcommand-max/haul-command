import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ELAI_API_KEY = process.env.ELAI_API_KEY;
const ELAI_BASE_URL = 'https://apis.elai.io/api/v1';
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const TRANSLATE_LANGUAGES = ['es', 'pt', 'de', 'fr', 'ar', 'nl', 'ja', 'ko', 'hi'];

async function elaiRequest(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${ELAI_BASE_URL}${path}`, {
    method,
    headers: { Authorization: `Bearer ${ELAI_API_KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Elai ${res.status}: ${await res.text()}`);
  return res.json();
}

// GET /api/video/poll
// Called by cron every 5 minutes to check video job status
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  if (!ELAI_API_KEY) return NextResponse.json({ error: 'ELAI_API_KEY not set' }, { status: 503 });

  const cookieStore = await cookies();
  const supabase = createServerClient(SUPABASE_URL, SUPABASE_SERVICE_KEY,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } });

  // Get all jobs that are rendering or queued
  const { data: jobs } = await supabase
    .from('video_jobs')
    .select('*')
    .in('status', ['queued', 'rendering', 'translating'])
    .lt('attempts', 60); // stop polling after 5 hours

  if (!jobs?.length) return NextResponse.json({ ok: true, polled: 0 });

  const results: string[] = [];

  for (const job of jobs) {
    try {
      const video = await elaiRequest(`/videos/${job.elai_video_id}`);
      const elaiStatus = video.status; // 'in_queue' | 'rendering' | 'done' | 'failed'

      await supabase.from('video_jobs').update({
        last_polled_at: new Date().toISOString(),
        attempts: job.attempts + 1,
      }).eq('id', job.id);

      if (elaiStatus === 'done' && job.status !== 'complete') {
        const videoUrl = video.result_url || video.videoUrl;
        await supabase.from('video_jobs').update({
          status: 'complete',
          video_url: videoUrl,
          duration_secs: video.duration,
        }).eq('id', job.id);

        // Update blog post
        if (job.language === 'en') {
          await supabase.from('blog_posts').update({
            video_url_en: videoUrl,
            video_status: 'en_complete',
          }).eq('id', job.blog_post_id);

          // Trigger translations
          try {
            const translateRes = await elaiRequest(`/videos/${job.elai_video_id}/translate`, 'POST', {
              languages: TRANSLATE_LANGUAGES,
            });
            // Store each translation job
            const translationJobs = TRANSLATE_LANGUAGES.map(lang => ({
              blog_post_id: job.blog_post_id,
              elai_video_id: translateRes[lang]?.id || '',
              language: lang,
              status: 'rendering',
              format: job.format,
            }));
            await supabase.from('video_jobs').insert(translationJobs);
            await supabase.from('blog_posts').update({ video_status: 'translating' }).eq('id', job.blog_post_id);
          } catch (tErr) {
            console.error('Translation trigger failed:', tErr);
          }
        } else {
          // Translation complete — update blog_posts.video_urls
          const { data: post } = await supabase.from('blog_posts')
            .select('video_urls').eq('id', job.blog_post_id).single();
          const existing = (post?.video_urls as Record<string, string>) || {};
          const langKey = `${job.language}_${job.format === '9:16' ? 'vertical' : 'horizontal'}`;
          await supabase.from('blog_posts').update({
            video_urls: { ...existing, [langKey]: videoUrl },
          }).eq('id', job.blog_post_id);
        }

        results.push(`${job.id}: complete (${job.language})`);
      } else if (elaiStatus === 'failed') {
        await supabase.from('video_jobs').update({
          status: 'failed', error_msg: video.error || 'Elai reported failure',
        }).eq('id', job.id);
        results.push(`${job.id}: failed`);
      }
    } catch (err) {
      results.push(`${job.id}: poll error — ${err}`);
    }
  }

  return NextResponse.json({ ok: true, polled: jobs.length, results });
}
