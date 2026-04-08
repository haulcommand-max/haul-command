/**
 * lib/seo/knowledgePanel.ts
 * Haul Command — Knowledge Panel + LCP + Alt-Text AI Pipeline
 *
 * 1. buildKnowledgePanelJsonLd() — Organization + sameAs + LocalBusiness for Google Knowledge Panel
 * 2. buildLcpPreloadTags() — Returns link[rel=preload] elements for Next.js head (LCP optimization)
 * 3. generateAltTextForOperatorImage() — Calls Gemini vision to produce semantic alt text, writes to DB
 */

import { GoogleGenerativeAI } from '@google/generative-ai';
import { createClient } from '@supabase/supabase-js';

// ─── 1. Knowledge Panel JSON-LD ──────────────────────────
const HC_SOCIAL_PROFILES = [
  'https://www.facebook.com/haulcommand',
  'https://twitter.com/haulcommand',
  'https://www.linkedin.com/company/haulcommand',
  'https://www.instagram.com/haulcommand',
  'https://www.youtube.com/@haulcommand',
  'https://www.crunchbase.com/organization/haul-command',
];

export function buildKnowledgePanelJsonLd(): Record<string, unknown> {
  const base = 'https://haulcommand.com';

  return {
    '@context': 'https://schema.org',
    '@graph': [
      // ── Organization ──────────────────────────────────
      {
        '@type': 'Organization',
        '@id': `${base}/#organization`,
        name: 'Haul Command',
        alternateName: ['HaulCommand', 'Haul Command Platform'],
        url: base,
        logo: {
          '@type': 'ImageObject',
          url: `${base}/icons/icon-512.png`,
          width: 512,
          height: 512,
        },
        description:
          'Haul Command is the command center for heavy haul logistics — connecting oversize load brokers with verified pilot car operators across 120 countries through real-time dispatch, trust scoring, and corridor intelligence.',
        foundingDate: '2024',
        numberOfEmployees: { '@type': 'QuantitativeValue', value: 10 },
        knowsAbout: [
          'Pilot Car Operations',
          'Oversize Load Transportation',
          'Heavy Haul Logistics',
          'Escort Vehicle Services',
          'Transportation Permits',
        ],
        areaServed: {
          '@type': 'AdministrativeArea',
          name: 'Worldwide',
        },
        sameAs: HC_SOCIAL_PROFILES,
        contactPoint: [
          {
            '@type': 'ContactPoint',
            contactType: 'customer support',
            url: `${base}/support`,
            availableLanguage: ['English', 'French', 'Spanish'],
          },
        ],
      },

      // ── WebSite (sitelinks searchbox) ─────────────────
      {
        '@type': 'WebSite',
        '@id': `${base}/#website`,
        url: base,
        name: 'Haul Command',
        description: 'The command center for heavy haul — pilot cars, oversize escorts, corridor intelligence.',
        publisher: { '@id': `${base}/#organization` },
        potentialAction: {
          '@type': 'SearchAction',
          target: {
            '@type': 'EntryPoint',
            urlTemplate: `${base}/directory?q={search_term_string}`,
          },
          'query-input': 'required name=search_term_string',
        },
      },

      // ── SoftwareApplication (enables "Get it on" panel) ─
      {
        '@type': 'SoftwareApplication',
        name: 'Haul Command',
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web, iOS, Android',
        url: base,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
          description: 'Free to claim operator profile. Premium plans available.',
        },
        publisher: { '@id': `${base}/#organization` },
      },
    ],
  };
}

// ─── 2. LCP Preload Tags ──────────────────────────────────
interface LcpAsset {
  href: string;
  as: 'image' | 'font' | 'script' | 'style';
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  fetchPriority?: 'high' | 'low' | 'auto';
  media?: string;
}

/**
 * Returns the list of LCP-critical assets that should be in the Next.js head.
 * Import in app/layout.tsx and render:
 *   {getLcpPreloadAssets().map(a => <link key={a.href} rel="preload" {...a} />)}
 */
export function getLcpPreloadAssets(): LcpAsset[] {
  return [
    // Hero map / heatmap WebP
    {
      href: '/images/hero-map.webp',
      as: 'image',
      type: 'image/webp',
      fetchPriority: 'high',
    },
    // Primary font (Inter subset)
    {
      href: 'https://fonts.gstatic.com/s/inter/v13/UcCO3FwrK3iLTeHuS_fvQtMwCp50KnMw2boKoduKmMEVuLyfAZ9hiJ-Ek-_EeA.woff2',
      as: 'font',
      type: 'font/woff2',
      crossOrigin: 'anonymous',
    },
    // Dashboard operator page — map overlay
    {
      href: '/images/coverage-heatmap.webp',
      as: 'image',
      type: 'image/webp',
      media: '(min-width: 768px)',
    },
    // Brand logo SVG
    {
      href: '/icons/hc-logo.svg',
      as: 'image',
      type: 'image/svg+xml',
      fetchPriority: 'high',
    },
  ];
}

// ─── 3. Alt-Text AI Automation ───────────────────────────
/**
 * Called by: Supabase webhook on operator_media INSERT
 * POST /api/media/generate-alt-text { media_id, image_url, entity_id }
 *
 * Uses Gemini vision to produce semantic alt text for:
 *   - Truck/pilot car photos
 *   - Vehicle equipment photos
 *   - Profile photos
 * Then writes back to operator_media.alt_text
 */
export async function generateAltTextForOperatorImage(params: {
  media_id: string;
  image_url: string;
  entity_id: string;
  media_type?: 'vehicle' | 'equipment' | 'profile' | 'location';
}): Promise<{ alt_text: string; confidence: 'high' | 'medium' | 'low' }> {
  const genAI = new GoogleGenerativeAI(process.env.GOOGLE_GENERATIVE_AI_API_KEY!);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
  const db = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const typeContext: Record<string, string> = {
    vehicle: 'This is a pilot car or escort vehicle used in heavy haul transportation.',
    equipment: 'This shows equipment used by a pilot car operator.',
    profile: 'This is a professional profile photo of a pilot car operator.',
    location: 'This shows a route or location relevant to heavy haul transport.',
  };

  const context = typeContext[params.media_type ?? 'vehicle'];

  const prompt = `${context}
Write a concise, SEO-optimized alt text for this image.
Requirements:
- 1 sentence, max 125 characters
- Include: vehicle type (if visible), any notable equipment, general context
- Natural language — not keyword-stuffed
- Describe what is actually in the image
Return only the alt text string, no quotes or punctuation at the end.`;

  let alt_text = '';
  let confidence: 'high' | 'medium' | 'low' = 'medium';

  try {
    // Fetch the image as base64 for Gemini vision
    const imageRes = await fetch(params.image_url);
    if (!imageRes.ok) throw new Error('Image fetch failed');
    const buffer = await imageRes.arrayBuffer();
    const base64 = Buffer.from(buffer).toString('base64');
    const mimeType = imageRes.headers.get('content-type') ?? 'image/jpeg';

    const result = await model.generateContent([
      { text: prompt },
      { inlineData: { mimeType, data: base64 } },
    ]);

    alt_text = result.response.text().trim().replace(/["'.]$/, '');
    confidence = alt_text.length > 20 ? 'high' : 'medium';
  } catch (err) {
    console.error('[generateAltText] AI error', err);
    // Fallback alt text
    alt_text = `Pilot car operator vehicle — Haul Command`;
    confidence = 'low';
  }

  // Write back to operator_media
  await db
    .from('operator_media')
    .update({
      alt_text,
      alt_text_generated_at: new Date().toISOString(),
      alt_text_confidence: confidence,
    })
    .eq('id', params.media_id);

  // Emit event
  await db.from('hc_events').insert({
    event_type: 'media.alt_text_generated',
    event_source: 'alt_text_pipeline',
    entity_id: params.entity_id,
    entity_type: 'operator',
    payload_json: { media_id: params.media_id, confidence, alt_text_length: alt_text.length },
  });

  return { alt_text, confidence };
}
