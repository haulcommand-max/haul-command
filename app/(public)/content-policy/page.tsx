import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Content Policy | Haul Command',
    description: 'Community guidelines and content standards for the Haul Command platform.',
};

export default function ContentPolicyPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-slate-300">
            <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-4xl font-black text-white mb-8">Content Policy</h1>
                <p className="text-sm text-slate-500 mb-8">Last updated: February 20, 2026</p>

                <div className="space-y-8 text-sm leading-relaxed">
                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">Purpose</h2>
                        <p>Haul Command is a professional marketplace for the heavy haul industry. All content must be relevant, accurate, and respectful.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">Prohibited Content</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Fraud:</strong> Fake profiles, fabricated credentials, or misleading service claims.</li>
                            <li><strong>Harassment:</strong> Threats, bullying, discrimination, or hostile communication.</li>
                            <li><strong>Spam:</strong> Unsolicited promotions, duplicate listings, or irrelevant content.</li>
                            <li><strong>Impersonation:</strong> Pretending to be another operator, company, or authority.</li>
                            <li><strong>Illegal Activity:</strong> Content promoting violation of DOT regulations, operating without required permits, or unsafe practices.</li>
                            <li><strong>Personal Information:</strong> Sharing another person&apos;s private information without consent.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">Reporting Violations</h2>
                        <p>Every profile, load listing, and piece of user content includes a <strong>Report</strong> button. Reports are reviewed by our moderation team within 24 hours. Confirmed violations result in content removal and possible account suspension.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">Enforcement</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>First offense:</strong> Warning and content removal.</li>
                            <li><strong>Second offense:</strong> 7-day account suspension.</li>
                            <li><strong>Third offense:</strong> Permanent ban.</li>
                            <li><strong>Severe violations (fraud, safety):</strong> Immediate permanent ban.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-bold text-white mb-3">Appeals</h2>
                        <p>If you believe an action was taken in error, contact <a href="mailto:moderation@haulcommand.com" className="text-amber-500 hover:underline">moderation@haulcommand.com</a> within 14 days.</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
