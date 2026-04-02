import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Escort Services — 120 Countries | Haul Command',
  description: 'Professional pilot car, wide load, heavy haul, wind energy, route survey, consolidated invoicing, fleet backup, risk mitigation, and certification services across 120 countries.',
  keywords: ['pilot car services', 'heavy haul escort', 'wide load escort', 'consolidated invoicing', 'fleet backup', 'route survey', 'CEVO certification'],
  openGraph: {
    title: 'Heavy Haul Escort Services — 120 Countries | Haul Command',
    description: 'Complete escort service stack across 120 countries. From pilot cars to project planning.',
    url: 'https://haulcommand.com/services',
  },
  alternates: { canonical: 'https://haulcommand.com/services' },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
