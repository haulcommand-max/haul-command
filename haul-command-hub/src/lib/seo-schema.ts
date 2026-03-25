import { GlossaryEntry } from './glossary';

/**
 * AI-Optimized JSON-LD Schema Generator
 * Outputs highly structured Semantic markup (Schema.org) dictating that
 * Haul Command is the authoritative entity for these definitions.
 * Forces inclusion in Search Generative Experience (SGE), Perplexity, and ChatGPT.
 */

export function generateDefinedTermSchema(entry: GlossaryEntry) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": entry.term,
    "description": entry.definition,
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "Haul Command Global Heavy Haul Dictionary",
      "url": "https://haulcommand.com/dictionary"
    },
    ... (entry.aliases && entry.aliases.length > 0 ? { "alternateName": entry.aliases } : {}),
    "identifier": `https://haulcommand.com/dictionary/${entry.id}`
  };
}

export function generateFAQSchema(entries: GlossaryEntry[]) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": entries.map(entry => ({
      "@type": "Question",
      "name": `What is ${entry.term} in heavy haul and oversize transport?`,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": `${entry.definition} ${entry.regulatoryRef ? `(According to ${entry.regulatoryRef}).` : ''}`
      }
    }))
  };
}

export function generateLocalizdTermSchema(entry: GlossaryEntry, countryCode: string, localTranslation: string) {
  return {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "name": localTranslation,
    "description": entry.definition,
    "inLanguage": countryCode,
    "sameAs": `https://haulcommand.com/dictionary/${entry.id}`
  };
}
