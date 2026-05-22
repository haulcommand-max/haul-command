import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { CertificationReciprocityCheckerClient } from './CertificationReciprocityCheckerClient';

export const metadata: Metadata = {
  title: 'Certification Reciprocity Checker | Haul Command',
  description:
    'Check whether a pilot car or escort credential is likely accepted across selected U.S. markets, with blocked-state warnings and dispatch next actions.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/certification-reciprocity-checker' },
};

export default function CertificationReciprocityCheckerPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Certification Reciprocity Checker',
    url: 'https://www.haulcommand.com/tools/certification-reciprocity-checker',
    description:
      'Screen pilot car and escort certification reciprocity across selected U.S. markets before quoting or dispatching an oversize load.',
    applicationCategory: 'BusinessApplication',
    isAccessibleForFree: true,
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
  };

  const faq = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'Can one pilot car certification work in every state?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. Pilot car and escort vehicle credential rules vary by state. Some markets accept selected out-of-state credentials, some need local proof, and some require state-specific credentials.',
        },
      },
      {
        '@type': 'Question',
        name: 'Is this a legal approval to dispatch?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. The checker is a planning screen. Final dispatch decisions should be verified against the active permit, official permit office requirements, credential cards, insurance proof, and route-specific conditions.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faq} />
      <CertificationReciprocityCheckerClient />
    </>
  );
}
