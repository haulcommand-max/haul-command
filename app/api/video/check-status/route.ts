/**
 * GET /api/video/check-status
 * Cron: every 5 minutes — polls HeyGen + Elai for rendering status.
 * On complete:
 *   English → triggers multilingual translation
 *   Translation → stores language URL, updates blog_posts/content_queue
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const ELAI_API_KEY   = process.env.ELAI_API_KEY;
const ELAI_BASE      = 'https://apis.elai.io/api/v1';

const TRANSLATE_LANGUAGES = ['es','pt','de','fr','ar','nl','ja','ko','hi'];

async function heygenStatus(videoId: string) {
  const res = await fetch(`https://api.heygen.com/v1/video_status.get?video_id=${videoId}`, {
    headers: { 'X-Api-Key': HEYGEN_API_KEY! },
  });
  if (!res.ok) throw new Error(`HeyGen status ${res.status}`);
  const data = await res.json();
  // { code: 100, data: { video_id, status: 'processing'|'completed'|'failed', video_url, ... }}
  return data.data;
}

async function elaiStatus(videoId: string) {
  const res = await fetch(`${ELAI_BASE}/videos/${videoId}`, {
    headers: { Authorization: `Bearer ${ELAI_API_KEY}` },
  });
  if (!res.ok) throw new Error(`Elai status ${res.status}`);
  return res.json();
}

async function heygenTranslate(videoId: string) {
  const res = await fetch('https://api.heygen.com/v2/video_translate', {
    method: 'POST',
    headers: { 'X-Api-Key': HEYGEN_API_KEY!, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_id: videoId,
      output_languages: TRANSLATE_LANGUAGES,
    }),
  });
  const data = await res.json();
  return data.data; // array of { language, video_translate_id }
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: jobs } = await supabase
    .from('video_jobs')
    .select('*')
    .in('status', ['queued','rendering','translating'])
    .lt('attempts', 72); // max 6 hours polling

  if (!jobs?.length) return NextResponse.json({ ok: true, polled: 0 });

  const results: string[] = [];

  for (const job of jobs) {
    try {
      let status: string;
      let videoUrl: string | null = null;
      let durationSecs: number | null = null;

      if (job.provider === 'heygen' || HEYGEN_API_KEY) {
        const s = await heygenStatus(job.provider_video_id);
        status    = s.status;           // 'processing' | 'completed' | 'failed'
        videoUrl  = s.video_url || null;
        durationSecs = s.duration || null;
        const heygenNorm = status === 'completed' ? 'complete' : status === 'failed' ? 'failed' : 'rendering';
        await supabase.from('video_jobs').update({
          last_polled_at: new Date().toISOString(),
          attempts: job.attempts + 1,
          heygen_status: heygenNorm,
        }).eq('id', job.id);
        if (status !== 'completed' && status !== 'failed') {
          results.push(`${job.id}: still rendering (${job.language})`);
          continue;
        }
      } else {
        const s = await elaiStatus(job.provider_video_id);
        status   = s.status;
        videoUrl = s.result_url || s.videoUrl || null;
        durationSecs = s.duration || null;
        await supabase.from('video_jobs').update({
          last_polled_at: new Date().toISOString(),
          attempts: job.attempts + 1,
        }).eq('id', job.id);
        if (status !== 'done' && status !== 'failed') {
          results.push(`${job.id}: still rendering (${job.language})`);
          continue;
        }
      }

      // ── Handle failure
      const isDone = status === 'completed' || status === 'done';
      if (!isDone) {
        await supabase.from('video_jobs').update({ status: 'failed', heygen_status: 'failed' }).eq('id', job.id);
        results.push(`${job.id}: FAILED (${job.language})`);
        continue;
      }

      // ── Handle complete
      await supabase.from('video_jobs').update({
        status: 'complete',
        heygen_status: 'complete',
        video_url: videoUrl,
        duration_secs: durationSecs,
      }).eq('id', job.id);

      if (job.language === 'en') {
        // Update source records
        const updatePayload = { video_url_en: videoUrl, video_status: 'en_complete', heygen_video_id: job.provider_video_id };
        if (job.blog_post_id)    await supabase.from('blog_posts').update(updatePayload).eq('id', job.blog_post_id);
        if (job.content_queue_id) await supabase.from('content_queue').update({ video_url_en: videoUrl, heygen_status: 'en_complete' }).eq('id', job.content_queue_id);

        // Trigger multilingual translations (HeyGen only)
        if (HEYGEN_API_KEY) {
          try {
            const translations = await heygenTranslate(job.provider_video_id);
            // translations: [{ language: 'es', video_translate_id: 'abc' }, ...]
            const translationJobs = (translations || []).map((t: { language: string; video_translate_id: string }) => ({
              blog_post_id: job.blog_post_id || null,
              content_queue_id: job.content_queue_id || null,
              provider_video_id: t.video_translate_id,
              provider: 'heygen',
              language: t.language,
              status: 'rendering',
              heygen_status: 'rendering',
              topic_slug: job.topic_slug,
              format: job.format, // retain orientation metadata
              attempts: 0,
            }));
            if (translationJobs.length) {
              await supabase.from('video_jobs').insert(translationJobs);
            }
            if (job.blog_post_id)    await supabase.from('blog_posts').update({ video_status: 'translating' }).eq('id', job.blog_post_id);
            if (job.content_queue_id) await supabase.from('content_queue').update({ heygen_status: 'translating' }).eq('id', job.content_queue_id);
          } catch (tErr) {
            console.error('[video/check-status] Translation trigger failed:', tErr);
          }
        }
      } else {
        // Translation complete — store variant-specific URL inside `video_urls` jsonb
        const langKey = `${job.language}_${job.format === '9:16' ? 'vertical' : 'horizontal'}`;
        
        if (job.blog_post_id) {
          const { data: b } = await supabase.from('blog_posts').select('video_urls').eq('id', job.blog_post_id).single();
          const existing = (b?.video_urls as Record<string, string>) || {};
          await supabase.from('blog_posts').update({ video_urls: { ...existing, [langKey]: videoUrl } }).eq('id', job.blog_post_id);
        }
        if (job.content_queue_id) {
          const { data: c } = await supabase.from('content_queue').select('video_urls').eq('id', job.content_queue_id).single();
          const existing = (c?.video_urls as Record<string, string>) || {};
          await supabase.from('content_queue').update({ video_urls: { ...existing, [langKey]: videoUrl } }).eq('id', job.content_queue_id);
        }
      }
      results.push(`${job.id}: COMPLETE (${job.language}) → ${videoUrl?.slice(0,60)}`);
    } catch (err) {
      results.push(`${job.id}: poll error — ${String(err).slice(0, 100)}`);
    }
  }

  return NextResponse.json({ ok: true, polled: jobs.length, results });
}
