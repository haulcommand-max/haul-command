import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// GET /api/cron/rss-alerts
// Fetches all active RSS feeds, checks for new items, creates content_topics
export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { cookies: { getAll() { return cookieStore.getAll(); }, setAll() {} } }
  );

  const { data: feeds } = await supabase.from('rss_feed_config')
    .select('*').eq('is_active', true);

  if (!feeds?.length) return NextResponse.json({ ok: true, processed: 0 });

  const results: string[] = [];
  let totalNew = 0;

  for (const feed of feeds) {
    if (feed.url.includes('REPLACE_')) {
      results.push(`${feed.name}: skipped (URL not yet configured)`);
      continue;
    }

    try {
      const res = await fetch(feed.url, {
        headers: { 'User-Agent': 'HaulCommand-ContentBot/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      const xml = await res.text();

      // Simple RSS parser (no external deps)
      const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].map(m => {
        const item = m[1];
        const title = item.match(/<title>([\s\S]*?)<\/title>/)?.[1]?.replace(/<!\[CDATA\[|\]\]>/g, '').trim() || '';
        const link = item.match(/<link>([\s\S]*?)<\/link>/)?.[1]?.trim() || '';
        const guid = item.match(/<guid>([\s\S]*?)<\/guid>/)?.[1]?.trim() || link;
        const pubDate = item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1]?.trim() || '';
        return { title, link, guid, pubDate };
      });

      for (const item of items.slice(0, 5)) { // process max 5 per feed per run
        if (!item.title || !item.guid) continue;

        // Check if already processed
        const { data: existing } = await supabase.from('rss_alert_items')
          .select('id').eq('feed_url', feed.url).eq('item_guid', item.guid).single();

        if (existing) continue;

        // Store the alert item
        await supabase.from('rss_alert_items').insert({
          feed_url: feed.url,
          item_guid: item.guid,
          title: item.title,
          link: item.link,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : null,
          topic_created: false,
        });

        // Create content topic from alert
        const keyword = item.title.slice(0, 100);
        const topic = `Industry update: ${item.title}`;

        await supabase.from('content_topics').insert({
          topic,
          keyword,
          type: feed.topic_type || 'blog_article',
          audience: feed.audience || 'general_public',
          country_code: feed.country_code || null,
          priority: feed.priority || 2,
          source: 'google_alert',
          notes: `From RSS: ${feed.name} — ${item.link}`,
        });

        // Mark alert as topic-created
        await supabase.from('rss_alert_items')
          .update({ topic_created: true })
          .eq('feed_url', feed.url).eq('item_guid', item.guid);

        totalNew++;
        results.push(`${feed.name}: new topic → "${keyword.slice(0, 60)}"`);
      }
    } catch (err) {
      results.push(`${feed.name}: error — ${err}`);
    }
  }

  return NextResponse.json({ ok: true, feeds_checked: feeds.length, new_topics: totalNew, results });
}
