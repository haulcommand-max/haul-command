import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Privacy Policy | Haul Command',
    description: 'How Haul Command collects, uses, and protects your personal information.',
};

export default function PrivacyPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-slate-300">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-black text-white mb-8">Privacy Policy</h1>
                <p className="text-sm text-slate-500 mb-8">Last updated: February 20, 2026</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">1. Information We Collect</h2>
                        <p><strong>Account Information:</strong> Name, email address, phone number (E.164), business name, service area, and profile details you provide.</p>
                        <p className="mt-2"><strong>Usage Data:</strong> Pages visited, features used, device information, IP address, and browser type.</p>
                        <p className="mt-2"><strong>Location Data:</strong> Approximate location for matching loads to nearby operators (only when you grant permission).</p>
                        <p className="mt-2"><strong>Communications:</strong> Messages exchanged through the Platform&apos;s dispatch system.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">2. How We Use Your Information</h2>
                        <p>We use your information to: (a) match loads with available operators; (b) display your profile in the directory; (c) send notifications about relevant loads; (d) process payments; (e) improve the Platform; (f) ensure compliance with safety regulations.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">3. Information Sharing</h2>
                        <p>We share information with: (a) other Platform users as necessary for load matching; (b) payment processors for transactions; (c) law enforcement when required by law. We do <strong>not</strong> sell your personal information.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">4. Data Security</h2>
                        <p>We implement industry-standard security measures including encryption in transit (TLS) and at rest, row-level security on database tables, and regular security audits.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">5. Your Rights</h2>
                        <p>You may: (a) access your personal data; (b) correct inaccurate information; (c) delete your account and associated data; (d) export your data; (e) opt out of marketing communications. Contact us at <a href="mailto:privacy@haulcommand.com" className="text-amber-500 hover:underline">privacy@haulcommand.com</a>.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">6. Cookies</h2>
                        <p>We use essential cookies for authentication and language preferences (hc_locale). We do not use third-party tracking cookies.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">7. Children&apos;s Privacy</h2>
                        <p>The Platform is not intended for users under 18. We do not knowingly collect information from minors.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">8. International Users</h2>
                        <p>The Platform operates in the United States and Canada. By using the Platform from other countries, you consent to data transfer to the US.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">9. Contact</h2>
                        <p>For privacy inquiries: <a href="mailto:privacy@haulcommand.com" className="text-amber-500 hover:underline">privacy@haulcommand.com</a></p>
                    </section>
                </div>
            </div>
        </div>
    );
}
