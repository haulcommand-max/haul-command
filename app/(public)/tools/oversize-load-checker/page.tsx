import type { Metadata } from 'next';
import { OversizeLoadCheckerClient } from './OversizeLoadCheckerClient';

export const metadata: Metadata = {
  title: 'Oversize Load Checker - Permit & Escort Screen | Haul Command',
  description:
    'Enter width, height, length and weight to screen oversize permit triggers, pilot car needs, high-pole risk, and superload review signals.',
  alternates: { canonical: 'https://www.haulcommand.com/tools/oversize-load-checker' },
};

const schema = {
  '@context': 'https://schema.org',
  '@type': 'WebApplication',
  name: 'Haul Command Oversize Load Checker',
  description:
    'Screen oversize permit, escort, high-pole, and superload review triggers from load dimensions and gross weight.',
  url: 'https://www.haulcommand.com/tools/oversize-load-checker',
  applicationCategory: 'BusinessApplication',
  offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
};

export default function OversizeLoadCheckerPage() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }} />
      <OversizeLoadCheckerClient />
    </>
  );
}
