/**
 * POST /api/video/create
 * Governed premium video creation.
 * Called by cron after script generation or manually from admin dashboard.
 * Body: {
 *   content_queue_id?, blog_post_id?, script_text, title, topic_slug?,
 *   money_path, human_needed_score, expected_value_cents, estimated_cost_cents,
 *   manual_approval, translation_approved
 * }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { assertPaidProviderAllowed, type MediaMoneyPath } from '@/lib/media-engine/cost-governor';
import { requireInternalRequest } from '@/lib/security/internal-request-auth';

const HEYGEN_API_KEY = process.env.HEYGEN_API_KEY;
const HEYGEN_BASE = 'https://api.heygen.com';
const HEYGEN_AVATAR = process.env.HEYGEN_AVATAR_ID || '';
const HEYGEN_VOICE = process.env.HEYGEN_VOICE_ID || '';

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

export async function POST(req: NextRequest) {
  const authFailure = requireInternalRequest(req);
  if (authFailure) return authFailure;

  const body = await req.json();
  const {
    content_queue_id,
    blog_post_id,
    script_text,
    topic_slug,
    money_path,
    human_needed_score,
    expected_value_cents,
    estimated_cost_cents,
    manual_approval,
    translation_approved,
  } = body;

  if (!script_text) {
    return NextResponse.json({ error: 'script_text is required' }, { status: 400 });
  }

  const paidProviderDecision = assertPaidProviderAllowed({
    assetType: 'video',
    sourceType: 'manual_script',
    moneyPath: (money_path ?? 'none') as MediaMoneyPath,
    humanNeededScore: Number(human_needed_score ?? 0),
    expectedValueCents: Number(expected_value_cents ?? 0),
    estimatedCostCents: Number(estimated_cost_cents ?? 0),
    requiresAvatar: true,
    requiresVoice: true,
    manualApproval: manual_approval === true,
  });

  if (!paidProviderDecision.allowed) {
    return NextResponse.json(
      { error: 'Paid avatar video blocked by Media Cost Governor', cost_governor: paidProviderDecision },
      { status: 409 },
    );
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } },
  );

  try {
    const jobsToInsert: any[] = [];
    const dispatchPromises: Promise<any>[] = [];
    const jobGovernance = {
      media_money_path: (money_path ?? 'none') as MediaMoneyPath,
      human_needed_score: Number(human_needed_score ?? 0),
      expected_value_cents: Number(expected_value_cents ?? 0),
      estimated_cost_cents: Number(estimated_cost_cents ?? 0),
      translation_approved: translation_approved === true,
      cost_governor_decision: paidProviderDecision,
    };

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
        }).then((resp) => {
          if (resp.data?.video_id) {
            jobsToInsert.push({
              blog_post_id: blog_post_id || null,
              content_queue_id: content_queue_id || null,
              provider_video_id: resp.data.video_id,
              provider: 'heygen',
              language: 'en',
              status: 'rendering',
              heygen_status: 'rendering',
              script_text,
              topic_slug: topic_slug || null,
              format: '16:9',
              ...jobGovernance,
            });
          }
        }).catch((err) => console.error('[HeyGen 16:9]', err)),
      );

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
        }).then((resp) => {
          if (resp.data?.video_id) {
            jobsToInsert.push({
              blog_post_id: blog_post_id || null,
              content_queue_id: content_queue_id || null,
              provider_video_id: resp.data.video_id,
              provider: 'heygen',
              language: 'en',
              status: 'rendering',
              heygen_status: 'rendering',
              script_text,
              topic_slug: topic_slug || null,
              format: '9:16',
              ...jobGovernance,
            });
          }
        }).catch((err) => console.error('[HeyGen 9:16]', err)),
      );
    }

    await Promise.all(dispatchPromises);

    if (jobsToInsert.length === 0) {
      return NextResponse.json({ error: 'No governed video providers successfully triggered.' }, { status: 503 });
    }

    const { data: insertedJobs, error: jobErr } = await supabase
      .from('video_jobs')
      .insert(jobsToInsert)
      .select();

    if (jobErr) throw jobErr;

    const masterJob = jobsToInsert.find((job) => job.provider === 'heygen' && job.format === '16:9') || jobsToInsert[0];

    if (content_queue_id) {
      await supabase.from('content_queue').update({
        heygen_video_id: masterJob.provider_video_id,
        heygen_status: 'rendering',
      }).eq('id', content_queue_id);
    }

    if (blog_post_id) {
      await supabase.from('blog_posts').update({
        heygen_video_id: masterJob.provider_video_id,
        video_status: 'rendering_governed_premium',
      }).eq('id', blog_post_id);
    }

    return NextResponse.json({
      ok: true,
      jobs_created: jobsToInsert.length,
      cost_governor: paidProviderDecision,
      variants: (insertedJobs ?? jobsToInsert).map((job: any) => ({
        provider: job.provider,
        format: job.format,
        id: job.provider_video_id,
      })),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[video/create]', msg);
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
