import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'AV-Ready Escort Certification — Haul Command | Global Standard',
  description:
    'A market-aware certification for escort operators working alongside autonomous trucks. HC Certified, AV-Ready, and Elite tiers. Aurora, Kodiak, Waymo corridors. priority markets.',
  keywords: [
    'AV-ready escort certification',
    'autonomous truck escort training',
    'pilot car autonomous vehicle',
    'Aurora Innovation escort',
    'Kodiak escort certified',
    'heavy haul escort certification',
  ],
  openGraph: {
    title: 'Haul Command AV-Ready Escort Certification',
    description: 'Get certified to escort autonomous freight. 3 tiers. priority markets. Market-specific training context.',
    type: 'website',
  },
};

export default function AVCertLayout({ children }: { children: React.ReactNode }) {
  return children;
}