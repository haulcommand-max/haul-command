import Link from "next/link";

// /vendors/apply/thanks
export default function VendorApplyThanksPage() {
    return (
        <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
            </div>

            <div>
                <h1 className="text-2xl font-bold text-gray-900">You&apos;re in.</h1>
                <p className="mt-2 text-gray-500">
                    Once approved, you&apos;ll appear in the directory and can upgrade for better in-app placement.
                </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-6 text-left space-y-3">
                <h2 className="font-semibold text-gray-800">Next steps</h2>
                <ul className="space-y-2 text-sm text-gray-600">
                    <li className="flex gap-2">
                        <span className="text-orange-500">›</span>
                        If you chose a paid tier, we&apos;ll send the setup link after approval.
                    </li>
                    <li className="flex gap-2">
                        <span className="text-orange-500">›</span>
                        Make sure dispatch answers fast — missed calls hurt rankings later.
                    </li>
                </ul>
            </div>

            <Link href="/"
                className="inline-block px-6 py-2.5 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors">
                Back to home
            </Link>
        </div>
    );
}
