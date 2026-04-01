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
