import type { Metadata } from 'next';
import { JsonLd } from '@/components/seo/JsonLd';
import { EscortCountCalculatorClient } from './EscortCountCalculatorClient';

export const metadata: Metadata = {
  title: 'Escort Count Calculator - Pilot Car Planning | Haul Command',
  description:
    'Estimate lead, chase, high-pole, police escort, and route survey needs from load dimensions and route context before quoting an oversize move.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/escort-count-calculator' },
};

const toolSchema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Escort Count Calculator',
  url: 'https://www.haulcommand.com/tools/escort-count-calculator',
  description:
    'Pilot car escort count planning tool for oversize and heavy-haul moves. Estimates lead, chase, high-pole, police, and route survey needs.',
  applicationCategory: 'BusinessApplication',
  isAccessibleForFree: true,
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

const faqSchema = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many pilot cars does an oversize load need?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Pilot car count depends on width, height, length, route context, and permit conditions. A common planning pattern is one escort near the first width threshold, front and rear escorts at higher widths, high-pole support for tall loads, and police or traffic control for superload-like moves.',
      },
    },
    {
      '@type': 'Question',
      name: 'Does a high-pole car count as an escort vehicle?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A high-pole car is usually an escort vehicle assigned to vertical clearance screening. Whether it counts as the required lead escort depends on the permit and jurisdiction.',
      },
    },
    {
      '@type': 'Question',
      name: 'Can this replace the issued permit?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'No. This calculator is a planning screen. The issued permit, route survey, and agency instructions control the final escort and traffic-control requirements.',
      },
    },
  ],
};

export default function EscortCountCalculatorPage() {
  return (
    <>
      <JsonLd data={toolSchema} />
      <JsonLd data={faqSchema} />
      <EscortCountCalculatorClient />
    </>
  );
}
