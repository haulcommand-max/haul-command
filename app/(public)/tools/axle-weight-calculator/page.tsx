import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { AxleWeightCalculatorClient } from './AxleWeightCalculatorClient';

export const metadata: Metadata = {
  title: 'Axle Weight Calculator | Federal Bridge Formula | Haul Command',
  description:
    'Calculate Federal Bridge Formula axle-weight limits by axle count, bridge spacing, gross weight, and planning state. Free oversize-load weight screen.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/axle-weight-calculator' },
};

export default function AxleWeightCalculatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Axle Weight Calculator',
    url: 'https://www.haulcommand.com/tools/axle-weight-calculator',
    description:
      'Calculate Federal Bridge Formula axle-weight limits by axle count, outer bridge spacing, gross weight, and planning state.',
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
        name: 'What is the Federal Bridge Formula?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'The Federal Bridge Formula limits how much weight an axle group can carry based on the distance between the outer axles and the number of axles in the group.',
        },
      },
      {
        '@type': 'Question',
        name: 'Does a legal bridge-formula result guarantee a permitted route?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'No. A bridge-formula result is a planning screen. Final movement depends on the permit, bridge postings, state rules, route restrictions, and local authority conditions.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faq} />
      <AxleWeightCalculatorClient />
    </>
  );
}
