import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | HAUL COMMAND',
    description: 'HAUL COMMAND Terms of Service — governing platform usage, operator agreements, and service conditions.',
};

export default function TermsPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#030712', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", color: '#D1D5DB', padding: '3rem 1rem' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 8 }}>HAUL COMMAND</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>Terms of Service</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 2rem' }}>Last updated: March 6, 2026</p>

                <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>1. Acceptance of Terms</h2>
                    <p>By accessing or using HAUL COMMAND (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. The Platform is operated by HAUL COMMAND LLC. If you do not agree to these terms, do not use the Platform.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>2. Description of Service</h2>
                    <p>HAUL COMMAND is a digital marketplace connecting oversize load brokers with certified escort vehicle operators (pilot cars) across 57 countries. Services include directory listings, load matching, AI-powered dispatch, route surveys, compliance verification, and payment processing.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>3. User Accounts</h2>
                    <p>You must provide accurate, complete information when creating an account. You are responsible for maintaining the confidentiality of your credentials. You must be at least 18 years old to use the Platform. HAUL COMMAND reserves the right to suspend or terminate accounts that violate these terms.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>4. Operator Obligations</h2>
                    <p>Operators listed on the Platform must maintain valid insurance, licensing, and equipment as required by their jurisdiction. HAUL COMMAND verifies credentials but does not guarantee operator qualifications. Operators are independent contractors, not employees of HAUL COMMAND.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>5. Broker Obligations</h2>
                    <p>Brokers must provide accurate load dimensions, routes, and timing. Brokers are responsible for payment to operators as agreed. Load postings must comply with all applicable federal, state/provincial, and local regulations.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>6. Payments</h2>
                    <p>The Platform facilitates payments via Stripe (fiat currency) and NOWPayments (cryptocurrency). HAUL COMMAND is not a payment processor and does not hold funds in escrow. Transaction fees may apply. Cryptocurrency payments are subject to blockchain confirmation times and network fees.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>7. AI Services</h2>
                    <p>HAUL COMMAND provides AI-powered tools including dispatch parsing, regulation lookup, route surveys, and content generation. AI outputs are for informational purposes only and should not be relied upon as legal, regulatory, or safety advice. Always verify AI-generated information with official sources.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>8. Intellectual Property</h2>
                    <p>All content, branding, designs, algorithms, and proprietary data on the Platform are owned by HAUL COMMAND LLC. User-generated content (profiles, reviews, photos) remains owned by the user but is licensed to HAUL COMMAND for display and platform operation.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>9. Limitation of Liability</h2>
                    <p>HAUL COMMAND provides the Platform &quot;as is&quot; without warranties. We are not liable for disputes between operators and brokers, delays, damages during transport, or any losses arising from use of the Platform. Our total liability shall not exceed the amount paid by you in the preceding 12 months.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>10. Governing Law</h2>
                    <p>These Terms shall be governed by the laws of the State of Florida, United States. Disputes shall be resolved through binding arbitration in Miami-Dade County, Florida.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>11. Modifications</h2>
                    <p>HAUL COMMAND reserves the right to modify these Terms at any time. Continued use of the Platform after modifications constitutes acceptance of the updated Terms.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>12. Contact</h2>
                    <p>For questions about these Terms, contact us at <a href="mailto:legal@haulcommand.com" style={{ color: '#F59E0B' }}>legal@haulcommand.com</a>.</p>
                </div>
            </div>
        </div>
    );
}
