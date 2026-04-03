# Haul Command Advanced Sitemaps (Image & Video)

## Image Sitemap Seed Plan (`/image-sitemap.xml`)
Google Image search is a massive inbound funnel for gear requirements, truck setups, and height pole specs.

### Schema Template
```xml
<url>
  <loc>https://www.haulcommand.com/blog/heavy-haul-gear-guide</loc>
  <image:image>
    <image:loc>https://www.haulcommand.com/_next/image?url=...</image:loc>
    <image:title>Verified Pilot Car Operator Gear Check</image:title>
    <image:caption>Standard PPE and height pole setup for certified operators.</image:caption>
    <image:license>https://www.haulcommand.com/legal/terms</image:license>
  </image:image>
</url>
```

### Seed Lists (Prioritized for Generation)
1. **Gear & Equipment**: Images of Height Poles, Amber Lights, Oversize Banners (Target: "What size flags for oversize load in Texas?")
2. **Corridor Maps**: Infographics of routes, weigh stations, and choke points.
3. **Role Identities**: Operator, Broker, Driver avatars for trust-building.
4. **App Screenshots**: Branded iOS/Android framing of the dashboard.

## Video Sitemap Seed Plan (`/video-sitemap.xml`)
Video snippets claim top billing in Google SERPs for "how-to" queries.

### Schema Template
```xml
<url>
  <loc>https://www.haulcommand.com/training/route-surveys</loc>
  <video:video>
    <video:thumbnail_loc>https://www.haulcommand.com/assets/video/route-survey-thumb.jpg</video:thumbnail_loc>
    <video:title>How to conduct a Heavy Haul Route Survey</video:title>
    <video:description>Step-by-step guide on mapping bridges, low wires, and turning radius for superloads.</video:description>
    <video:content_loc>https://www.haulcommand.com/assets/video/route-survey.mp4</video:content_loc>
    <video:publication_date>2026-04-03T00:00:00+00:00</video:publication_date>
    <video:duration>350</video:duration>
    <video:family_friendly>yes</video:family_friendly>
    <video:requires_subscription>no</video:requires_subscription>
  </video:video>
</url>
```

### Seed Lists (Prioritized for Recording/Animation)
1. **Platform Walkthroughs**: How to post a load, how to claim a profile.
2. **Safety Training Shorts**: 30-second clips on positioning at intersections.
3. **App Promos**: Cinematic trailer for the Haul Command app.
