import { NextRequest, NextResponse } from 'next/server';
import { generateAltTextForOperatorImage } from '@/lib/seo/knowledgePanel';

/**
 * POST /api/media/generate-alt-text
 * Supabase webhook receiver — fires when operator_media row is INSERTed.
 *
 * Body: { media_id, image_url, entity_id, media_type? }
 * Guard: x-supabase-signature header (or CRON_SECRET for internal calls)
 */
export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.headers.get('x-supabase-signature');
  if (secret !== process.env.CRON_SECRET && secret !== process.env.SUPABASE_WEBHOOK_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: {
    media_id?: string;
    image_url?: string;
    entity_id?: string;
    media_type?: 'vehicle' | 'equipment' | 'profile' | 'location';
    record?: {
      id: string;
      url: string;
      entity_id: string;
      media_type?: string;
    };
  };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Support both direct calls and Supabase webhook payload format
  const media_id   = body.media_id   ?? body.record?.id;
  const image_url  = body.image_url  ?? body.record?.url;
  const entity_id  = body.entity_id  ?? body.record?.entity_id;
  const media_type = (body.media_type ?? body.record?.media_type) as any;

  if (!media_id || !image_url || !entity_id) {
    return NextResponse.json({ error: 'media_id, image_url, entity_id required' }, { status: 400 });
  }

  try {
    const result = await generateAltTextForOperatorImage({
      media_id,
      image_url,
      entity_id,
      media_type,
    });

    return NextResponse.json({ ok: true, ...result });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    return NextResponse.json({ ok: false, error: msg }, { status: 500 });
  }
}
