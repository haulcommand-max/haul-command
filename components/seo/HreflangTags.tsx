// components/seo/HreflangTags.tsx
// Add to app/layout.tsx <head> — hreflang for 120 countries

const HREFLANGS = [
  { lang: 'en', path: '' },
  { lang: 'en-gb', path: '/gb' },
  { lang: 'en-au', path: '/au' },
  { lang: 'en-ca', path: '/ca' },
  { lang: 'en-nz', path: '/nz' },
  { lang: 'en-za', path: '/za' },
  { lang: 'de', path: '/de' },
  { lang: 'nl', path: '/nl' },
  { lang: 'ar', path: '/ae' },
  { lang: 'pt', path: '/br' },
  { lang: 'fr', path: '/fr' },
  { lang: 'es', path: '/es' },
  { lang: 'it', path: '/it' },
  { lang: 'sv', path: '/se' },
  { lang: 'nb', path: '/no' },
  { lang: 'da', path: '/dk' },
  { lang: 'fi', path: '/fi' },
  { lang: 'hi', path: '/in' },
  { lang: 'id', path: '/id' },
  { lang: 'th', path: '/th' },
  { lang: 'x-default', path: '' },
];

export function HreflangTags() {
  return (
    <>
      {HREFLANGS.map(({ lang, path }) => (
        <link
          key={lang}
          rel="alternate"
          hrefLang={lang}
          href={`https://www.haulcommand.com${path}`}
        />
      ))}
    </>
  );
}
