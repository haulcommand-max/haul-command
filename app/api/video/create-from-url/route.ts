import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const ELAI_API_KEY = process.env.ELAI_API_KEY;
const ELAI_BASE_URL = 'https://apis.elai.io/api/v1';
const AVATAR_ID = process.env.ELAI_AVATAR_ID || '';

async function elaiRequest(path: string, method = 'GET', body?: unknown) {
  const res = await fetch(`${ELAI_BASE_URL}${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${ELAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });
  if (!res.ok) throw new Error(`Elai API error ${res.status}: ${await res.text()}`);
  return res.json();
}

// POST /api/video/create-from-url
// Body: { blog_post_id, article_url, title }
export async function POST(req: NextRequest) {
  if (!ELAI_API_KEY) {
    return NextResponse.json({ error: 'ELAI_API_KEY not configured' }, { status: 503 });
  }

  const body = await req.json();
  const { blog_post_id, article_url, title } = body;
  if (!blog_post_id || !article_url) {
    return NextResponse.json({ error: 'blog_post_id and article_url are required' }, { status: 400 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  try {
    // Create English video from URL (Elai's article-to-video feature)
    const elaiVideo = await elaiRequest('/videos/from-url', 'POST', {
      url: article_url,
      name: title || `HC Blog — ${new Date().toISOString().split('T')[0]}`,
      avatar_id: AVATAR_ID,
      voice_language: 'en',
      summarize: true,
    });

    // Store video job
    const { data: job, error } = await supabase.from('video_jobs').insert({
      blog_post_id,
      elai_video_id: elaiVideo.id,
      language: 'en',
      source_url: article_url,
      status: 'rendering',
    }).select().single();

    if (error) throw error;

    // Update blog post
    await supabase.from('blog_posts').update({
      elai_video_id: elaiVideo.id,
      video_status: 'rendering_en',
      video_generated: false,
    }).eq('id', blog_post_id);

    return NextResponse.json({ ok: true, job_id: job.id, elai_video_id: elaiVideo.id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
