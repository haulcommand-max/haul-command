/**
 * E-E-A-T Schema Attribution — DA 97 Accelerator Hack #2
 *
 * Injects Organization publisher, author expert profile,
 * and trust anchors into every glossary DefinedTerm schema.
 *
 * This ensures Google's Helpful Content system sees
 * explicit real-world authority behind every definition.
 */

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://www.haulcommand.com";

export const HC_PUBLISHER = {
  "@type": "Organization",
  "@id": `${SITE_URL}/#organization`,
  name: "Haul Command",
  url: SITE_URL,
  logo: {
    "@type": "ImageObject",
    url: `${SITE_URL}/logo.png`,
  },
  sameAs: [
    "https://www.facebook.com/haulcommand",
    "https://www.linkedin.com/company/haulcommand",
    "https://twitter.com/haulcommand",
  ],
  description:
    "The global operating system for heavy haul, oversize, and pilot car logistics. Directory, tools, training, regulations, and intelligence across 120 countries.",
};

export const HC_AUTHOR = {
  "@type": "Person",
  name: "Haul Command Editorial Team",
  url: `${SITE_URL}/about`,
  jobTitle: "Heavy Haul Industry Specialists",
  worksFor: {
    "@type": "Organization",
    name: "Haul Command",
  },
  description:
    "Industry specialists with direct operational experience in heavy haul transport, pilot car operations, and oversize load regulations across multiple jurisdictions.",
};

export function buildEEATTermSchema(payload: {
  slug: string;
  canonical_term: string;
  short_definition: string;
  expanded_definition?: string | null;
  aliases?: Array<{ alias: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": `${SITE_URL}/glossary/${payload.slug}`,
    termCode: payload.slug,
    name: payload.canonical_term,
    description: payload.short_definition,
    ...(payload.expanded_definition && {
      disambiguatingDescription: payload.expanded_definition,
    }),
    ...(payload.aliases &&
      payload.aliases.length > 0 && {
        alternateName: payload.aliases.map((a) => a.alias),
      }),
    inDefinedTermSet: {
      "@type": "DefinedTermSet",
      "@id": `${SITE_URL}/glossary`,
      name: "Haul Command Heavy Haul Glossary",
    },
    publisher: HC_PUBLISHER,
    author: HC_AUTHOR,
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": `${SITE_URL}/glossary/${payload.slug}`,
    },
  };
}

export function buildEEATFaqSchema(
  faqs: Array<{ question: string; answer: string }>
) {
  if (!faqs.length) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    publisher: HC_PUBLISHER,
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}

export function buildEEATCollectionSchema(opts: {
  name: string;
  description?: string | null;
  url: string;
  terms: Array<{ slug: string; canonical_term: string }>;
}) {
  return {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    name: opts.name,
    description: opts.description,
    url: opts.url,
    publisher: HC_PUBLISHER,
    author: HC_AUTHOR,
    hasPart: opts.terms.map((t) => ({
      "@type": "DefinedTerm",
      name: t.canonical_term,
      url: `${SITE_URL}/glossary/${t.slug}`,
    })),
  };
}
