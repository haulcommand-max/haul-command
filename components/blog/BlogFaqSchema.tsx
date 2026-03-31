'use client';

interface FaqItem {
  question: string;
  answer: string;
}

interface BlogFaqSchemaProps {
  faqs: FaqItem[];
}

/**
 * Injects FAQPage structured data for AI search engines and Google rich snippets.
 * Each FAQ item becomes a mainEntity entry in the schema.
 */
export default function BlogFaqSchema({ faqs }: BlogFaqSchemaProps) {
  if (!faqs || faqs.length === 0) return null;

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
