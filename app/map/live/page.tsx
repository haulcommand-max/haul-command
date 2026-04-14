import type { Metadata } from 'next';
import LiveMapClient from './LiveMapClient';

export const metadata: Metadata = {
  title: 'Live Dispatch Map — Heavy Haul Operations | Haul Command',
  description: 'Real-time dispatch map showing all active oversize loads, escort positions, permit routes, and clearance intelligence across 120 countries.',
};

export default function LiveMapPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
              {
                "@type": "Question",
                "name": "How often is the live dispatch map updated?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Our live map aggregates data in near real-time from active oversize loads and escort vehicles."
                }
              },
              {
                "@type": "Question",
                "name": "Can I see permit routes on the map?",
                "acceptedAnswer": {
                  "@type": "Answer",
                  "text": "Yes, active permit route overlays are available to authorized operators and dispatchers."
                }
              }
            ]
          }),
        }}
      />
      <LiveMapClient />
    </>
  );
}