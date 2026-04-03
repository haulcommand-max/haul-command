# Haul Command RSS & Subpub Feed Metadata Plan

## Core Architecture
- **Endpoint**: `/feed.xml` and `/api/rss`
- **Format**: RSS 2.0 & Atom (for broader aggregator support)
- **Update Frequency**: Real-time (daily flush) via Vercel Edge Cache.

## Metadata Structure
```xml
<channel>
    <title>Haul Command OS - Intelligence Brief</title>
    <link>https://www.haulcommand.com/blog</link>
    <description>Regulatory changes, corridor warnings, and verified heavy haul operator intelligence.</description>
    <language>en-us</language>
    <copyright>2026 Haul Command, Global Operations</copyright>
    <category>Logistics & Supply Chain</category>
    <image>
        <url>https://www.haulcommand.com/icon.png</url>
        <title>Haul Command</title>
        <link>https://www.haulcommand.com</link>
    </image>
    <!-- Items loop dynamically pulls from supabase `blog_posts` where `status = 'published'` -->
</channel>
```

## Feed Content Template (Per Item)
```xml
<item>
    <title>{post.title}</title>
    <link>https://www.haulcommand.com/blog/{post.slug}</link>
    <pubDate>{post.published_at}</pubDate>
    <guid isPermaLink="true">https://www.haulcommand.com/blog/{post.slug}</guid>
    <description><![CDATA[ {post.excerpt} ]]> </description>
    <!-- Use CDATA for safe HTML rendering in RSS readers -->
    <content:encoded><![CDATA[ 
        {post.html_content} 
        <hr/>
        <a href="https://www.haulcommand.com/claim">Claim your Pilot Car profile on Haul Command</a>
    ]]><content:encoded>
    <author>intelligence@haulcommand.com (Haul Command Central)</author>
</item>
```

## Monetization / Capture Strategy inside RSS
Every RSS `<content:encoded>` block will automatically append a call-to-action (Claim Profile or Join Network) to capture readers who consume the content purely via Feedbin/Feedly without visiting the site.
