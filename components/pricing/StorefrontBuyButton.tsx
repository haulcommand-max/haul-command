"use client";

import { useState } from "react";

import { createClient } from "@/utils/supabase/client";
import type { StorefrontBillingInterval, StorefrontProduct } from "@/lib/storefront/pricing";

type StorefrontBuyButtonProps = {
  product: Pick<
    StorefrontProduct,
    | "product_code"
    | "name"
    | "stripe_payment_link_monthly_url"
    | "stripe_payment_link_annual_url"
    | "stripe_payment_link_one_time_url"
  >;
  countryCode: string;
  interval: StorefrontBillingInterval;
  className?: string;
};

type ResolvePaymentLinkResult = {
  ok?: boolean;
  ppp_tier?: string | null;
  localized?: boolean | null;
  payment_link?: string | null;
  amount_cents?: number | null;
  currency?: string | null;
};

function readStoredAttribution() {
  if (typeof window === "undefined") return null;
  const cookieMatch = document.cookie
    .split("; ")
    .find((part) => part.startsWith("hc_attribution="));
  if (!cookieMatch) return null;

  try {
    return JSON.parse(decodeURIComponent(cookieMatch.split("=").slice(1).join("=")));
  } catch {
    return null;
  }
}

function getDirectPaymentLink(product: StorefrontBuyButtonProps["product"], interval: StorefrontBillingInterval) {
  if (interval === "year") return product.stripe_payment_link_annual_url;
  if (interval === "one_time") return product.stripe_payment_link_one_time_url;
  return product.stripe_payment_link_monthly_url;
}

export function StorefrontBuyButton({
  product,
  countryCode,
  interval,
  className,
}: StorefrontBuyButtonProps) {
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");

  async function handleBuy() {
    setState("loading");
    try {
      const supabase = createClient() as any;
      const { data, error } = await supabase.rpc("hc_resolve_payment_link", {
        p_product_code: product.product_code,
        p_country_code: countryCode,
        p_interval: interval,
      });

      if (error) throw error;
      const resolved = Array.isArray(data) ? data[0] : data as ResolvePaymentLinkResult | null;
      const directPaymentLink = resolved?.payment_link || getDirectPaymentLink(product, interval);

      if (directPaymentLink) {
        window.location.assign(directPaymentLink);
        return;
      }

      const checkout = await fetch("/api/checkout/create-session", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          product_code: product.product_code,
          billing_interval: interval,
          attribution: readStoredAttribution() ?? {
            source: "direct",
            landing_path: window.location.pathname,
            referrer: document.referrer || null,
          },
        }),
      });

      const payload = await checkout.json().catch(() => null);
      if (!checkout.ok || !payload?.url) {
        throw new Error(payload?.error || "Checkout session unavailable");
      }

      window.location.assign(payload.url);
    } catch (error) {
      console.error("[pricing] checkout failed", error);
      setState("error");
    }
  }

  return (
    <button
      type="button"
      onClick={handleBuy}
      disabled={state === "loading"}
      className={className ?? "inline-flex items-center justify-center rounded-lg bg-[#d4950e] px-4 py-2 text-sm font-black text-[#0B0F14] transition hover:bg-[#F1A91B] disabled:cursor-wait disabled:opacity-70"}
      aria-label={`Buy ${product.name}`}
    >
      {state === "loading" ? "Resolving..." : state === "error" ? "Try again" : "Buy"}
    </button>
  );
}
