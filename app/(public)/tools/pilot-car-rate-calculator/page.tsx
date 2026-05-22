import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { PilotCarRateCalculatorClient } from './PilotCarRateCalculatorClient';

export const metadata: Metadata = {
  title: 'Pilot Car Rate Calculator | Haul Command',
  description:
    'Estimate pilot car and escort vehicle rates by miles, escort count, region, high-pole needs, wait time, and load difficulty. Free planning calculator.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/pilot-car-rate-calculator' },
};

export default function PilotCarRateCalculatorPage() {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'WebApplication',
    name: 'Pilot Car Rate Calculator',
    url: 'https://www.haulcommand.com/tools/pilot-car-rate-calculator',
    description:
      'Estimate pilot car and escort vehicle pricing for oversize load moves using route miles, escort count, market region, and move difficulty.',
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
        name: 'How much does a pilot car cost?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Pilot car rates commonly include a daily charge, mileage charge, fuel surcharge, wait time, overnight costs, and specialty add-ons such as high-pole service. Final pricing depends on market, permits, load dimensions, route restrictions, and operator availability.',
        },
      },
      {
        '@type': 'Question',
        name: 'Why do pilot car rates vary by region?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Rates vary because operator supply, fuel cost, insurance cost, terrain, metro restrictions, and permit complexity differ by market. High-demand corridors and short-notice moves usually price higher.',
        },
      },
    ],
  };

  return (
    <>
      <JsonLd data={schema} />
      <JsonLd data={faq} />
      <PilotCarRateCalculatorClient />
    </>
  );
}
