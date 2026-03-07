import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

// Country display names + local terminology
const COUNTRY_META: Record<string, { name: string; term: string; currency: string; locale: string }> = {
    US: { name: 'United States', term: 'Pilot Car', currency: 'USD', locale: 'en' },
    CA: { name: 'Canada', term: 'Pilot Car', currency: 'CAD', locale: 'en' },
    GB: { name: 'United Kingdom', term: 'Escort Vehicle', currency: 'GBP', locale: 'en' },
    AU: { name: 'Australia', term: 'Pilot Vehicle', currency: 'AUD', locale: 'en' },
    NZ: { name: 'New Zealand', term: 'Pilot Vehicle', currency: 'NZD', locale: 'en' },
    DE: { name: 'Deutschland', term: 'Begleitfahrzeug', currency: 'EUR', locale: 'de' },
    FR: { name: 'France', term: 'Véhicule Pilote', currency: 'EUR', locale: 'fr' },
    NL: { name: 'Nederland', term: 'Begeleidingsvoertuig', currency: 'EUR', locale: 'nl' },
    IT: { name: 'Italia', term: 'Veicolo di Scorta', currency: 'EUR', locale: 'it' },
    ES: { name: 'España', term: 'Vehículo Piloto', currency: 'EUR', locale: 'es' },
    BR: { name: 'Brasil', term: 'Batedor', currency: 'BRL', locale: 'pt' },
    MX: { name: 'México', term: 'Vehículo Piloto', currency: 'MXN', locale: 'es' },
    JP: { name: '日本', term: '先導車', currency: 'JPY', locale: 'ja' },
    KR: { name: '대한민국', term: '선도차량', currency: 'KRW', locale: 'ko' },
    AE: { name: 'UAE', term: 'Pilot Car', currency: 'AED', locale: 'en' },
    IN: { name: 'India', term: 'Pilot Vehicle', currency: 'INR', locale: 'en' },
    ZA: { name: 'South Africa', term: 'Pilot Vehicle', currency: 'ZAR', locale: 'en' },
    SG: { name: 'Singapore', term: 'Escort Vehicle', currency: 'SGD', locale: 'en' },
    SE: { name: 'Sverige', term: 'Följebil', currency: 'SEK', locale: 'sv' },
    NO: { name: 'Norge', term: 'Følgebil', currency: 'NOK', locale: 'no' },
    PL: { name: 'Polska', term: 'Pilot Transportu', currency: 'PLN', locale: 'pl' },
    CH: { name: 'Schweiz', term: 'Begleitfahrzeug', currency: 'CHF', locale: 'de' },
};

/**
 * POST /api/adgrid/generate
 * Generate hyper-local ads for a country/corridor/city using ChatGPT
 *
 * Body: { country_code, corridor_code?, city_name?, count?: number }
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { country_code, corridor_code, city_name, count = 3 } = body;

        if (!country_code) {
            return NextResponse.json({ error: 'country_code required' }, { status: 400 });
        }

        const meta = COUNTRY_META[country_code] || {
            name: country_code,
            term: 'Pilot Car',
            currency: 'USD',
            locale: 'en',
        };

        // Get template for this country
        const { data: templates } = await supabaseAdmin
            .from('hc_ad_templates')
            .select('*')
            .eq('country_code', country_code)
            .eq('is_active', true)
            .order('priority', { ascending: false })
            .limit(5);

        // Build the ChatGPT prompt
        const prompt = buildAdPrompt(meta, country_code, corridor_code, city_name, count, templates);

        const API_KEY = process.env.OPENAI_API_KEY;
        if (!API_KEY) {
            // Fallback: use template-based generation (no AI)
            const fallbackAds = generateFallbackAds(meta, country_code, corridor_code, city_name, count);
            return NextResponse.json({ success: true, ads: fallbackAds, source: 'template' });
        }

        // Call ChatGPT
        const aiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`,
            },
            body: JSON.stringify({
                model: 'gpt-4o',
                messages: [
                    {
                        role: 'system',
                        content: `You are HAUL COMMAND's ad copywriter. Generate high-converting ads for the heavy transport / oversize load escort industry. Always use local terminology and language for each country. Be specific to the location. Include emoji flags.`,
                    },
                    { role: 'user', content: prompt },
                ],
                max_tokens: 2000,
                temperature: 0.8,
                response_format: { type: 'json_object' },
            }),
        });

        if (!aiResponse.ok) {
            // Fallback to templates
            const fallbackAds = generateFallbackAds(meta, country_code, corridor_code, city_name, count);
            return NextResponse.json({ success: true, ads: fallbackAds, source: 'template_fallback' });
        }

        const aiData = await aiResponse.json();
        const adsJson = JSON.parse(aiData.choices?.[0]?.message?.content || '{"ads":[]}');

        // Save generated ads to cache
        const savedAds = [];
        for (const ad of adsJson.ads || []) {
            const { data, error } = await supabaseAdmin
                .from('hc_ad_generated')
                .insert({
                    country_code,
                    corridor_code: corridor_code || null,
                    city_slug: city_name ? city_name.toLowerCase().replace(/\s+/g, '-') : null,
                    headline: ad.headline,
                    description: ad.description,
                    cta_text: ad.cta_text || 'Learn More',
                    cta_url: ad.cta_url || `/directory/${country_code.toLowerCase()}`,
                    ai_model: 'gpt-4o',
                    quality_score: ad.quality_score || 0.85,
                })
                .select()
                .single();
            if (data) savedAds.push(data);
        }

        return NextResponse.json({
            success: true,
            ads: savedAds,
            count: savedAds.length,
            source: 'ai_generated',
            model: aiData.model,
            usage: aiData.usage,
        });
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}

function buildAdPrompt(
    meta: { name: string; term: string; currency: string; locale: string },
    countryCode: string,
    corridor?: string,
    city?: string,
    count = 3,
    templates?: { headline_template: string; description_template: string }[] | null
): string {
    const location = city || corridor || meta.name;
    const templateExamples = templates?.slice(0, 2).map(t =>
        `Headline: "${t.headline_template}"\nDescription: "${t.description_template}"`
    ).join('\n') || '';

    return `Generate ${count} unique, hyper-local ad variants for HAUL COMMAND in ${location}, ${meta.name} (${countryCode}).

INDUSTRY: ${meta.term} / oversize load escort services
LOCAL TERMINOLOGY: "${meta.term}" (NOT "pilot car" unless US/CA)
LANGUAGE: Use the primary language of ${meta.name} (locale: ${meta.locale})
CURRENCY: ${meta.currency}

TARGET AUDIENCE MIX:
- 2 ads targeting OPERATORS (escorts wanting work)
- 1 ad targeting BROKERS (companies needing escorts)

${templateExamples ? `STYLE EXAMPLES:\n${templateExamples}\n` : ''}

REQUIREMENTS:
- Include country flag emoji
- Reference local geography, roads, or corridors if known
- Use the LOCAL terminology ("${meta.term}" not generic English)
- Make CTAs action-oriented and specific
- Each ad must feel like it was written BY someone FROM that country

Return JSON: {"ads": [{"headline": "...", "description": "...", "cta_text": "...", "cta_url": "/directory/${countryCode.toLowerCase()}", "target": "operators|brokers", "quality_score": 0.85}]}`;
}

function generateFallbackAds(
    meta: { name: string; term: string; currency: string },
    countryCode: string,
    corridor?: string,
    city?: string,
    count = 3
): { headline: string; description: string; cta_text: string; cta_url: string }[] {
    const location = city || corridor || meta.name;
    const ads = [];

    const variants = [
        {
            headline: `${meta.term} Services in ${location}`,
            description: `Verified ${meta.term.toLowerCase()} operators ready for oversize load escort in ${location}. Instant dispatch. Real-time availability.`,
            cta_text: 'Find Escorts',
        },
        {
            headline: `Join ${location}'s Top ${meta.term} Network`,
            description: `Get matched to oversize loads near ${location}. Verified profiles. Instant notifications. Get paid fast.`,
            cta_text: 'Claim Your Profile',
        },
        {
            headline: `${meta.term} Operators Needed — ${location}`,
            description: `High-demand corridor. Loads waiting. Join HAUL COMMAND's verified network in ${location} today.`,
            cta_text: 'Sign Up Now',
        },
    ];

    for (let i = 0; i < Math.min(count, variants.length); i++) {
        ads.push({
            ...variants[i],
            cta_url: `/directory/${countryCode.toLowerCase()}`,
        });
    }

    return ads;
}
