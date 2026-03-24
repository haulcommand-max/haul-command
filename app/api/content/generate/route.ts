import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@/lib/supabase/server';

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY! });

const BLOG_PROMPT = (topic: string, keyword: string, audience: string, country: string) => `
You are a content writer for Haul Command — the global operating system for heavy haul escort operations across 57 countries.

Write a 1,200-word SEO article about: "${topic}"
Target keyword: "${keyword}"
Target audience: ${audience}
Country focus: ${country || 'global (use US as default)'}

STRUCTURE REQUIRED:
- H1: Must contain the exact target keyword
- Introduction: 2 paragraphs, hook the reader immediately with a specific fact or scenario they recognize from their work
- 3-4 H2 sections with practical, actionable content
- FAQ section: 5 questions with answers
- CTA at end: link to haulcommand.com relevant page
- Internal links: mention 2-3 relevant Haul Command pages naturally

TONE: Authoritative, practical, no fluff. Write like a veteran in the industry talking to another professional. Include specific numbers, distances, regulations, and real corridor names. Never say "In conclusion." Never use filler phrases.

OUTPUT FORMAT: Return valid HTML with proper heading tags, paragraph tags, and ordered/unordered lists. Include JSON-LD FAQ schema at the bottom inside a <script type="application/ld+json"> tag.
`;

const LINKEDIN_PROMPT = (topic: string) => `
Write a LinkedIn post for Haul Command about: "${topic}"

RULES:
- Maximum 1,300 characters
- First line must be a hook — a specific number, counterintuitive fact, or direct question
- No emojis except sparingly (max 2)
- Max 3 relevant hashtags at the end
- End with a subtle CTA: "Haul Command — haulcommand.com"
- Write in first person as Haul Command the brand
- Sound like a smart industry insider, not a marketing department

TARGET: logistics directors, operations managers at AV companies, oilfield procurement managers, heavy haul brokers.

OUTPUT: Plain text only. No HTML. No markdown.
`;

const YOUTUBE_PROMPT = (topic: string) => `
Write a YouTube video script for Haul Command about: "${topic}"

FORMAT:
- Hook (0-15 seconds): One sentence that makes them stay. Start with a specific stat, scenario, or surprising fact.
- Intro (15-45 seconds): Who this video is for and exactly what they'll learn.
- Main content (45 seconds - 5 minutes): 3-4 clear sections with timestamps.
  Use format: [0:45] Section Title
- CTA (final 30 seconds): Direct them to haulcommand.com for the relevant tool.

TOTAL LENGTH: Script should read in 5-7 minutes when spoken.
TONE: Conversational, knowledgeable. Like a mentor explaining to a colleague. Not corporate.

OUTPUT: Script only. Mark sections with timestamps.
`;

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    // Internal-only endpoint
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;
    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { queue_id, topic, content_type, target_keyword, target_audience, country_code } = body;

    if (!topic || !content_type || !queue_id) {
      return NextResponse.json({ error: 'queue_id, topic, content_type required' }, { status: 400 });
    }

    const supabase = createClient();

    // Mark as generating
    await supabase
      .from('content_queue')
      .update({ status: 'generating' })
      .eq('id', queue_id);

    let prompt: string;
    switch (content_type) {
      case 'blog_article':
        prompt = BLOG_PROMPT(topic, target_keyword || topic, target_audience, country_code || '');
        break;
      case 'linkedin_post':
        prompt = LINKEDIN_PROMPT(topic);
        break;
      case 'youtube_script':
        prompt = YOUTUBE_PROMPT(topic);
        break;
      default:
        return NextResponse.json({ error: 'Unsupported content_type' }, { status: 400 });
    }

    const response = await anthropic.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 4096,
      messages: [{ role: 'user', content: prompt }],
    });

    const generatedContent = response.content[0].type === 'text' ? response.content[0].text : '';

    // Update queue with generated content
    const newStatus = content_type === 'blog_article' ? 'generated'
      : content_type === 'linkedin_post' ? 'ready_to_post'
      : 'script_ready';

    await supabase
      .from('content_queue')
      .update({
        status: newStatus,
        generated_content: generatedContent,
      })
      .eq('id', queue_id);

    // Auto-publish blog articles
    if (content_type === 'blog_article') {
      const slug = topic
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 80);

      const metaMatch = generatedContent.match(/<h1[^>]*>(.*?)<\/h1>/i);
      const title = metaMatch ? metaMatch[1].replace(/<[^>]+>/g, '') : topic;
      const metaDesc = topic.slice(0, 160);

      const { data: post } = await supabase
        .from('blog_posts')
        .insert({
          slug,
          title,
          content_html: generatedContent,
          meta_description: metaDesc,
          target_keyword: target_keyword || null,
          country_code: country_code || null,
          published: true,
          published_at: new Date().toISOString(),
        })
        .select('id, slug')
        .single();

      if (post) {
        const publishedUrl = `/blog/${post.slug}`;
        await supabase
          .from('content_queue')
          .update({ status: 'published', published_url: publishedUrl, published_at: new Date().toISOString() })
          .eq('id', queue_id);

        // Ping Google Indexing API
        await pingGoogleIndexing(`${process.env.NEXT_PUBLIC_SITE_URL}${publishedUrl}`);
      }
    }

    return NextResponse.json({ success: true, status: newStatus, content_length: generatedContent.length });
  } catch (error: any) {
    console.error('Content generate error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

async function pingGoogleIndexing(url: string) {
  try {
    const serviceAccountKey = process.env.GOOGLE_INDEXING_SERVICE_ACCOUNT_JSON;
    if (!serviceAccountKey) return;
    // Fire-and-forget — Google Indexing API call
    // Full JWT implementation would go here with the service account key
    console.log(`[Google Indexing] Pinging: ${url}`);
  } catch (err) {
    console.error('Google Indexing ping failed:', err);
  }
}
