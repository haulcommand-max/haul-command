import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Refund Policy | HAUL COMMAND',
    description: 'HAUL COMMAND refund and cancellation policy for subscriptions, AdGrid placements, data products, and profile boosts.',
};

export default function RefundPolicyPage() {
    return (
        <div style={{ minHeight: '100vh', background: '#030712', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", color: '#D1D5DB', padding: '3rem 1rem' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 8 }}>HAUL COMMAND</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>Refund & Cancellation Policy</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 2rem' }}>Last updated: April 2, 2026</p>

                <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>1. Subscription Refunds</h2>
                    <p><strong style={{ color: '#F9FAFB' }}>Monthly Subscriptions (Pro, Business, Elite):</strong> You may cancel at any time. Cancellation takes effect at the end of the current billing period. We do not provide prorated refunds for partial months. Your access continues until the end of the paid period.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Annual Subscriptions:</strong> You may cancel within 14 days of purchase for a full refund. After 14 days, cancellation takes effect at the end of the annual billing cycle with no prorated refund.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>2. AdGrid / Profile Boost Refunds</h2>
                    <p><strong style={{ color: '#F9FAFB' }}>Before Campaign Start:</strong> If your AdGrid placement or profile boost has not yet begun serving (status: &quot;pending&quot;), you may request a full refund within 48 hours of purchase.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>During Active Campaign:</strong> Once an AdGrid placement is actively serving impressions, refunds are not available. You may cancel future renewal at any time.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Performance Guarantee:</strong> If your AdGrid placement receives zero impressions during a 30-day billing cycle due to a platform error (not a dormant market), you are entitled to a credit for the affected period.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>3. Data Product Refunds</h2>
                    <p><strong style={{ color: '#F9FAFB' }}>One-Time Reports:</strong> Due to the digital nature of data products, all sales of one-time reports (Rate Benchmark, Claim Gap Analysis, etc.) are final once the report has been downloaded or accessed. If a report is demonstrably defective or contains materially incorrect data, contact <a href="mailto:support@haulcommand.com" style={{ color: '#F59E0B' }}>support@haulcommand.com</a> within 7 days for a review.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>Subscription Data Products:</strong> May be cancelled at any time. Access continues until the end of the paid period.</p>
                    <p><strong style={{ color: '#F9FAFB' }}>API Access:</strong> Enterprise API access may be cancelled with 30 days notice. No refund for the current billing period. Unused API credits do not roll over.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>4. Profile Claims</h2>
                    <p>Profile claim fees (Tier 2 claims) are non-refundable once the profile has been verified and transferred to your account. If the claim process fails due to a platform error, a full refund will be issued.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>5. Load Board & Escrow Payments</h2>
                    <p>Payments held in escrow for load board transactions follow the dispute resolution process outlined in the <a href="/legal/terms" style={{ color: '#F59E0B' }}>Terms of Service</a>. Disputes between operators and brokers are handled per the arbitration clause (Section 10, Terms of Service).</p>
                    
                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>6. Training & Certification</h2>
                    <p>Training module purchases are non-refundable once the module has been started (progress &gt; 0%). If a module has not been started, a refund may be requested within 30 days of purchase.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>7. International Currency & PPP Pricing</h2>
                    <p>Prices displayed in local currencies are converted from USD at the time of purchase using PPP-adjusted rates. Refunds are issued in the original payment currency at the original conversion rate. Exchange rate fluctuations do not entitle you to additional refunds.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>8. How to Request a Refund</h2>
                    <p>Email <a href="mailto:billing@haulcommand.com" style={{ color: '#F59E0B' }}>billing@haulcommand.com</a> with your account email, product/subscription name, and reason for the request. We aim to respond within 2 business days. Approved refunds are processed within 5-10 business days via the original payment method.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>9. Cryptocurrency Payments</h2>
                    <p>Payments made via cryptocurrency (NOWPayments) are subject to the same refund policies above. However, due to blockchain transaction fees and price volatility, crypto refunds will be issued in USDC stablecoin or equivalent fiat value at the time of refund processing.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>10. Contact</h2>
                    <p>Billing questions: <a href="mailto:billing@haulcommand.com" style={{ color: '#F59E0B' }}>billing@haulcommand.com</a></p>
                    <p>HAUL COMMAND LLC, United States</p>
                </div>
            </div>
        </div>
    );
}