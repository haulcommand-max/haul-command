import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

export const revalidate = 3600; // Revalidate every 1 hour

export async function GET() {
  const supabase = createClient();

  const { data: posts } = await supabase
    .from('blog_posts')
    .select('title, slug, meta_description, published_at, hero_image_url, country_code')
    .eq('published', true)
    .order('published_at', { ascending: false })
    .limit(50);

  const items = (posts || []).map(post => {
    const url = `https://www.haulcommand.com/blog/${post.slug}`;
    const pubDate = new Date(post.published_at).toUTCString();
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <pubDate>${pubDate}</pubDate>
      <description><![CDATA[${post.meta_description || ''}]]></description>
      ${post.country_code ? `<category>${post.country_code}</category>` : ''}
      <content:encoded><![CDATA[
        <p>${post.meta_description || ''}</p>
        <hr/>
        <p><strong>→ <a href="https://www.haulcommand.com/claim">Claim your Pilot Car profile on Haul Command</a></strong> — Free listing, verified badge, direct dispatch leads.</p>
      ]]></content:encoded>
    </item>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0"
  xmlns:content="http://purl.org/rss/1.0/modules/content/"
  xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Haul Command | Heavy Haul Intelligence</title>
    <link>https://www.haulcommand.com</link>
    <description>Pilot car regulations, corridor intelligence, and heavy haul operator news across 120 countries.</description>
    <language>en-us</language>
    <copyright>2026 Haul Command</copyright>
    <atom:link href="https://www.haulcommand.com/feed.xml" rel="self" type="application/rss+xml"/>
    <image>
      <url>https://www.haulcommand.com/icon.png</url>
      <title>Haul Command</title>
      <link>https://www.haulcommand.com</link>
    </image>
    ${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      'Content-Type': 'application/rss+xml; charset=utf-8',
      'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
    },
  });
}
