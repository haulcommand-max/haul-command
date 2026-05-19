"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

export default function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [checkoutError, setCheckoutError] = useState<string | null>(null);

    const surfaceId = searchParams.get("surface_id");
    const plan = searchParams.get("plan");

    useEffect(() => {
        if (!surfaceId || !plan) {
            router.push("/directory");
            return;
        }

        if (plan === "premium") {
            // Hit the unified checkout session endpoint
            fetch("/api/checkout/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    product_key: "directory_featured",
                    custom_amount_cents: 9900,
                    custom_label: "Premium Business Profile Request",
                    custom_mode: "subscription",
                    success_path: `/onboarding/claim/success?surface_id=${surfaceId}&plan=premium`,
                    cancel_path: `/onboarding/claim?surface_id=${surfaceId}`,
                }),
            })
            .then(r => r.json())
            .then(data => {
                if (data.checkout_url) {
                    window.location.href = data.checkout_url;
                } else {
                    setCheckoutError("Stripe Checkout did not return a payment URL. Your premium profile was not activated.");
                }
            })
            .catch(() => {
                setCheckoutError("We could not reach the payment processor. Your premium profile was not activated.");
            });
        } else {
            router.push(`/onboarding/claim/success?surface_id=${surfaceId}&plan=free`);
        }
    }, [surfaceId, plan, router]);

    if (checkoutError) {
        return (
            <div className=" bg-hc-bg flex items-center justify-center text-hc-text font-sans">
                <div className="max-w-md rounded-2xl border border-red-500/20 bg-red-500/5 p-6 text-center">
                    <h1 className="text-xl font-black">Payment Not Started</h1>
                    <p className="mt-3 text-sm text-gray-400">{checkoutError}</p>
                    <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
                        <Link href={`/onboarding/claim?surface_id=${surfaceId ?? ""}`} className="rounded-xl border border-white/10 px-4 py-3 text-sm font-bold text-white hover:border-white/25">
                            Return to Claim
                        </Link>
                        <Link href="/plans" className="rounded-xl bg-[#C6923A] px-4 py-3 text-sm font-bold text-black">
                            View Plans
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className=" bg-hc-bg flex items-center justify-center text-hc-text font-sans">
            <div className="text-center space-y-4">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full border border-[#C6923A]/30">
                    <span className="animate-spin w-5 h-5 border-2 border-t-[#C6923A] border-r-transparent border-b-transparent border-l-transparent rounded-full" />
                </div>
                <h1 className="text-xl font-black">Securing Payment Gateway</h1>
                <p className="text-gray-400 text-sm">Redirecting you to Stripe Checkout...</p>
            </div>
        </div>
    );
}
