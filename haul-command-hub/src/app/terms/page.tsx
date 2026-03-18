import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Terms of Service — HAUL COMMAND',
  description: 'Terms of Service for Haul Command, the global heavy haul directory and intelligence platform.',
};

export default function TermsPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 min-h-screen">
        <h1 className="text-4xl font-black text-white tracking-tight mb-8">Terms of Service</h1>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
          <p><strong className="text-white">Effective Date:</strong> March 2026</p>

          <h2 className="text-white text-lg font-bold">1. Scope</h2>
          <p>
            Haul Command operates a directory and intelligence platform for the global heavy haul transport industry.
            Our coverage spans 57 countries at varying levels of data maturity. Market depth varies by region —
            some markets are fully live with verified listings, while others are in data-collection or planning phases.
          </p>

          <h2 className="text-white text-lg font-bold">2. Directory Data</h2>
          <p>
            Haul Command aggregates publicly available business information to build provider profiles.
            Profiles may display information sourced from public records, industry databases, and user submissions.
            We do not guarantee the accuracy, completeness, or currency of any listing.
          </p>

          <h2 className="text-white text-lg font-bold">3. Claim & Verify</h2>
          <p>
            Business owners may claim their listing to update information, respond to inquiries, and access premium features.
            Claiming a listing requires identity verification. Haul Command reserves the right to deny or revoke claims.
          </p>

          <h2 className="text-white text-lg font-bold">4. Rate Intelligence</h2>
          <p>
            Rate data displayed on Haul Command is informational only. Rates represent general market ranges compiled from
            public sources, operator submissions, and industry benchmarks. Rates are not quotes and may not reflect
            current market conditions. Always confirm pricing directly with operators.
          </p>

          <h2 className="text-white text-lg font-bold">5. Market Maturity</h2>
          <p>
            Each country and region on Haul Command operates at a specific maturity level:
            Live, Data Available, Planned, or Coming Soon. Pages clearly indicate their maturity state.
            Features and data availability vary by maturity level.
          </p>

          <h2 className="text-white text-lg font-bold">6. Remove Listing</h2>
          <p>
            To request removal of a listing, use our Report Issue page or contact us directly.
            Removal requests are processed within 5 business days.
          </p>

          <h2 className="text-white text-lg font-bold">7. Limitation of Liability</h2>
          <p>
            Haul Command provides information on an &quot;as is&quot; basis. We are not responsible for decisions made
            based on directory data, rate intelligence, or requirement information displayed on the platform.
          </p>
        </div>
      </main>
    </>
  );
}
