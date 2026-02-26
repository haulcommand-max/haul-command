import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Terms of Service | Haul Command',
    description: 'Terms governing your use of the Haul Command platform.',
};

export default function TermsPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-slate-300">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-black text-white mb-8">Terms of Service</h1>
                <p className="text-sm text-slate-500 mb-8">Last updated: February 20, 2026</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Acceptance of Terms</h2>
                        <p>By accessing or using Haul Command (&quot;the Platform&quot;), you agree to be bound by these Terms of Service. If you do not agree, you may not use the Platform.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. Description of Service</h2>
                        <p>Haul Command provides a marketplace connecting oversize/overweight load brokers, carriers, and pilot car/escort vehicle operators across the United States and Canada. The Platform includes a load board, operator directory, leaderboard, and communication tools.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. User Accounts</h2>
                        <p>You must provide accurate, current information when creating an account. You are responsible for maintaining the security of your credentials and for all activity under your account. You must be at least 18 years old.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Acceptable Use</h2>
                        <p>You agree not to: (a) post false, misleading, or fraudulent content; (b) harass, threaten, or impersonate other users; (c) use automated tools to scrape data without authorization; (d) circumvent safety or compliance features; (e) post content that violates applicable laws.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Content Ownership</h2>
                        <p>You retain ownership of content you create. By posting content, you grant Haul Command a non-exclusive, worldwide license to display, distribute, and promote your content within the Platform.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Payments &amp; Escrow</h2>
                        <p>Financial transactions between users are facilitated through our escrow system. Haul Command is not a party to contracts between brokers and operators. Disputes are subject to our arbitration process.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Termination</h2>
                        <p>We may suspend or terminate accounts that violate these Terms. You may delete your account at any time through your account settings.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. Limitation of Liability</h2>
                        <p>Haul Command is provided &quot;as is&quot; without warranties. We are not liable for indirect, incidental, or consequential damages arising from your use of the Platform.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Governing Law</h2>
                        <p>These Terms are governed by the laws of the State of Florida, United States. Disputes shall be resolved through binding arbitration.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">10. Contact</h2>
                        <p>For questions about these Terms, contact us at <a href="mailto:legal@haulcommand.com" className="text-amber-500 hover:underline">legal@haulcommand.com</a>.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
