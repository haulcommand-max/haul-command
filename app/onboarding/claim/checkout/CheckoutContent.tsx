"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function CheckoutContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

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
                    router.push(`/onboarding/claim/success?surface_id=${surfaceId}&plan=premium&error=stripe_unreachable`);
                }
            })
            .catch(() => {
                router.push(`/onboarding/claim/success?surface_id=${surfaceId}&plan=premium&error=network`);
            });
        } else {
            router.push(`/onboarding/claim/success?surface_id=${surfaceId}&plan=free`);
        }
    }, [surfaceId, plan, router]);

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
