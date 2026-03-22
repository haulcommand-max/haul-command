import Navbar from '@/components/Navbar';
import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Data Processing Agreement (DPA) — HAUL COMMAND',
  description: 'Haul Command Data Processing Agreement for GDPR, UK GDPR, and international data protection compliance.',
};

export default function DPAPage() {
  return (
    <>
      <Navbar />
      <main className="max-w-3xl mx-auto px-4 py-16 min-h-screen">
        <h1 className="text-4xl font-black text-white tracking-tight mb-2">Data Processing Agreement</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: March 21, 2026</p>

        <div className="prose prose-invert prose-sm max-w-none space-y-6 text-gray-400">
          <section>
            <h2 className="text-white text-lg font-bold">1. Parties</h2>
            <p>This Data Processing Agreement (&quot;DPA&quot;) is between:</p>
            <ul className="list-disc list-inside">
              <li><strong className="text-white">Data Controller:</strong> The entity or individual subscribing to Haul Command services (&quot;Customer&quot;)</li>
              <li><strong className="text-white">Data Processor:</strong> Haul Command LLC (&quot;HC&quot;), operating at haulcommand.com</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">2. Scope & Purpose</h2>
            <p>HC processes personal data on behalf of the Customer solely for:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>Operating and maintaining directory listings</li>
              <li>Processing payments via Stripe (PCI DSS compliant)</li>
              <li>Providing analytics and intelligence reports</li>
              <li>Facilitating ELD/telematics integration (Motive)</li>
              <li>Delivering communication services (email, SMS, push)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">3. Sub-Processors</h2>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left text-gray-400 py-2 pr-4">Sub-Processor</th>
                    <th className="text-left text-gray-400 py-2 pr-4">Purpose</th>
                    <th className="text-left text-gray-400 py-2">Location</th>
                  </tr>
                </thead>
                <tbody className="text-xs">
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-white">Supabase</td><td className="py-2 pr-4">Database, Authentication</td><td className="py-2">US / EU</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-white">Stripe</td><td className="py-2 pr-4">Payments</td><td className="py-2">US / EU</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-white">Vercel</td><td className="py-2 pr-4">Hosting, Edge Functions</td><td className="py-2">US / EU Edge</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-white">Google Cloud</td><td className="py-2 pr-4">Analytics, Maps, AI</td><td className="py-2">Global</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-white">Motive</td><td className="py-2 pr-4">ELD Telematics</td><td className="py-2">US</td></tr>
                  <tr className="border-b border-white/5"><td className="py-2 pr-4 text-white">Resend</td><td className="py-2 pr-4">Email Delivery</td><td className="py-2">US</td></tr>
                </tbody>
              </table>
            </div>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">4. Security Measures</h2>
            <ul className="list-disc list-inside space-y-1">
              <li>Encryption in transit (TLS 1.3) and at rest (AES-256)</li>
              <li>Row Level Security (RLS) on all Supabase tables</li>
              <li>HMAC-SHA512 webhook signature verification</li>
              <li>OAuth 2.0 with PKCE for authentication</li>
              <li>Role-based access control (RBAC)</li>
              <li>Automated vulnerability scanning</li>
              <li>Annual security review</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">5. Data Subject Rights</h2>
            <p>HC will assist the Customer in responding to data subject requests within:</p>
            <ul className="list-disc list-inside space-y-1">
              <li>30 days (GDPR, Art. 12(3))</li>
              <li>28 days (UK GDPR)</li>
              <li>30 days (Australian Privacy Act)</li>
            </ul>
            <p className="mt-2">Automated endpoints are available at <code className="text-accent">/api/privacy/delete</code> and <code className="text-accent">/api/privacy/export</code>.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">6. Breach Notification</h2>
            <p>HC will notify the Customer of any personal data breach within 48 hours of discovery, providing category of data affected, estimated number of individuals, and remediation steps taken.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">7. Standard Contractual Clauses</h2>
            <p>For international transfers to countries without an EU adequacy decision, HC relies on the EU Standard Contractual Clauses (SCCs) as adopted by the European Commission on June 4, 2021.</p>
          </section>

          <section>
            <h2 className="text-white text-lg font-bold">8. Term & Termination</h2>
            <p>This DPA remains in effect for the duration of the service agreement. Upon termination, HC will delete or return all personal data within 90 days, unless retention is required by law.</p>
          </section>

          <div className="mt-12 pt-8 border-t border-white/10 text-sm text-gray-500">
            <p>To sign this DPA or request a countersigned copy, contact <strong className="text-accent">legal@haulcommand.com</strong></p>
            <div className="flex gap-4 mt-4">
              <Link href="/privacy" className="text-accent hover:underline">Privacy Policy →</Link>
              <Link href="/terms" className="text-accent hover:underline">Terms of Service →</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
