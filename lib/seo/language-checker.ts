/**
 * Language Obviousness Checker
 *
 * Heuristic detector for mixed-language pages.
 * Uses stopword ratio analysis per section (nav, title, body, footer).
 *
 * Scores:
 *  - >= 85: safe to index
 *  - 75-84: noindex, needs attention
 *  - < 75: block publish entirely
 */

export type LanguageCheckResult = {
    obviousnessScore: number;       // 0-100
    mixedLanguageFlag: boolean;
    detectedForeignRatio: number;   // 0-1
    reasons: string[];
};

type TextBlock = {
    section: 'nav' | 'title' | 'body' | 'footer';
    text: string;
};

// ── Language Profiles ──────────────────────────────────────────────────────

type LanguageProfile = {
    lang: string;
    stopwords: Set<string>;
};

const PROFILES: Record<string, LanguageProfile> = {
    en: {
        lang: 'en',
        stopwords: new Set([
            'the', 'and', 'or', 'to', 'of', 'in', 'for', 'on', 'with', 'near',
            'best', 'top', 'how', 'what', 'where', 'service', 'services',
            'escort', 'load', 'pilot', 'car', 'permits', 'from', 'this', 'that',
            'are', 'was', 'been', 'have', 'has', 'will', 'can', 'all', 'our',
        ]),
    },
    es: {
        lang: 'es',
        stopwords: new Set([
            'el', 'la', 'los', 'las', 'y', 'o', 'de', 'en', 'para', 'con',
            'cerca', 'mejor', 'mejores', 'cómo', 'qué', 'dónde',
            'servicio', 'servicios', 'escolta', 'carga', 'permiso', 'transporte',
            'del', 'por', 'una', 'un', 'que', 'es', 'se', 'su', 'más',
        ]),
    },
    fr: {
        lang: 'fr',
        stopwords: new Set([
            'le', 'la', 'les', 'et', 'ou', 'de', 'des', 'en', 'pour', 'avec',
            'près', 'meilleur', 'meilleurs', 'comment', 'quoi', 'où',
            'service', 'services', 'escorte', 'permis', 'transport', 'charge',
            'du', 'au', 'aux', 'une', 'un', 'qui', 'que', 'est', 'sont',
        ]),
    },
    de: {
        lang: 'de',
        stopwords: new Set([
            'der', 'die', 'das', 'und', 'oder', 'in', 'von', 'für', 'mit',
            'bei', 'auf', 'aus', 'nach', 'über', 'unter', 'zwischen',
            'ist', 'sind', 'war', 'haben', 'werden', 'kann', 'alle',
            'transport', 'genehmigung', 'begleitung', 'schwerlast',
        ]),
    },
    sv: {
        lang: 'sv',
        stopwords: new Set([
            'och', 'eller', 'i', 'för', 'med', 'på', 'av', 'till', 'från',
            'den', 'det', 'en', 'ett', 'som', 'är', 'var', 'att',
            'transport', 'eskort', 'tillstånd', 'bred', 'last',
        ]),
    },
    no: {
        lang: 'no',
        stopwords: new Set([
            'og', 'eller', 'i', 'for', 'med', 'på', 'av', 'til', 'fra',
            'den', 'det', 'en', 'et', 'som', 'er', 'var', 'at',
            'transport', 'eskort', 'tillatelse', 'bred', 'last',
        ]),
    },
    ar: {
        lang: 'ar',
        stopwords: new Set([
            'في', 'من', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه',
            'التي', 'الذي', 'وال', 'لل', 'بال', 'كان', 'يكون',
            'نقل', 'مرافقة', 'تصريح', 'حمولة',
        ]),
    },
};

// ── Tokenizer ──────────────────────────────────────────────────────────────

function tokenize(text: string): string[] {
    return text
        .toLowerCase()
        .replace(/[^a-záéíóúüñàâçèéêëîïôûùüÿœæäöåø\u0600-\u06FF\s-]/g, ' ')
        .split(/\s+/)
        .filter(Boolean);
}

// ── Checker ────────────────────────────────────────────────────────────────

const clamp = (n: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, n));

export function languageObviousnessCheck(
    targetLang: string,
    textBlocks: TextBlock[],
): LanguageCheckResult {
    const reasons: string[] = [];
    const target = PROFILES[targetLang];
    if (!target) {
        return {
            obviousnessScore: 50,
            mixedLanguageFlag: false,
            detectedForeignRatio: 0,
            reasons: [`No language profile for "${targetLang}". Defaulting to 50.`],
        };
    }

    const others = Object.values(PROFILES).filter((p) => p.lang !== targetLang);

    const combined = textBlocks.map((b) => b.text).join(' ');
    const tokens = tokenize(combined);

    if (tokens.length < 50) {
        return {
            obviousnessScore: 0,
            mixedLanguageFlag: true,
            detectedForeignRatio: 1,
            reasons: ['Too little text to verify language (<50 tokens).'],
        };
    }

    const targetHits = tokens.reduce((acc, t) => acc + (target.stopwords.has(t) ? 1 : 0), 0);
    const otherHits = others.map((p) =>
        tokens.reduce((acc, t) => acc + (p.stopwords.has(t) ? 1 : 0), 0),
    );
    const totalOtherHits = otherHits.reduce((a, b) => a + b, 0);
    const totalHits = targetHits + totalOtherHits;

    if (totalHits === 0) {
        return {
            obviousnessScore: 20,
            mixedLanguageFlag: true,
            detectedForeignRatio: 0.8,
            reasons: ['No language signal words detected (content may be broken).'],
        };
    }

    const targetRatio = targetHits / totalHits;
    const foreignRatio = totalOtherHits / totalHits;

    const obviousnessScore = clamp(targetRatio * 120 - foreignRatio * 80);
    const mixedLanguageFlag = foreignRatio >= 0.25;

    if (mixedLanguageFlag) reasons.push(`Mixed-language risk: foreign stopword ratio ${(foreignRatio * 100).toFixed(1)}%.`);
    if (obviousnessScore < 85) reasons.push(`Language obviousness low (${obviousnessScore.toFixed(1)} < 85).`);

    // Nav-specific check (nav should be cleanest)
    const navText = textBlocks.filter((b) => b.section === 'nav').map((b) => b.text).join(' ');
    if (navText.length > 30) {
        const navTokens = tokenize(navText);
        const navTargetHits = navTokens.reduce((acc, t) => acc + (target.stopwords.has(t) ? 1 : 0), 0);
        const navOtherHits = others.reduce(
            (acc, p) => acc + navTokens.reduce((a, t) => a + (p.stopwords.has(t) ? 1 : 0), 0), 0,
        );
        const navTotal = navTargetHits + navOtherHits;
        if (navTotal > 0 && navOtherHits / navTotal > 0.15) {
            reasons.push('Nav language drift detected (>15% foreign tokens).');
        }
    }

    return { obviousnessScore, mixedLanguageFlag, detectedForeignRatio: foreignRatio, reasons };
}
