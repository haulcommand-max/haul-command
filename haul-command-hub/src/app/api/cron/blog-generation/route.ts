import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Ensure this script only runs via Vercel Cron or secure trigger
export async function GET(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      // Allow execution without auth ONLY IN DEV
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Call the external AI provider to generate an article
    // To implement "Gemini Vision" or "Gemini 1.5 Flash", simply inject the fetch here.
    // For this boilerplate, we simulate an article generation focused on high-traffic SEO keywords:
    const seoTopics = [
      { slug: 'future-of-spmt-transport', title: 'The Future of SPMT Transport in Heavy Haul Logistics' },
      { slug: 'escort-insurance-requirements', title: 'Ultimate Guide to Pilot Car Escort Insurance in 2026' },
      { slug: 'superload-bridge-assessments', title: 'How Engineers Perform Superload Bridge Assessments' }
    ];

    // Pick top missing topic
    const { data: existing } = await supabase.from('hc_blog_articles').select('slug');
    const existingSlugs = new Set((existing || []).map(e => e.slug));
    
    const topicToGenerate = seoTopics.find(t => !existingSlugs.has(t.slug));

    if (!topicToGenerate) {
      return NextResponse.json({ message: 'No new topics strictly queued for generation' });
    }

    // SIMULATED: In a real implementation this calls Gemini API:
    // const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro-latest:generateContent?key=${process.env.GEMINI_API_KEY}`, { ... })
    // const content = res.data.content;
    
    const simulatedArticleContent = `
# ${topicToGenerate.title}

*Generated automatically to meet heavy haul intelligence standards.*

When transporting massive oversize elements, modern logistics companies have turned to specialized tools. 
This article provides an in-depth exploration of the requirements, standards, and regulatory frameworks required.

## Key Considerations

Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. 
Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.

## Compliance and Engineering

Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. 
Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.

*(Note: Connect Google Vertex / Gemini API here for full 1500+ word deep-dives)*
    `;

    const newArticle = {
        slug: topicToGenerate.slug,
        title: topicToGenerate.title,
        content: simulatedArticleContent,
        excerpt: 'An automated intelligence report on modern oversize logistics trends.',
        author_name: 'Haul Command AI',
        status: 'published',
        published_at: new Date().toISOString()
    };

    const { error } = await supabase.from('hc_blog_articles').insert(newArticle);

    if (error) throw error;

    return NextResponse.json({ success: true, article_generated: topicToGenerate.slug });
  } catch (err: any) {
    console.error('Cron Blog Gen Error:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
