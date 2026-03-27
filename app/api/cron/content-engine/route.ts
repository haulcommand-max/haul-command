import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { see } from '@/lib/ai/brain';
import { PROMPTS } from '@/lib/ai/prompts';
import { tracked } from '@/lib/ai/tracker';
import { cacheGet, cacheSet, CACHE_TTL } from '@/lib/ai/cache';

export const dynamic = 'force-dynamic';

// GET /api/cron/content-engine
// Vercel cron: 0 6 * * *
export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createClient();
  const results: any[] = [];

  // Pull next 5 unused topics (was 3 — increased since Gemini is faster+cheaper)
  const { data: topics } = await supabase
    .from('content_topics')
    .select('*')
    .eq('used', false)
    .order('priority', { ascending: true })
    .limit(5);

  if (!topics || topics.length === 0) {
    return NextResponse.json({ message: 'No unused topics remaining', generated: 0 });
  }

  // Process in parallel (Gemini handles concurrent load well)
  const settled = await Promise.allSettled(topics.map(async (topic) => {
    // Insert queue item
    const { data: queueItem } = await supabase
      .from('content_queue')
      .insert({
        content_type: topic.content_type,
        topic: topic.topic,
        target_keyword: topic.keyword ?? null,
        target_audience: topic.target_audience,
        country_code: topic.country_code ?? null,
        status: 'generating',
      })
      .select('id')
      .single();

    if (!queueItem) throw new Error('Failed to create queue item');

    let generatedContent = '';
    let newStatus = 'generated';

    if (topic.content_type === 'blog_article') {
      // Blog = Claude (authoritative, long-form, SEO-critical)
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });
      const res = await anthropic.messages.create({
        model: 'claude-sonnet-4-5',
        max_tokens: 4096,
        messages: [{ role: 'user', content: blogPrompt(topic.topic, topic.keyword, topic.target_audience, topic.country_code) }],
      });
      generatedContent = res.content[0].type === 'text' ? res.content[0].text : '';
      newStatus = 'generated';

    } else if (topic.content_type === 'linkedin_post') {
      // LinkedIn = Gemini Flash (creative, fast, 6x cheaper than Claude)
      const cached = await cacheGet('gemini', 'gemini-2.5-flash', topic.topic);
      if (cached) {
        generatedContent = cached.text;
      } else {
        const res = await tracked('content_linkedin', () =>
          see(PROMPTS.linkedin.user(topic.topic), {
            tier: 'fast',
            system: PROMPTS.linkedin.system,
            maxTokens: 500,
          })
        );
        generatedContent = res.text;
      }
      newStatus = 'ready_to_post';

    } else if (topic.content_type === 'youtube_script') {
      // YouTube = Gemini Flash (creative format, conversational, 6x cheaper)
      const res = await tracked('content_youtube', () =>
        see(PROMPTS.youtube.user(topic.topic), {
          tier: 'fast',
          system: PROMPTS.youtube.system,
          maxTokens: 3000,
        })
      );
      generatedContent = res.text;
      newStatus = 'script_ready';

    } else if (topic.content_type === 'regulation_page') {
      // Regulation = Gemini with Google Search grounding (live accuracy)
      const cacheKey = `regulation:${topic.topic}`;
      const cached = await cacheGet('gemini', 'gemini-2.5-flash', cacheKey);
      if (cached) {
        generatedContent = cached.text;
      } else {
        const res = await tracked('content_regulation', () =>
          see(PROMPTS.regulation_summary.user(topic.topic, topic.target_audience), {
            tier: 'fast',
            system: PROMPTS.regulation_summary.system,
            grounding: true,
            maxTokens: 2000,
          })
        );
        generatedContent = res.text;
        await cacheSet('gemini', 'gemini-2.5-flash', cacheKey, res, CACHE_TTL.regulation);
      }
      newStatus = 'generated';
    }

    // Save generated content
    await supabase.from('content_queue').update({
      status: newStatus,
      generated_content: generatedContent,
    }).eq('id', queueItem.id);

    // Auto-publish blog articles
    if (topic.content_type === 'blog_article' && generatedContent) {
      const slug = topic.topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 80);

      const titleMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const title = titleMatch ? titleMatch[1].replace(/<[^>]+>/g, '') : topic.topic;

      const { data: post } = await supabase.from('blog_posts').insert({
        slug,
        title,
        content_html: generatedContent,
        meta_description: topic.topic.slice(0, 160),
        target_keyword: topic.keyword ?? null,
        country_code: topic.country_code ?? null,
        published: true,
        published_at: new Date().toISOString(),
      }).select('id, slug').single();

      if (post) {
        await supabase.from('content_queue').update({
          status: 'published',
          published_url: `/blog/${post.slug}`,
          published_at: new Date().toISOString(),
        }).eq('id', queueItem.id);
      }
    }

    // Mark topic as used
    await supabase.from('content_topics')
      .update({ used: true, used_at: new Date().toISOString() })
      .eq('id', topic.id);

    return { topic: topic.topic, type: topic.content_type, status: newStatus };
  }));

  for (const s of settled) {
    if (s.status === 'fulfilled') results.push(s.value);
    else results.push({ error: s.reason?.message });
  }

  return NextResponse.json({
    job: 'content-engine-v2',
    timestamp: new Date().toISOString(),
    processed: results.length,
    results,
  });
}

function blogPrompt(topic: string, keyword: string, audience: string, country: string) {
  return `You are a content writer for Haul Command — the global operating system for heavy haul escort operations across 120 countries.

Write a 1,200-word SEO article about: "${topic}"
Target keyword: "${keyword || topic}"
Target audience: ${audience}
Country focus: ${country || 'US (default)'}

STRUCTURE:
- H1 containing exact target keyword
- Introduction: 2 punchy paragraphs (hook = specific fact/scenario from real industry)
- 3-4 H2 sections, each with actionable content and specific numbers
- FAQ section: 5 Q&As
- CTA linking to haulcommand.com/directory or /loads

TONE: Authoritative, practical, zero fluff. Write like a veteran talking to a peer.
Include specific corridor names, state codes, dollar amounts, distances, regulations.
NEVER say "In conclusion". NEVER use filler phrases.

OUTPUT: Valid HTML with h1/h2/p/ul/ol tags + JSON-LD FAQ schema in <script type="application/ld+json">`;
}
