import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | HAUL COMMAND',
    description: 'HAUL COMMAND Privacy Policy — how we collect, use, and protect your data across 120 countries.',
};

export default function PrivacyPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#030712', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", color: '#D1D5DB', padding: '3rem 1rem' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 8 }}>HAUL COMMAND</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>Privacy Policy</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 2rem' }}>Last updated: March 6, 2026</p>

                <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>1. Information We Collect</h2>
                    <p><strong style={{ color: '#F9FAFB' }}>Account Information:</strong> Name, email, phone number, company name, and profile details you provide during registration.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Operator Data:</strong> Licenses, insurance certificates, equipment specifications, service areas, and availability status.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Location Data:</strong> With your consent, we collect general location data for matching you with nearby loads and displaying your service area.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Usage Data:</strong> Pages visited, features used, search queries, and interaction patterns to improve the Platform.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Payment Data:</strong> Transaction records processed through Stripe and NOWPayments. We do not store credit card numbers or crypto private keys.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>2. How We Use Your Data</h2>
                    <ul style={{ paddingLeft: 20 }}>
                        <li>To operate and improve the Platform</li>
                        <li>To match operators with load opportunities</li>
                        <li>To calculate Trust Scores and Leaderboard rankings</li>
                        <li>To verify compliance and credentials</li>
                        <li>To process payments and generate invoices</li>
                        <li>To send notifications about loads, matches, and platform updates</li>
                        <li>To power AI features (dispatch parsing, regulation lookup, route surveys)</li>
                        <li>To generate anonymous market intelligence and analytics</li>
                    </ul>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>3. AI Data Processing</h2>
                    <p>When you use AI features, your queries are sent to Anthropic for processing. We do not use your data to train AI models. AI responses are not stored beyond the current session unless you explicitly save them.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>4. Data Sharing</h2>
                    <p>We share your data only with:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li><strong style={{ color: '#F9FAFB' }}>Other users:</strong> Your public profile, availability, and service areas are visible to brokers and operators using the Platform</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Service providers:</strong> Stripe (payments), NOWPayments (crypto), Firebase (notifications), Supabase (database hosting), Anthropic (AI processing)</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Legal requirements:</strong> When required by law, subpoena, or court order</li>
                    </ul>
                    <p>We never sell your personal data to third parties.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>5. International Data Transfers</h2>
                    <p>HAUL COMMAND operates across 120 countries. Your data may be transferred and processed in the United States and other countries where our service providers operate. We implement appropriate safeguards including encryption in transit and at rest.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>6. GDPR Compliance (EU/EEA Users)</h2>
                    <p>If you are located in the EU/EEA, you have the right to: access your data, rectify inaccuracies, request deletion, restrict processing, data portability, and object to processing. Contact <a href="mailto:privacy@haulcommand.com" style={{ color: '#F59E0B' }}>privacy@haulcommand.com</a> to exercise these rights.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>7. Data Monetization & Anonymized Products</h2>
                    <p>HAUL COMMAND generates anonymized, aggregated market intelligence products including corridor demand snapshots, rate benchmarks, operator density maps, and market reports. These products:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li><strong style={{ color: '#F9FAFB' }}>Never contain personally identifiable information</strong> — all data is aggregated across multiple operators within a region or corridor</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Use statistical aggregation</strong> — minimum 5 data points per cell, no individual operator can be identified</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Are derived from platform activity</strong> — search patterns, load postings, fill rates, and pricing trends</li>
                    </ul>
                    <p><strong style={{ color: '#F9FAFB' }}>Your Rights:</strong> You may opt out of having your anonymized activity included in data products by contacting <a href="mailto:privacy@haulcommand.com" style={{ color: '#F59E0B' }}>privacy@haulcommand.com</a> or toggling the &quot;Data Products Opt-Out&quot; setting in your account dashboard. Note: opting out does not affect your use of the Platform.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Legal Basis (GDPR):</strong> We process this data under Article 6(1)(f) — legitimate interest in operating and improving a logistics marketplace. For EU/EEA users, this processing is covered by our balancing test documentation available upon request.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>8. Data Retention</h2>
                    <p>We retain your account data for as long as your account is active. After account deletion, we retain anonymized data for analytics purposes for up to 3 years. Payment records are retained for 7 years as required by financial regulations.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>9. Security</h2>
                    <p>We implement industry-standard security measures including: TLS encryption, Row Level Security (Supabase RLS), bcrypt password hashing, and API key rotation. We use Sentry for error monitoring and PostHog for privacy-compliant analytics.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>10. Cookies</h2>
                    <p>We use essential cookies for authentication and session management. Analytics cookies (PostHog, Google Analytics) are used only with your consent in jurisdictions where required.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>11. Children&apos;s Privacy</h2>
                    <p>The Platform is not intended for users under 18. We do not knowingly collect data from minors.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>12. Contact</h2>
                    <p>Data Protection Officer: <a href="mailto:privacy@haulcommand.com" style={{ color: '#F59E0B' }}>privacy@haulcommand.com</a></p>
                    <p>HAUL COMMAND LLC, United States</p>
                </div>
            </div>
        </div>
    );
}
