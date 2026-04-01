export function getGlobalHreflangTags(pagePath: string) {
  // ISO-3166-1 alpha-2 combined with language
  const locales = ['en-US', 'en-CA', 'en-GB', 'en-AU', 'es-MX'];
  const baseUrl = 'https://haulcommand.com';
  
  const tags = locales.map(locale => ({
    url: `${baseUrl}/${locale}${pagePath}`,
    locale
  }));

  // Map to Next.js metadata format
  const alternateLanguages: Record<string, string> = {
    'x-default': `${baseUrl}${pagePath}`
  };

  tags.forEach(tag => {
    alternateLanguages[tag.locale] = tag.url;
  });

  return alternateLanguages;
}

/**
 * Get hreflang links for a specific concept ID.
 * Returns link objects suitable for metadata generation.
 */
export async function getHreflangLinks(conceptId: string): Promise<Array<{ hreflang: string; href: string }>> {
  // When a proper i18n routing system is in place, this would query
  // seo_page_variants for all locale paths sharing the concept_id.
  // For now, return an empty array so builds pass without DB calls.
  return [];
}

/**
 * Get hreflang link sets for sitemap generation, grouped by concept.
 * Returns sets for all concepts matching the locale + template partition.
 */
export async function getHreflangSetsForSitemap(
  countryCode: string,
  languageCode: string,
  templateKey: string,
): Promise<Array<{ conceptId: string; links: Array<{ hreflang: string; href: string }> }>> {
  // Stub: When the i18n page-variant system is live, this would query
  // seo_page_variants grouped by concept_id for the given locale+template.
  return [];
}
