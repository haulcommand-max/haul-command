/**
 * POST /api/video/create
 * Unified video creation — HeyGen primary, Elai fallback.
 * Called by cron after script generation or manually from admin dashboard.
 * Body: { content_queue_id?, blog_post_id?, script_text, title, topic_slug? }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const HEYGEN_API_KEY  = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE     = 'https://api.heygen.com';
const HEYGEN_AVATAR   = process.env.HEYGEN_AVATAR_ID || '';
const HEYGEN_VOICE    = process.env.HEYGEN_VOICE_ID  || '';

// Elai fallback
const ELAI_API_KEY    = process.env.ELAI_API_KEY;
const ELAI_BASE       = 'https://apis.elai.io/api/v1';
const ELAI_AVATAR_ID  = process.env.ELAI_AVATAR_ID  || '';

async function heygenRequest(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${HEYGEN_BASE}${path}`, {
    method,
    headers: {
      'X-Api-Key': HEYGEN_API_KEY!,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`HeyGen ${res.status}: ${text}`);
  return JSON.parse(text);
}

async function elaiRequest(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${ELAI_BASE}${path}`, {
    method,
    headers: { Authorization: `Bearer ${ELAI_API_KEY}`, 'Content-Type': 'application/json' },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`Elai ${res.status}: ${text}`);
  return JSON.parse(text);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { content_queue_id, blog_post_id, script_text, title, topic_slug } = body;

  if (!script_text) {
    return NextResponse.json({ error: 'script_text is required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const useHeygen = !!HEYGEN_API_KEY && !!HEYGEN_AVATAR;
  let providerVideoId: string;
  let provider: 'heygen' | 'elai';

  try {
    const jobsToInsert: any[] = [];
    const dispatchPromises: Promise<any>[] = [];

    // ── 1. HeyGen: Master Horizontal (16:9) -> YouTube / LinkedIn
    if (HEYGEN_API_KEY && HEYGEN_AVATAR) {
      dispatchPromises.push(
        heygenRequest('/v2/video/generate', 'POST', {
          video_inputs: [{
            character: { type: 'avatar', avatar_id: HEYGEN_AVATAR, avatar_style: 'normal' },
            voice: { type: 'text', input_text: script_text.slice(0, 4000), voice_id: HEYGEN_VOICE, speed: 1.0, pitch: 0 },
            background: { type: 'color', value: '#0A0A0F' },
          }],
          dimension: { width: 1280, height: 720 },
          aspect_ratio: '16:9',
          caption: true,
          test: process.env.NODE_ENV !== 'production',
        }).then(resp => {
          if (resp.data?.video_id) {
            jobsToInsert.push({
               blog_post_id: blog_post_id || null, provider_video_id: resp.data.video_id, provider: 'heygen',
               language: 'en', status: 'rendering', heygen_status: 'rendering', script_text, topic_slug: topic_slug || null, format: '16:9'
            });
          }
        }).catch(err => console.error('[HeyGen 16:9]', err))
      );
      
      // ── 2. HeyGen: Short Form Vertical (9:16) -> TikTok / Shorts / Reels
      dispatchPromises.push(
        heygenRequest('/v2/video/generate', 'POST', {
          video_inputs: [{
            character: { type: 'avatar', avatar_id: HEYGEN_AVATAR, avatar_style: 'normal' },
            voice: { type: 'text', input_text: script_text.slice(0, 4000), voice_id: HEYGEN_VOICE },
            background: { type: 'color', value: '#121212' },
          }],
          dimension: { width: 720, height: 1280 },
          aspect_ratio: '9:16',
          caption: true,
          test: process.env.NODE_ENV !== 'production',
        }).then(resp => {
          if (resp.data?.video_id) {
            jobsToInsert.push({
               blog_post_id: blog_post_id || null, provider_video_id: resp.data.video_id, provider: 'heygen',
               language: 'en', status: 'rendering', heygen_status: 'rendering', script_text, topic_slug: topic_slug || null, format: '9:16'
            });
          }
        }).catch(err => console.error('[HeyGen 9:16]', err))
      );
    }

    // ── 3. Elai: Translated Vertical (9:16) for Global Markets (Pairing) -> 15x Content Velocity
    if (ELAI_API_KEY && ELAI_AVATAR_ID) {
      dispatchPromises.push(
        elaiRequest('/videos', 'POST', {
          name: `${title} - Vertical (Elai)`,
          avatar_id: ELAI_AVATAR_ID,
          slides: [{ speech: { text: script_text.slice(0, 3000) } }],
          // Elai implicitly adapts or we use CSS crop in post-process, 
          // but we lock the job as vertical layout
        }).then(resp => {
          if (resp.id) {
             jobsToInsert.push({
               blog_post_id: blog_post_id || null, provider_video_id: resp.id, provider: 'elai',
               language: 'en', status: 'rendering', heygen_status: 'rendering', script_text, topic_slug: topic_slug || null, format: '9:16'
            });
          }
        }).catch(err => console.error('[Elai]', err))
      );
    }

    // Wait for all api triggers to resolve
    await Promise.all(dispatchPromises);

    if (jobsToInsert.length === 0) {
      return NextResponse.json({ error: 'No video providers successfully triggered.' }, { status: 503 });
    }

    // ── Store all generated multi-channel video jobs concurrently
    const { data: insertedJobs, error: jobErr } = await supabase
      .from('video_jobs')
      .insert(jobsToInsert)
      .select();

    if (jobErr) throw jobErr;

    // ── Update Content Queue & Blog Post Tracker (Track Primary HeyGen if exists)
    const masterJob = jobsToInsert.find(j => j.provider === 'heygen' && j.format === '16:9') || jobsToInsert[0];
    
    if (content_queue_id) {
      await supabase.from('content_queue').update({
        heygen_video_id: masterJob.provider_video_id,
        heygen_status: 'rendering',
      }).eq('id', content_queue_id);
    }
    
    if (blog_post_id) {
      await supabase.from('blog_posts').update({
        heygen_video_id: masterJob.provider_video_id,
        video_status: `rendering_omni_channel`,
      }).eq('id', blog_post_id);
    }

    return NextResponse.json({ 
        ok: true, 
        jobs_created: jobsToInsert.length, 
        variants: jobsToInsert.map(j => ({ provider: j.provider, format: j.format, id: j.provider_video_id })) 
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[video/create]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
