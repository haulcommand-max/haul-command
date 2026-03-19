// lib/ai/gemini-ad-factory.ts
// ══════════════════════════════════════════════════════════════
// GEMINI AD FACTORY — Haul Command Creative Engine
//
// Primary: Gemini for all ad generation (text + image)
// Fallback: Template-based generation if API key missing
//
// Creative lifecycle:
//   generate → score → version → test → promote → retire
// ══════════════════════════════════════════════════════════════

import { gemini, HC_IMAGE_MODEL } from './gemini';
import { COUNTRY_REGISTRY, lookupCountry } from '@/lib/config/country-registry';

// ── Types ───────────────────────────────────────────────────

export interface CreativeRequest {
    country_code: string;
    corridor_code?: string;
    city_name?: string;
    target_role: 'operator' | 'broker' | 'both';
    surface: string;
    count?: number;
    parent_creative_id?: string; // For variant generation
}

export interface CreativeScorecard {
    clarity: number;          // 0-1: Is the message immediately clear?
    stop_power: number;       // 0-1: Would this stop someone from scrolling?
    trust: number;            // 0-1: Does this feel credible and safe?
    niche_fit: number;        // 0-1: Does it speak to heavy haul specifically?
    cta_strength: number;     // 0-1: Is the CTA compelling and specific?
    compliance: number;       // 0-1: Does it comply with local advertising rules?
    mobile_readability: number; // 0-1: Readable on a small screen?
    visual_hierarchy: number; // 0-1: Good headline → body → CTA flow?
    expected_ctr: number;     // 0-1: Predicted click-through rate
    conversion_fit: number;   // 0-1: Aligned with conversion goal?
    composite: number;        // Weighted average
}

export interface GeneratedCreative {
    headline: string;
    description: string;
    cta_text: string;
    cta_url: string;
    target_role: 'operator' | 'broker';
    language: string;
    country_code: string;
    corridor_code?: string;
    city_slug?: string;
    scorecard: CreativeScorecard;
    generation_model: string;
    generation_params: Record<string, unknown>;
    variant_id: string;
    parent_id?: string;
    surface: string;
}

export interface CreativeFactoryResult {
    success: boolean;
    creatives: GeneratedCreative[];
    source: 'gemini' | 'template_fallback';
    model?: string;
    usage?: { prompt_tokens: number; completion_tokens: number; total_tokens: number };
}

// ── Country Meta (expanded from all 57) ────────────────────

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
    IE: { name: 'Ireland', term: 'Escort Vehicle', currency: 'EUR', locale: 'en' },
    DK: { name: 'Danmark', term: 'Eskort Køretøj', currency: 'DKK', locale: 'da' },
    FI: { name: 'Suomi', term: 'Saattue', currency: 'EUR', locale: 'fi' },
    BE: { name: 'België', term: 'Begeleidingsvoertuig', currency: 'EUR', locale: 'nl' },
    AT: { name: 'Österreich', term: 'Begleitfahrzeug', currency: 'EUR', locale: 'de' },
    PT: { name: 'Portugal', term: 'Veículo de Escolta', currency: 'EUR', locale: 'pt' },
    SA: { name: 'Saudi Arabia', term: 'مركبة مرافقة', currency: 'SAR', locale: 'ar' },
    QA: { name: 'Qatar', term: 'مركبة مرافقة', currency: 'QAR', locale: 'ar' },
    CL: { name: 'Chile', term: 'Carro Piloto', currency: 'CLP', locale: 'es' },
    AR: { name: 'Argentina', term: 'Carro Piloto', currency: 'ARS', locale: 'es' },
    CO: { name: 'Colombia', term: 'Carro Piloto', currency: 'COP', locale: 'es' },
    PE: { name: 'Perú', term: 'Carro Piloto', currency: 'PEN', locale: 'es' },
    TR: { name: 'Türkiye', term: 'Refakat Aracı', currency: 'TRY', locale: 'tr' },
    GR: { name: 'Ελλάδα', term: 'Συνοδευτικό Όχημα', currency: 'EUR', locale: 'el' },
    RO: { name: 'România', term: 'Vehicul de Pilotaj', currency: 'RON', locale: 'ro' },
    BG: { name: 'България', term: 'Пилотна Кола', currency: 'BGN', locale: 'bg' },
    HR: { name: 'Hrvatska', term: 'Pilot Vozilo', currency: 'EUR', locale: 'hr' },
    CZ: { name: 'Česko', term: 'Doprovodné Vozidlo', currency: 'CZK', locale: 'cs' },
    SK: { name: 'Slovensko', term: 'Sprievodné Vozidlo', currency: 'EUR', locale: 'sk' },
    HU: { name: 'Magyarország', term: 'Kísérő Jármű', currency: 'HUF', locale: 'hu' },
    SI: { name: 'Slovenija', term: 'Spremljalno Vozilo', currency: 'EUR', locale: 'sl' },
    EE: { name: 'Eesti', term: 'Saateauto', currency: 'EUR', locale: 'et' },
    LV: { name: 'Latvija', term: 'Pavadošais Transportlīdzeklis', currency: 'EUR', locale: 'lv' },
    LT: { name: 'Lietuva', term: 'Lydimasis Automobilis', currency: 'EUR', locale: 'lt' },
    KW: { name: 'Kuwait', term: 'مركبة مرافقة', currency: 'KWD', locale: 'ar' },
    OM: { name: 'Oman', term: 'مركبة مرافقة', currency: 'OMR', locale: 'ar' },
    BH: { name: 'Bahrain', term: 'مركبة مرافقة', currency: 'BHD', locale: 'ar' },
    MY: { name: 'Malaysia', term: 'Kenderaan Pengiring', currency: 'MYR', locale: 'ms' },
    ID: { name: 'Indonesia', term: 'Kendaraan Pengawal', currency: 'IDR', locale: 'id' },
    NG: { name: 'Nigeria', term: 'Pilot Vehicle', currency: 'NGN', locale: 'en' },
    UY: { name: 'Uruguay', term: 'Vehículo Escolta', currency: 'UYU', locale: 'es' },
    PA: { name: 'Panamá', term: 'Vehículo Escolta', currency: 'PAB', locale: 'es' },
    CR: { name: 'Costa Rica', term: 'Vehículo Escolta', currency: 'CRC', locale: 'es' },
    EC: { name: 'Ecuador', term: 'Vehículo Escolta', currency: 'USD', locale: 'es' },
    DO: { name: 'República Dominicana', term: 'Vehículo Escolta', currency: 'DOP', locale: 'es' },
};

// ── Scoring Weights ────────────────────────────────────────

const SCORE_WEIGHTS = {
    clarity: 0.12,
    stop_power: 0.10,
    trust: 0.12,
    niche_fit: 0.10,
    cta_strength: 0.12,
    compliance: 0.08,
    mobile_readability: 0.08,
    visual_hierarchy: 0.08,
    expected_ctr: 0.12,
    conversion_fit: 0.08,
};

function computeCompositeScore(scorecard: Omit<CreativeScorecard, 'composite'>): number {
    let composite = 0;
    for (const [key, weight] of Object.entries(SCORE_WEIGHTS)) {
        composite += (scorecard[key as keyof typeof SCORE_WEIGHTS] ?? 0.5) * weight;
    }
    return Math.round(composite * 100) / 100;
}

// ── Main Factory Function ──────────────────────────────────

export async function generateCreatives(
    request: CreativeRequest,
): Promise<CreativeFactoryResult> {
    const { country_code, corridor_code, city_name, target_role = 'both', surface, count = 3 } = request;

    const meta = COUNTRY_META[country_code] || {
        name: country_code,
        term: 'Pilot Car',
        currency: 'USD',
        locale: 'en',
    };

    // Try Gemini first
    try {
        const geminiKey = process.env.GEMINI_API_KEY;
        if (!geminiKey) throw new Error('No GEMINI_API_KEY');

        const prompt = buildGeminiPrompt(meta, country_code, corridor_code, city_name, target_role, surface, count, request.parent_creative_id);

        const result = await gemini.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                temperature: 0.8,
                maxOutputTokens: 4000,
            },
        });

        const text = result.text ?? '';
        const parsed = JSON.parse(text);

        const creatives: GeneratedCreative[] = (parsed.ads || []).map((ad: any, idx: number) => {
            const scorecard: Omit<CreativeScorecard, 'composite'> = {
                clarity: ad.scorecard?.clarity ?? 0.8,
                stop_power: ad.scorecard?.stop_power ?? 0.75,
                trust: ad.scorecard?.trust ?? 0.85,
                niche_fit: ad.scorecard?.niche_fit ?? 0.9,
                cta_strength: ad.scorecard?.cta_strength ?? 0.8,
                compliance: ad.scorecard?.compliance ?? 0.95,
                mobile_readability: ad.scorecard?.mobile_readability ?? 0.85,
                visual_hierarchy: ad.scorecard?.visual_hierarchy ?? 0.8,
                expected_ctr: ad.scorecard?.expected_ctr ?? 0.04,
                conversion_fit: ad.scorecard?.conversion_fit ?? 0.7,
            };

            return {
                headline: ad.headline,
                description: ad.description,
                cta_text: ad.cta_text || 'Learn More',
                cta_url: ad.cta_url || `/directory/${country_code.toLowerCase()}`,
                target_role: ad.target || target_role,
                language: meta.locale,
                country_code,
                corridor_code: corridor_code || undefined,
                city_slug: city_name ? city_name.toLowerCase().replace(/\s+/g, '-') : undefined,
                scorecard: { ...scorecard, composite: computeCompositeScore(scorecard) },
                generation_model: 'gemini-2.5-flash',
                generation_params: {
                    temperature: 0.8,
                    surface,
                    parent_id: request.parent_creative_id,
                },
                variant_id: `gem-${country_code}-${Date.now()}-${idx}`,
                parent_id: request.parent_creative_id,
                surface,
            };
        });

        return {
            success: true,
            creatives,
            source: 'gemini',
            model: 'gemini-2.5-flash',
        };
    } catch (err) {
        // Fallback: template-based generation
        const fallbackCreatives = generateFallbackCreatives(meta, country_code, corridor_code, city_name, target_role, surface, count);
        return {
            success: true,
            creatives: fallbackCreatives,
            source: 'template_fallback',
        };
    }
}

// ── Gemini Prompt Builder ──────────────────────────────────

function buildGeminiPrompt(
    meta: { name: string; term: string; currency: string; locale: string },
    countryCode: string,
    corridor?: string,
    city?: string,
    targetRole: string = 'both',
    surface: string = 'directory',
    count: number = 3,
    parentId?: string,
): string {
    const location = city || corridor || meta.name;

    const roleInstruction = targetRole === 'both'
        ? `Mix: 2 ads targeting OPERATORS (escorts wanting work), 1 ad targeting BROKERS (companies needing escorts)`
        : targetRole === 'operator'
            ? `All ads targeting OPERATORS (escorts wanting work)`
            : `All ads targeting BROKERS (companies needing escorts)`;

    const variantNote = parentId
        ? `\nThis is a VARIANT request. Generate creative variations of the parent creative (${parentId}). Change: angle, tone, CTA, and emphasis while keeping the core message.`
        : '';

    return `Generate ${count} unique, hyper-local ad variants for HAUL COMMAND in ${location}, ${meta.name} (${countryCode}).

INDUSTRY: ${meta.term} / oversize load escort services
LOCAL TERMINOLOGY: "${meta.term}" (NOT "pilot car" unless US/CA)
LANGUAGE: Use the primary language of ${meta.name} (locale: ${meta.locale})
CURRENCY: ${meta.currency}
AD SURFACE: ${surface}
${variantNote}
TARGET AUDIENCE: ${roleInstruction}

REQUIREMENTS:
- Include country flag emoji
- Reference local geography, roads, or corridors if known
- Use the LOCAL terminology ("${meta.term}" not generic English)
- Make CTAs action-oriented and specific
- Each ad must feel like it was written BY someone FROM that country
- Score each ad on 10 quality dimensions

Return JSON:
{
  "ads": [{
    "headline": "...",
    "description": "...",
    "cta_text": "...",
    "cta_url": "/directory/${countryCode.toLowerCase()}",
    "target": "operator|broker",
    "scorecard": {
      "clarity": 0.85,
      "stop_power": 0.8,
      "trust": 0.9,
      "niche_fit": 0.95,
      "cta_strength": 0.85,
      "compliance": 0.95,
      "mobile_readability": 0.9,
      "visual_hierarchy": 0.85,
      "expected_ctr": 0.045,
      "conversion_fit": 0.75
    }
  }]
}`;
}

// ── Fallback Template Generator ────────────────────────────

function generateFallbackCreatives(
    meta: { name: string; term: string; currency: string; locale: string },
    countryCode: string,
    corridor?: string,
    city?: string,
    targetRole: string = 'both',
    surface: string = 'directory',
    count: number = 3,
): GeneratedCreative[] {
    const location = city || corridor || meta.name;

    const templates = [
        {
            headline: `${meta.term} Services in ${location}`,
            description: `Verified ${meta.term.toLowerCase()} operators ready for oversize load escort in ${location}. Instant dispatch. Real-time availability.`,
            cta_text: 'Find Escorts',
            target_role: 'broker' as const,
        },
        {
            headline: `Join ${location}'s Top ${meta.term} Network`,
            description: `Get matched to oversize loads near ${location}. Verified profiles. Instant notifications. Get paid fast.`,
            cta_text: 'Claim Your Profile',
            target_role: 'operator' as const,
        },
        {
            headline: `${meta.term} Operators Needed — ${location}`,
            description: `High-demand corridor. Loads waiting. Join HAUL COMMAND's verified network in ${location} today.`,
            cta_text: 'Sign Up Now',
            target_role: 'operator' as const,
        },
        {
            headline: `Get the Verified Badge ✓ — ${location}`,
            description: `Verified ${meta.term.toLowerCase()} operators earn 3× more trust. Upload docs to qualify.`,
            cta_text: 'Get Verified',
            target_role: 'operator' as const,
        },
        {
            headline: `Need ${meta.term} ASAP? — ${location}`,
            description: `Find available ${meta.term.toLowerCase()} operators right now in ${location}. Direct booking, instant confirmation.`,
            cta_text: 'Book Now',
            target_role: 'broker' as const,
        },
    ];

    const defaultScorecard: Omit<CreativeScorecard, 'composite'> = {
        clarity: 0.75, stop_power: 0.6, trust: 0.8,
        niche_fit: 0.85, cta_strength: 0.7, compliance: 0.95,
        mobile_readability: 0.85, visual_hierarchy: 0.7,
        expected_ctr: 0.03, conversion_fit: 0.65,
    };

    return templates.slice(0, count).map((t, idx) => ({
        ...t,
        cta_url: `/directory/${countryCode.toLowerCase()}`,
        language: meta.locale,
        country_code: countryCode,
        corridor_code: corridor,
        city_slug: city ? city.toLowerCase().replace(/\s+/g, '-') : undefined,
        scorecard: { ...defaultScorecard, composite: computeCompositeScore(defaultScorecard) },
        generation_model: 'template_fallback',
        generation_params: { surface },
        variant_id: `tpl-${countryCode}-${Date.now()}-${idx}`,
        parent_id: undefined,
        surface,
    }));
}

// ── Variant Generator (A/B) ───────────────────────────────

export async function generateVariants(
    parentCreative: GeneratedCreative,
    variantCount: number = 3,
): Promise<CreativeFactoryResult> {
    return generateCreatives({
        country_code: parentCreative.country_code,
        corridor_code: parentCreative.corridor_code,
        city_name: parentCreative.city_slug?.replace(/-/g, ' '),
        target_role: parentCreative.target_role,
        surface: parentCreative.surface,
        count: variantCount,
        parent_creative_id: parentCreative.variant_id,
    });
}

// ── Winner Detection ──────────────────────────────────────

export interface CreativePerformance {
    variant_id: string;
    impressions: number;
    clicks: number;
    conversions: number;
    ctr: number;
    cvr: number;
    revenue_usd: number;
}

export function detectWinner(
    performances: CreativePerformance[],
    minImpressions: number = 500,
): { winner: CreativePerformance | null; confidence: number; action: 'promote' | 'continue' | 'kill_all' } {
    const eligible = performances.filter(p => p.impressions >= minImpressions);
    if (eligible.length < 2) return { winner: null, confidence: 0, action: 'continue' };

    // Sort by CTR (primary) then CVR (secondary)
    eligible.sort((a, b) => {
        const ctrDiff = b.ctr - a.ctr;
        if (Math.abs(ctrDiff) > 0.005) return ctrDiff;
        return b.cvr - a.cvr;
    });

    const best = eligible[0];
    const secondBest = eligible[1];

    // Simple significance check: need 20%+ CTR lift
    const liftPct = ((best.ctr - secondBest.ctr) / Math.max(secondBest.ctr, 0.001)) * 100;

    if (liftPct >= 20 && best.impressions >= minImpressions * 2) {
        return { winner: best, confidence: Math.min(0.95, 0.7 + liftPct / 100), action: 'promote' };
    }

    // Kill all if none performing
    const avgCtr = eligible.reduce((s, p) => s + p.ctr, 0) / eligible.length;
    if (avgCtr < 0.005 && eligible.every(p => p.impressions >= minImpressions * 3)) {
        return { winner: null, confidence: 0.9, action: 'kill_all' };
    }

    return { winner: null, confidence: 0, action: 'continue' };
}
