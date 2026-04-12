import Link from "next/link";
import { CreditCard, FileText, CheckCircle, AlertTriangle } from "lucide-react";

export const metadata = {
    title: "Billing & Metering | Haul Command Enterprise API",
    description: "Understand the metered billing lifecycle, rollups, idempotency, and the usage ledger.",
};

export default function BillingPage() {
    return (
        <div className="max-w-4xl mx-auto py-12 px-6">
            <div className="mb-10">
                <Link aria-label="Navigation Link"
                    href="/developers"
                    className="text-amber-500 hover:text-amber-400 font-medium text-sm transition-colors mb-4 inline-block"
                >
                    &larr; Back to Developer Portal
                </Link>
                <h1 className="text-4xl font-bold text-white mb-4">
                    Metered Billing & Ledger
                </h1>
                <p className="text-xl text-neutral-400">
                    Transparent, verifiable, and exact-once consumption reporting.
                </p>
            </div>

            <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-6 mb-12">
                <div className="flex items-start gap-4">
                    <CheckCircle className="w-6 h-6 text-amber-500 shrink-0 mt-1" />
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-2">
                            The Accuracy Guarantee
                        </h3>
                        <p className="text-neutral-300 leading-relaxed mb-4">
                            Haul Command operates a strict <strong>Correctness Pattern</strong> for enterprise metered billing. Your raw API events are never billed directly. They are aggregated into daily rollups, watermarked, locked, and reported using deterministic idempotency hashes. This guarantees you are never double-billed, even in the event of system retries or crashes.
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-12">
                {/* 1. The Ledger */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <FileText className="w-6 h-6 text-neutral-400" />
                        The Usage Ledger
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-4">
                        All billed usage leaves an immutable audit trail in your Usage Ledger. This ledger links directly to the data sent to your Stripe invoice. In the event of an audit, our systems compute a "rollup hash" proving that the underlying data matches exactly what was invoiced.
                    </p>
                    <ul className="space-y-4">
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <div>
                                <strong className="text-white block mb-1">Daily Grain</strong>
                                <span className="text-neutral-400">Usage is reported in daily buckets using UTC timing.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <div>
                                <strong className="text-white block mb-1">Backfill Corrections</strong>
                                <span className="text-neutral-400">Late arriving events are aggregated automatically and reported as positive deltas in subsequent day pipelines.</span>
                            </div>
                        </li>
                        <li className="flex gap-4">
                            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-2 shrink-0" />
                            <div>
                                <strong className="text-white block mb-1">Monotonic Reporting</strong>
                                <span className="text-neutral-400">Billing totals for a period never decrease. If a negative adjustment is required, an automated credit memo is issued by the finance workflow.</span>
                            </div>
                        </li>
                    </ul>
                </section>

                {/* 2. Dispute Resolution */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-neutral-400" />
                        Invoice Reconciliation & Disputes
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-4">
                        Haul Command runs a background reconciliation cron job every 6 hours. This job compares open Stripe invoices against the aggregate totals recorded in our system.
                    </p>
                    <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-5">
                        <p className="text-neutral-300 mb-0">
                            If a mismatch exceeds the materiality threshold (e.g., &gt; 5,000 API calls difference), an <strong>Enterprise Incident</strong> is raised internally with severity <i>High</i>. Our engineering team resolves discrepancies before the payment method is charged.
                        </p>
                    </div>
                </section>

                {/* 3. API Ledger Access */}
                <section>
                    <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
                        <CreditCard className="w-6 h-6 text-neutral-400" />
                        Accessing the Ledger
                    </h2>
                    <p className="text-neutral-300 leading-relaxed mb-4">
                        You can programmatically verify your usage via the Ledger endpoint:
                    </p>
                    <div className="bg-neutral-950 rounded-lg p-4 border border-neutral-800 overflow-x-auto">
                        <code className="text-sm font-mono text-amber-500">
                            GET /api/enterprise/billing/usage/ledger
                        </code>
                    </div>
                    <p className="text-sm text-neutral-500 mt-3 flex justify-between">
                        <span>Returns daily rollup hashes and batched quantities.</span>
                        <Link aria-label="Navigation Link" href="/developers/authentication" className="text-amber-500 hover:text-amber-400 underline decoration-amber-500/30 underline-offset-4">Read about Auth headers</Link>
                    </p>
                </section>
            </div>

            <div className="mt-16 pt-8 border-t border-neutral-800">
                <p className="text-sm text-neutral-500 text-center">
                    Haul Command Tier 4 Enterprise Billable Component.
                </p>
            </div>
        </div>
    );
}