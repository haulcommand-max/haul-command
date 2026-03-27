import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title:'PrivacyPolicy — GDPR, UK GDPR, Australian Privacy Act |',
  description: 'Haul Command privacy policy covering GDPR (EU), UK GDPR, Australian Privacy Act, and data processing across 120 countries.',
};

const DATA_CATEGORIES = [
  { category: 'Business Directory Data', basis: 'Legitimate Interest (Art. 6(1)(f))', retention: 'Until listing removed or business dissolves', description: 'Publicly available business names, addresses, phone numbers, and service areas collected to populate directory listings.' },
  { category: 'Account & Authentication', basis: 'Contract Performance (Art. 6(1)(b))', retention: 'Until account deletion', description: 'Email, OAuth tokens, and profile data needed to provide account functionality.' },
  { category: 'Payment & Transaction', basis: 'Contract Performance (Art. 6(1)(b))', retention: '7 years (tax compliance)', description: 'Stripe customer IDs, subscription status, escrow records, and HC Pay wallet data.' },
  { category: 'Analytics & Usage', basis: 'Legitimate Interest (Art. 6(1)(f))', retention: '26 months', description: 'Page views, search queries, click patterns via Google Analytics 4.' },
  { category: 'ELD/Telematics (Motive)', basis: 'Consent (Art. 6(1)(a))', retention: 'Active connection duration', description: 'Vehicle positions, HOS status, safety scores — only with explicit operator OAuth consent.' },
  { category: 'Communication', basis: 'Consent (Art. 6(1)(a))', retention: 'Until unsubscribe', description: 'Email alert signups, SMS opt-in records, push notification tokens.' },
  { category: 'Advertising', basis: 'Legitimate Interest (Art. 6(1)(f))', retention: '90 days', description: 'Ad impression/click records, campaign performance data.' },
];

export default function PrivacyPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-4xl mx-auto px-4 py-16 min-h-screen">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: March 21, 2026 · Effective across 120 countries</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-8 text-gray-400">
          <section>
            <h2 className="text-white text-xl font-bold">1. Data Controller</h2>
            <p>Haul Command LLC (&quot;HC&quot;, &quot;we&quot;, &quot;us&quot;) acts as the data controller for personal information processed through haulcommand.com and related services. Contact: <strong className="text-accent">privacy@haulcommand.com</strong></p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold">2. Data We Collect & Legal Basis</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 py-3 pr-4 font-medium">Category</th>
                    <th className="text-left text-gray-400 py-3 pr-4 font-medium">Legal Basis</th>
                    <th className="text-left text-gray-400 py-3 pr-4 font-medium">Retention</th>
                  </tr>
                </thead>
                <tbody>
                  {DATA_CATEGORIES.map((cat) => (
                    <tr key={cat.category} className="border-b border-white/5">
                      <td className="text-white py-3 pr-4 font-medium">{cat.category}</td>
                      <td className="text-gray-400 py-3 pr-4 text-xs">{cat.basis}</td>
                      <td className="text-gray-500 py-3 pr-4 text-xs">{cat.retention}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold">3. Your Rights</h2>
            <p>Under GDPR and applicable data protection laws, you have the right to:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Access</strong> — Request a copy of all your personal data</li>
              <li><strong className="text-white">Rectification</strong> — Correct inaccurate information</li>
              <li><strong className="text-white">Erasure</strong> — Delete all your personal data (<Link href="/api/privacy/delete" className="text-accent hover:underline">API endpoint</Link>)</li>
              <li><strong className="text-white">Portability</strong> — Export your data in JSON format (<Link href="/api/privacy/export" className="text-accent hover:underline">API endpoint</Link>)</li>
              <li><strong className="text-white">Object</strong> — Object to processing based on legitimate interest</li>
              <li><strong className="text-white">Restrict</strong> — Limit how we process your data</li>
              <li><strong className="text-white">Withdraw Consent</strong> — Revoke consent at any time</li>
            </ul>
            <p className="mt-4">To exercise any right, email <strong className="text-accent">privacy@haulcommand.com</strong> or use our automated endpoints. We respond within 30 days (GDPR) / 28 days (UK GDPR) / 30 days (Australian Privacy Act).</p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold">4. Cookies & Tracking</h2>
            <p>We use the following categories of cookies:</p>
            <ul className="list-disc list-inside space-y-1">
              <li><strong className="text-white">Essential</strong> — Authentication, session management (always active)</li>
              <li><strong className="text-white">Analytics</strong> — Google Analytics 4 (GA4) for usage patterns (consent required in EU/UK)</li>
              <li><strong className="text-white">Advertising</strong> — Google Ad Manager for programmatic ad delivery (consent required in EU/UK)</li>
            </ul>
            <p className="mt-2">EU/UK visitors will see a cookie consent banner. You can manage preferences at any time.</p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold">5. International Data Transfers</h2>
            <p>HC processes data in the United States. For EU/UK data subjects, transfers are protected by Standard Contractual Clauses (SCCs) with our sub-processors:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Supabase (database & auth) — US/EU</li>
              <li>Stripe (payments) — US/EU</li>
              <li>Vercel (hosting) — US/EU edge</li>
              <li>Google (analytics, maps, AI) — Global</li>
              <li>Motive (ELD telematics) — US</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold">6. Data Breach Protocol</h2>
            <p>In the event of a personal data breach, HC will:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Notify the relevant supervisory authority within 72 hours (GDPR Art. 33)</li>
              <li>Notify affected individuals without undue delay if high risk (Art. 34)</li>
              <li>Notify the UK ICO within 72 hours for UK GDPR breaches</li>
              <li>Notify the OAIC for Australian Privacy Act breaches</li>
              <li>Document all breaches in an internal register</li>
            </ul>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="text-white text-xl font-bold">🇬🇧 UK GDPR Notice</h2>
            <p>For UK data subjects, we comply with the UK GDPR (retained EU law as modified by the Data Protection Act 2018). Your supervisory authority is the Information Commissioner&apos;s Office (ICO): <a href="https://ico.org.uk" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">ico.org.uk</a></p>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="text-white text-xl font-bold">🇦🇺 Australian Privacy Act Notice</h2>
            <p>For Australian data subjects, we comply with the Privacy Act 1988 (Cth) and the Australian Privacy Principles (APPs). Your supervisory authority is the Office of the Australian Information Commissioner (OAIC): <a href="https://www.oaic.gov.au" className="text-accent hover:underline" target="_blank" rel="noopener noreferrer">oaic.gov.au</a></p>
            <p className="mt-2">We do not sell or trade personal information to overseas recipients except as described in Section 5 (International Data Transfers).</p>
          </section>

          <section className="border-t border-white/10 pt-8">
            <h2 className="text-white text-xl font-bold">7. Children</h2>
            <p>HC services are intended for business users aged 18+. We do not knowingly collect data from children under 16 (EU) / 13 (US).</p>
          </section>

          <section>
            <h2 className="text-white text-xl font-bold">8. Changes</h2>
            <p>We may update this policy. Material changes will be notified via email and in-app banner. Continued use after notification constitutes acceptance.</p>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10 flex flex-wrap gap-4 text-sm">
            <Link href="/legal/dpa" className="text-accent hover:underline">Data Processing Agreement →</Link>
            <Link href="/terms" className="text-accent hover:underline">Terms of Service →</Link>
            <Link href="/report-data-issue" className="text-accent hover:underline">Report a Data Issue →</Link>
          </div>
        </div>
      </main>
    </>
  );
}
