import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trucker Services Directory — Repair, Towing, Scales, Stops & More | Haul Command',
  description: 'Find truck repair shops, towing services, weigh stations, truck stops, parts suppliers, pilot car companies, and 46+ service categories. The most comprehensive trucker services directory for oversize load and heavy haul operations across 120 countries.',
  keywords: [
    'trucker services directory',
    'truck stop directory',
    'truck repair near me',
    'pilot car companies',
    'towing service trucking',
    'cat scale locations',
    'weigh station directory',
    'oversize load services',
    'truck parts suppliers',
    'mobile truck repair',
    'trailer repair near me',
    'truck wash locations',
    'trucker supplies',
    'heavy haul services',
    'escort vehicle services directory',
  ],
  openGraph: {
    title: 'Trucker Services Directory — 46+ Categories | Haul Command',
    description: 'Find every service a heavy haul operation needs — repair, towing, scales, stops, parts, and pilot car companies across 120 countries.',
    type: 'website',
  },
};

export default function TruckerServicesLayout({ children }: { children: React.ReactNode }) {
  return children;
}
