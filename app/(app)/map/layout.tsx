import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Global Coverage Map — 120 Countries | Haul Command',
  description:
    'Explore Haul Command\'s global heavy haul and oversize load directory covering 120 countries. Find pilot car operators, escort vehicles, and permit information by country.',
  openGraph: {
    title: 'Global Coverage Map — 120 Countries | Haul Command',
    description: 'Find heavy haul operators, escort services, and oversize load intelligence across 120 countries worldwide.',
    url: 'https://haulcommand.com/map',
  },
  alternates: { canonical: 'https://haulcommand.com/map' },
};

const FAQ_SCHEMA = {
  '@context': 'https://schema.org',
  '@type': 'FAQPage',
  mainEntity: [
    {
      '@type': 'Question',
      name: 'How many countries does Haul Command cover?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Haul Command covers 120 countries across 4 tiers: Tier A (live directory with verified operators), Tier B (coming soon), Tier C (planned), and Tier D (future expansion). Tier A markets include the US, Canada, Australia, UK, Germany, Netherlands, UAE, Brazil, South Africa, and New Zealand.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is a pilot car or escort vehicle?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'A pilot car (also called escort vehicle or flag car) is a vehicle that accompanies oversize loads on public roads to warn traffic and ensure safe passage. Requirements vary by country and state — typically loads wider than 3.0–4.0 meters require at least one escort.',
      },
    },
    {
      '@type': 'Question',
      name: 'How do I find oversize load permit requirements for a specific country?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'Click any country on the Haul Command map to see its regulatory summary, primary corridors, and permit authority. For Tier A countries, you can access the full operator directory with verified escorts, permit agents, and heavy haul carriers.',
      },
    },
    {
      '@type': 'Question',
      name: 'What are the primary heavy haul corridors in the United States?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'The primary US heavy haul corridors include I-10 (Sun Belt — TX to FL), I-35 (Central — TX to MN), I-40 (Trans-America — NC to CA), I-75 (Southeast — FL to MI), and I-95 (East Coast — FL to ME). Oversize permits are issued state-by-state through individual DOTs.',
      },
    },
    {
      '@type': 'Question',
      name: 'What is the difference between oversize and overweight permits?',
      acceptedAnswer: {
        '@type': 'Answer',
        text: 'An oversize permit is required when a load exceeds legal dimensional limits (typically 8\'6" wide, 13\'6" tall, or 53\' long in the US). An overweight permit is required when the load exceeds legal weight limits (80,000 lbs GVW in the US). Loads exceeding both need a combined OS/OW permit.',
      },
    },
  ],
};

export default function MapLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_SCHEMA) }}
      />
      {children}
    </>
  );
}
