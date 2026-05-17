import type { Metadata } from 'next';
import LiveMapClient from './LiveMapClient';

export const metadata: Metadata = {
  title: 'Live Dispatch Map — Heavy Haul Operations | Haul Command',
  description: 'Operational map for oversize load context, escort coverage signals, permit routes, and clearance intelligence where source data is available.',
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
                  "text": "The map aggregates available route, directory, and operational signals. Live position data appears only when an authorized source is connected."
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