import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

const anthropic = new Anthropic({ apiKey: process.env.OPENAI_API_KEY });

const TIER_QUOTA: Record<string, number> = {
  us: 8, au: 4, gb: 4, ca: 4, de: 4, ae: 4, nz: 4, za: 4, nl: 4, br: 4,
};

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').slice(0, 80);
}

async function generateArticle(topic: string, keyword: string, audience: string, country: string | null) {
  const countryCtx = country ? ` Focus on ${country.toUpperCase()} market context and regulations.` : '';
  const audienceMap: Record<string, string> = {
    escort_operator: 'an escort/pilot car operator seeking practical guidance',
    broker: 'a freight broker who hires escort operators',
    av_company: 'an autonomous vehicle operations director',
    general_public: 'someone researching escort requirements',
  };

  const prompt = `Write a comprehensive, expert-level blog article for ${audienceMap[audience] || audienceMap.general_public} about: "${topic}"

Primary SEO keyword: "${keyword}"
Requirements: 1,200+ words, specific regulations/rates/corridor names, H2 subheadings, FAQ section, CTA to haulcommand.com.${countryCtx}

Respond ONLY with valid JSON:
{"title":"<60 char SEO title>","meta_description":"<155 char description>","summary":"<2-sentence social summary>","content":"<full markdown>"}`;

  const response = await anthropic.messages.create({
    model: 'claude-opus-4-5',
    max_tokens: 4096,
    messages: [{ role: 'user', content: prompt }],
  });

  const text = response.content[0].type === 'text' ? response.content[0].text : '{}';
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in Claude response');
  const parsed = JSON.parse(jsonMatch[0]);
  return { ...parsed, word_count: parsed.content?.split(/\s+/).length || 0 };
}

export async function POST(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  const isAdmin = req.headers.get('x-admin-secret') === process.env.HC_ADMIN_SECRET;
  if (secret !== process.env.CRON_SECRET && !isAdmin) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await req.json();
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  let topicId: string | null = body.topic_id || null;
  let topicRow: { topic: string; keyword: string; audience: string; country_code: string | null } | null = null;

  if (topicId) {
    const { data } = await supabase.from('content_topics').select('*').eq('id', topicId).single();
    topicRow = data;
  } else if (body.topic) {
    topicRow = { topic: body.topic, keyword: body.keyword || body.topic, audience: body.audience || 'general_public', country_code: body.country_code || null };
  } else {
    const { data } = await supabase.from('content_topics').select('*').eq('status', 'pending').order('priority').order('created_at').limit(1).single();
    topicRow = data;
    topicId = data?.id;
  }

  if (!topicRow) return NextResponse.json({ error: 'No pending topics found' }, { status: 404 });

  // Country tier quota check
  if (topicRow.country_code) {
    const monthStart = new Date(); monthStart.setDate(1); monthStart.setHours(0, 0, 0, 0);
    const { count } = await supabase.from('blog_posts').select('*', { count: 'exact', head: true })
      .eq('country_code', topicRow.country_code).gte('created_at', monthStart.toISOString());
    const quota = TIER_QUOTA[topicRow.country_code] ?? 1;
    if ((count || 0) >= quota) return NextResponse.json({ skipped: true, reason: `Quota (${quota}/mo) met for ${topicRow.country_code}` });
  }

  if (topicId) await supabase.from('content_topics').update({ status: 'generating', assigned_at: new Date().toISOString() }).eq('id', topicId);

  try {
    const article = await generateArticle(topicRow.topic, topicRow.keyword, topicRow.audience, topicRow.country_code);
    const slug = `${slugify(topicRow.keyword)}-${Date.now()}`;

    const { data: post, error } = await supabase.from('blog_posts').insert({
      topic_id: topicId, slug, title: article.title, meta_description: article.meta_description,
      content: article.content, summary: article.summary, keyword: topicRow.keyword,
      country_code: topicRow.country_code, audience: topicRow.audience,
      status: 'draft', published: false, word_count: article.word_count,
    }).select().single();

    if (error) throw error;
    if (topicId) await supabase.from('content_topics').update({ status: 'done', completed_at: new Date().toISOString(), blog_post_id: post.id }).eq('id', topicId);

    return NextResponse.json({ ok: true, post_id: post.id, slug, word_count: article.word_count });
  } catch (err: unknown) {
    if (topicId) await supabase.from('content_topics').update({ status: 'pending' }).eq('id', topicId);
    return NextResponse.json({ error: err instanceof Error ? err.message : 'Failed' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  const isAdmin = req.headers.get('x-admin-secret') === process.env.HC_ADMIN_SECRET;
  if (!isAdmin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const cookieStore = await cookies();
  const supabase = createServerClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } });
  const { data: topics, count } = await supabase.from('content_topics').select('*', { count: 'exact' }).eq('status', 'pending').order('priority').order('created_at').limit(20);
  return NextResponse.json({ topics, pending_count: count });
}
