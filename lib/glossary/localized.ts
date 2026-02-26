import { createClient } from '@/utils/supabase/server';
import type { SupportedLocale } from '@/lib/i18n/locale';
import type { GlossaryTerm } from './api';

export interface LocalizedGlossaryTerm extends GlossaryTerm {
    locale: SupportedLocale;
    term_display: string;
    short_definition_display: string;
    long_definition_display: string | null;
    example_usage_display: string | null;
    common_mistakes_display: string | null;
    has_localization: boolean;
    available_locales: SupportedLocale[];
}

/**
 * Fetch a glossary term with localized content.
 * Falls back to canonical English if localization isn't available.
 */
export async function getGlossaryTermLocalized(
    slug: string,
    locale: SupportedLocale,
): Promise<LocalizedGlossaryTerm | null> {
    const supabase = await createClient();

    // Fetch canonical term
    const { data: term } = await supabase
        .from('glossary_public')
        .select('*')
        .eq('slug', slug)
        .limit(1)
        .single();

    if (!term) return null;

    // Fetch localized variant if not en-US
    let localized: any = null;
    let has_localization = false;

    if (locale !== 'en-US') {
        const { data } = await supabase
            .from('glossary_i18n_public')
            .select('*')
            .eq('term_slug', slug)
            .eq('locale', locale)
            .limit(1)
            .single();
        localized = data;
        has_localization = !!data;
    }

    // Fetch all available locales for this term (for hreflang)
    const { data: i18nRows } = await supabase
        .from('glossary_i18n_public')
        .select('locale')
        .eq('term_slug', slug);

    const available_locales: SupportedLocale[] = ['en-US'];
    for (const row of i18nRows ?? []) {
        if (row.locale === 'en-CA' || row.locale === 'fr-CA') {
            available_locales.push(row.locale);
        }
    }

    return {
        ...term,
        locale,
        term_display: localized?.term_localized ?? term.term,
        short_definition_display: localized?.short_definition_localized ?? term.short_definition,
        long_definition_display: localized?.long_definition_localized ?? term.long_definition,
        example_usage_display: localized?.example_usage_localized ?? term.example_usage,
        common_mistakes_display: localized?.common_mistakes_localized ?? term.common_mistakes,
        has_localization,
        available_locales,
    };
}

/**
 * Generate hreflang tags for a glossary term page.
 * Only includes locales with published i18n rows.
 */
export function generateGlossaryHreflang(
    slug: string,
    availableLocales: SupportedLocale[],
): { hreflang: string; href: string }[] {
    const baseUrl = 'https://haulcommand.com';
    const canonical = `${baseUrl}/glossary/${slug}`;

    const tags: { hreflang: string; href: string }[] = [];

    // Always include default (x-default points to same URL)
    tags.push({ hreflang: 'x-default', href: canonical });

    for (const locale of availableLocales) {
        const hreflang = locale.toLowerCase(); // en-us, en-ca, fr-ca
        tags.push({ hreflang, href: canonical });
    }

    return tags;
}
