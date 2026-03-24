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
    if (useHeygen) {
      // ── HeyGen: direct script → avatar video
      const resp = await heygenRequest('/v2/video/generate', 'POST', {
        video_inputs: [{
          character: {
            type: 'avatar',
            avatar_id: HEYGEN_AVATAR,
            avatar_style: 'normal',
          },
          voice: {
            type: 'text',
            input_text: script_text.slice(0, 4000), // HeyGen max per scene
            voice_id: HEYGEN_VOICE,
            speed: 1.0,
            pitch: 0,
          },
          background: { type: 'color', value: '#0A0A0F' },
        }],
        dimension: { width: 1280, height: 720 },
        aspect_ratio: '16:9',
        caption: true,
        test: process.env.NODE_ENV !== 'production', // free test renders in dev
      });
      providerVideoId = resp.data?.video_id;
      provider = 'heygen';
    } else if (ELAI_API_KEY) {
      // ── Elai fallback
      const resp = await elaiRequest('/videos', 'POST', {
        name: title,
        avatar_id: ELAI_AVATAR_ID,
        slides: [{ speech: { text: script_text.slice(0, 3000) } }],
      });
      providerVideoId = resp.id;
      provider = 'elai';
    } else {
      return NextResponse.json({ error: 'No video provider configured (need HEYGEN_API_KEY or ELAI_API_KEY)' }, { status: 503 });
    }

    // ── Store video job
    const { data: job, error: jobErr } = await supabase
      .from('video_jobs')
      .insert({
        blog_post_id: blog_post_id || null,
        provider_video_id: providerVideoId,
        provider,
        language: 'en',
        status: 'rendering',
        heygen_status: 'rendering',
        script_text,
        topic_slug: topic_slug || null,
        attempts: 0,
      })
      .select()
      .single();

    if (jobErr) throw jobErr;

    // ── Update content_queue if present
    if (content_queue_id) {
      await supabase.from('content_queue').update({
        heygen_video_id: providerVideoId,
        heygen_status: 'rendering',
      }).eq('id', content_queue_id);
    }
    if (blog_post_id) {
      await supabase.from('blog_posts').update({
        heygen_video_id: providerVideoId,
        video_status: `rendering_en_${provider}`,
      }).eq('id', blog_post_id);
    }

    return NextResponse.json({ ok: true, job_id: job.id, provider, provider_video_id: providerVideoId });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[video/create]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
