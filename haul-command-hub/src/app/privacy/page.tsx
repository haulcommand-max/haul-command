import Navbar from '@/components/Navbar';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Privacy Policy — HAUL COMMAND',
  description: 'Privacy Policy for Haul Command. How we collect, use, and protect data across our 57-country directory platform.',
};

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 min-h-screen">
        <h1 className="text-4xl font-black text-white tracking-tight mb-8">Privacy Policy</h1>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
          <p><strong className="text-white">Effective Date:</strong> March 2026</p>

          <h2 className="text-white text-lg font-bold">1. What We Collect</h2>
          <p>
            Haul Command collects publicly available business information to populate directory listings.
            When users interact with the platform, we may collect:
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Email addresses (when signing up for alerts or claiming listings)</li>
            <li>Authentication data (via OAuth providers: Google, Facebook, LinkedIn)</li>
            <li>Usage analytics (page views, search queries, click patterns)</li>
            <li>Device and browser information for service optimization</li>
          </ul>

          <h2 className="text-white text-lg font-bold">2. How We Use Data</h2>
          <p>
            We use collected data to maintain and improve the directory, provide rate intelligence,
            deliver alert notifications, and support listing verification. We do not sell personal data to third parties.
          </p>

          <h2 className="text-white text-lg font-bold">3. Cookies & Analytics</h2>
          <p>
            Haul Command uses Google Analytics 4 (GA4) for usage analytics, loaded conditionally when configured.
            We use essential cookies for authentication and session management.
          </p>

          <h2 className="text-white text-lg font-bold">4. Third-Party Services</h2>
          <p>
            We use Supabase for database and authentication services, and Google/Facebook/LinkedIn for OAuth sign-in.
            Each third-party service operates under its own privacy policy.
          </p>

          <h2 className="text-white text-lg font-bold">5. Data Retention</h2>
          <p>
            Directory listing data is retained as long as the listing is active.
            User account data is retained until the account is deleted.
            Alert signup data is retained until the user unsubscribes.
          </p>

          <h2 className="text-white text-lg font-bold">6. Your Rights</h2>
          <p>
            You may request access to, correction of, or deletion of your personal data.
            Business owners may claim, correct, or request removal of their listings.
            Contact us via the Report Issue page for data requests.
          </p>

          <h2 className="text-white text-lg font-bold">7. Geographic Scope</h2>
          <p>
            Haul Command operates across 57 countries at varying maturity levels.
            Data handling practices comply with applicable laws in each jurisdiction where we operate.
          </p>
        </div>
      </main>
    </>
  );
}
