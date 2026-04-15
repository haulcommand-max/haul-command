import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Heavy Haul Escort Services — 14 Categories, 50+ Countries | Haul Command',
  description: 'Professional pilot car, wide load escort, heavy haul, wind energy transport, route surveys, permit filing, insurance verification, consolidated invoicing, fleet backup & rescue, risk mitigation, certification, autonomous vehicle escort, and equipment marketplace services across 50+ countries.',
  keywords: [
    'pilot car services', 'heavy haul escort', 'wide load escort', 'consolidated invoicing',
    'fleet backup', 'route survey', 'CEVO certification', 'oversize load permit acquiring',
    'oversize load insurance', 'escort vehicle equipment', 'autonomous vehicle escort',
    'project planning heavy haul', 'risk mitigation logistics', 'permit filing service',
  ],
  openGraph: {
    title: 'Heavy Haul Escort Services — 14 Categories, 50+ Countries | Haul Command',
    description: '14-category escort service stack across 50+ countries. Pilot cars, permits, insurance, fleet backup, AV escorts, and more — all self-serve.',
    url: 'https://haulcommand.com/services',
  },
  alternates: { canonical: 'https://haulcommand.com/services' },
};

export default function ServicesLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}