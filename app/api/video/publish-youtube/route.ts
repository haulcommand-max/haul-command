/**
 * POST /api/video/publish-youtube
 * Uploads approved video(s) to corresponding YouTube channel per language.
 * Body: { content_queue_id?, blog_post_id?, languages?: string[] }
 */
import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const YOUTUBE_API_KEY         = process.env.YOUTUBE_API_KEY;
const YOUTUBE_CLIENT_ID       = process.env.YOUTUBE_CLIENT_ID;
const YOUTUBE_CLIENT_SECRET   = process.env.YOUTUBE_CLIENT_SECRET;

// Per-language channel refresh tokens (stored as env vars)
// YOUTUBE_REFRESH_TOKEN_EN, YOUTUBE_REFRESH_TOKEN_ES, etc.
const LANG_CHANNELS: Record<string, string> = {
  en: 'Haul Command',
  es: 'Haul Command Español',
  pt: 'Haul Command Português',
  de: 'Haul Command Deutsch',
  fr: 'Haul Command Français',
  ar: 'Haul Command العربية',
  nl: 'Haul Command Nederlands',
  ja: 'Haul Command 日本語',
  ko: 'Haul Command 한국어',
  hi: 'Haul Command हिंदी',
};

async function getAccessToken(lang: string): Promise<string | null> {
  const refreshToken = process.env[`YOUTUBE_REFRESH_TOKEN_${lang.toUpperCase()}`];
  if (!refreshToken || !YOUTUBE_CLIENT_ID || !YOUTUBE_CLIENT_SECRET) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     YOUTUBE_CLIENT_ID,
      client_secret: YOUTUBE_CLIENT_SECRET,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

async function uploadToYouTube(params: {
  accessToken: string;
  videoUrl: string;
  title: string;
  description: string;
  tags: string[];
  language: string;
}): Promise<string | null> {
  // First download the video blob from Supabase Storage
  const videoRes = await fetch(params.videoUrl);
  if (!videoRes.ok) throw new Error(`Could not download video from ${params.videoUrl}`);
  const videoBlob = await videoRes.blob();

  // YouTube resumable upload
  const initRes = await fetch(
    `https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${params.accessToken}`,
        'Content-Type': 'application/json',
        'X-Upload-Content-Type': 'video/mp4',
        'X-Upload-Content-Length': String(videoBlob.size),
      },
      body: JSON.stringify({
        snippet: {
          title: params.title.slice(0, 100),
          description: params.description,
          tags: params.tags.slice(0, 30),
          defaultLanguage: params.language,
          categoryId: '27', // Education
        },
        status: {
          privacyStatus: 'public',
          selfDeclaredMadeForKids: false,
        },
      }),
    }
  );

  const uploadUrl = initRes.headers.get('Location');
  if (!uploadUrl) throw new Error('YouTube did not return upload URL');

  // Upload video
  const uploadRes = await fetch(uploadUrl, {
    method: 'PUT',
    headers: { 'Content-Type': 'video/mp4' },
    body: videoBlob,
  });

  if (!uploadRes.ok) {
    const errText = await uploadRes.text();
    throw new Error(`YouTube upload failed: ${errText.slice(0,200)}`);
  }

  const uploadData = await uploadRes.json();
  return uploadData.id || null; // YouTube video ID
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') || req.headers.get('x-admin-secret');
  if (secret !== process.env.CRON_SECRET && secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const { content_queue_id, blog_post_id, languages = ['en'] } = body;

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  // Fetch the content record
  let record: Record<string, unknown> | null = null;
  if (blog_post_id) {
    const { data } = await supabase.from('blog_posts').select('*').eq('id', blog_post_id).single();
    record = data;
  } else if (content_queue_id) {
    const { data } = await supabase.from('content_queue').select('*').eq('id', content_queue_id).single();
    record = data;
  }

  if (!record) {
    return NextResponse.json({ error: 'Content record not found' }, { status: 404 });
  }

  const results: { lang: string; status: string; youtube_url?: string }[] = [];

  for (const lang of languages) {
    const videoUrl = (record[`video_url_${lang}`] as string) || (lang === 'en' ? (record.video_url_en as string) : null);
    if (!videoUrl) {
      results.push({ lang, status: 'skipped — no video URL' });
      continue;
    }

    const accessToken = await getAccessToken(lang);
    if (!accessToken) {
      results.push({ lang, status: 'skipped — no YouTube credentials for this language' });
      continue;
    }

    try {
      // Generate localized title + description via simple template
      const title       = record.title as string || 'Haul Command — Heavy Haul Intelligence';
      const localTitle  = lang === 'en' ? title : `${title} [${lang.toUpperCase()}]`;
      const description = [
        lang === 'en'
          ? `${(record.meta_description as string) || title}`
          : `${title} — ${LANG_CHANNELS[lang]}`,
        '',
        '📱 Get the Haul Command app: https://haulcommand.com',
        '🎓 AV-Ready Certification: https://haulcommand.com/training/av-certification',
        '🛢️ Oilfield Escorts: https://haulcommand.com/corridors/oilfield',
        '',
        '#HaulCommand #HeavyHaul #PilotCar #OversizeLoad #FreightLogistics',
      ].join('\n');

      const tags = [
        'heavy haul', 'pilot car', 'escort vehicle', 'oversize load',
        'haul command', 'freight', 'trucking', 'logistics',
      ];

      const ytVideoId = await uploadToYouTube({
        accessToken,
        videoUrl,
        title: localTitle,
        description,
        tags,
        language: lang,
      });

      if (ytVideoId) {
        const ytUrl = `https://www.youtube.com/watch?v=${ytVideoId}`;
        const col   = lang === 'en' ? 'youtube_url_en' : `youtube_url_${lang}`;

        if (blog_post_id)     await supabase.from('blog_posts').update({ [col]: ytUrl }).eq('id', blog_post_id);
        if (content_queue_id) await supabase.from('content_queue').update({ [col]: ytUrl }).eq('id', content_queue_id);

        // Update video_jobs record
        await supabase.from('video_jobs').update({ youtube_url: ytUrl, youtube_video_id: ytVideoId })
          .eq('provider_video_id', record[`heygen_video_id`] as string || '')
          .eq('language', lang);

        results.push({ lang, status: 'published', youtube_url: ytUrl });
      }
    } catch (err) {
      results.push({ lang, status: `error — ${String(err).slice(0,150)}` });
    }
  }

  return NextResponse.json({ ok: true, results });
}
