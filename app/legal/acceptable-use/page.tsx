import { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Acceptable Use Policy | HAUL COMMAND',
    description: 'HAUL COMMAND Acceptable Use Policy — prohibited activities, enforcement actions, and platform integrity standards.',
};

export default function AcceptableUsePage() {
    return (
        <div style={{ minHeight: '100vh', background: '#030712', fontFamily: "var(--font-inter, 'Inter', system-ui, sans-serif)", color: '#D1D5DB', padding: '3rem 1rem' }}>
            <div style={{ maxWidth: 720, margin: '0 auto' }}>
                <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.2em', color: '#F59E0B', marginBottom: 8 }}>HAUL COMMAND</div>
                <h1 style={{ fontSize: 28, fontWeight: 800, color: '#F9FAFB', margin: '0 0 8px' }}>Acceptable Use Policy</h1>
                <p style={{ fontSize: 13, color: '#6B7280', margin: '0 0 2rem' }}>Last updated: April 2, 2026</p>

                <div style={{ lineHeight: 1.8, fontSize: 14 }}>
                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>1. Purpose</h2>
                    <p>This Acceptable Use Policy (&quot;AUP&quot;) defines the rules for using the HAUL COMMAND platform. All users — operators, brokers, carriers, shippers, and visitors — must comply with this AUP in addition to our <a href="/legal/terms" style={{ color: '#F59E0B' }}>Terms of Service</a>.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>2. Prohibited Activities</h2>
                    <p>You may NOT use the Platform to:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li><strong style={{ color: '#F9FAFB' }}>Fraud & Misrepresentation:</strong> Submit false credentials, fake insurance certificates, fabricated reviews, or inaccurate equipment specifications. Impersonate another operator, company, or government entity.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Safety Violations:</strong> Accept escort assignments without proper licensing, insurance, or equipment for the jurisdiction. Operate while impaired. Falsify compliance documentation.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Rate Manipulation:</strong> Collude with other operators to fix pricing. Submit fake bid data to manipulate market rate benchmarks. Use multiple accounts to artificially inflate or deflate rates.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Data Scraping:</strong> Systematically scrape, copy, or harvest platform data (profiles, rates, contact information) without authorization. This includes using bots, spiders, or automated tools.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Platform Abuse:</strong> Create multiple accounts to circumvent pricing, blacklists, or entitlement limits. Exploit bugs or security vulnerabilities. Interfere with platform operations.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Harassment:</strong> Threaten, harass, or intimidate other users via messaging, reviews, or social features. Post discriminatory, defamatory, or obscene content.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Evasion:</strong> Circumvent paywall, subscription, or entitlement controls. Share login credentials. Use unauthorized third-party tools to bypass platform restrictions.</li>
                        <li><strong style={{ color: '#F9FAFB' }}>Spam & Solicitation:</strong> Send unsolicited commercial messages via platform messaging. Post irrelevant content to game the social feed or community features.</li>
                    </ul>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>3. Trust Score Integrity</h2>
                    <p>Manipulating Trust Scores — through fake reviews, sham transactions, or coordinated rating schemes — is strictly prohibited and will result in immediate account suspension. Trust Scores are calculated algorithmically and are not influenced by advertising spend or subscription tier.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>4. Advertising & Sponsored Content</h2>
                    <p>All paid placements (AdGrid boosts, featured listings, territory sponsorships) are clearly labeled as &quot;Ad&quot;, &quot;Featured&quot;, or &quot;Sponsored&quot; in compliance with FTC, CMA, and EU DSA requirements. Advertisers may not disguise paid placements as organic content.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>5. Data Product Usage</h2>
                    <p>Purchased data products (corridor reports, market intelligence, rate benchmarks) are for the buyer&apos;s internal business use only. Reselling, redistribution, or publication of data products without written authorization is prohibited. API access is subject to rate limits and usage terms.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>6. International Compliance</h2>
                    <p>Users operating in multiple countries must comply with the laws and regulations of each jurisdiction. HAUL COMMAND provides regulatory information for guidance only — compliance remains the user&apos;s responsibility. Operating without required local licenses, permits, or insurance is a violation of this AUP.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>7. Enforcement Actions</h2>
                    <p>Violations may result in one or more of the following:</p>
                    <ul style={{ paddingLeft: 20 }}>
                        <li><strong style={{ color: '#EF4444' }}>Warning:</strong> Written notice for first-time minor violations</li>
                        <li><strong style={{ color: '#F59E0B' }}>Suspension:</strong> Temporary account restriction (7-30 days), AdGrid campaigns paused</li>
                        <li><strong style={{ color: '#EF4444' }}>Termination:</strong> Permanent account closure. Active subscriptions cancelled without refund.</li>
                        <li><strong style={{ color: '#EF4444' }}>Legal Action:</strong> Referral to law enforcement for fraud, data theft, or safety violations</li>
                        <li><strong style={{ color: '#F59E0B' }}>Trust Score Reset:</strong> Score zeroed and flagged. Reconstruction requires full re-verification.</li>
                    </ul>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>8. Reporting Violations</h2>
                    <p>Report AUP violations to <a href="mailto:compliance@haulcommand.com" style={{ color: '#F59E0B' }}>compliance@haulcommand.com</a> or use the in-platform reporting feature. All reports are investigated within 48 hours.</p>

                    <h2 style={{ color: '#F9FAFB', fontSize: 18, fontWeight: 700, marginTop: '2rem' }}>9. Contact</h2>
                    <p>Compliance Team: <a href="mailto:compliance@haulcommand.com" style={{ color: '#F59E0B' }}>compliance@haulcommand.com</a></p>
                    <p>HAUL COMMAND LLC, United States</p>
                </div>
            </div>
        </div>
    );
}