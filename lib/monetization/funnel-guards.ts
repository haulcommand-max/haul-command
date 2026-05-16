export type GuardFailure = {
  ok: false;
  status: number;
  error: string;
};

export type GuardSuccess<T extends Record<string, unknown> = Record<string, never>> = {
  ok: true;
} & T;

export type GuardResult<T extends Record<string, unknown> = Record<string, never>> = GuardSuccess<T> | GuardFailure;

const STRIPE_CHECKOUT_SESSION_RE = /^cs_(test|live)_[A-Za-z0-9_]+$/;

export function resolveAuthenticatedActor(input: {
  authUserId?: string | null;
  submittedUserId?: string | null;
}): GuardResult<{ userId: string }> {
  if (!input.authUserId) {
    return { ok: false, status: 401, error: "Authentication required." };
  }

  if (input.submittedUserId && input.submittedUserId !== input.authUserId) {
    return { ok: false, status: 403, error: "Submitted user_id does not match the authenticated user." };
  }

  return { ok: true, userId: input.authUserId };
}

export function isStripeCheckoutSessionId(value?: string | null): value is string {
  return typeof value === "string" && STRIPE_CHECKOUT_SESSION_RE.test(value);
}

export function validateDataProductFulfillment(input: {
  stripeSessionId?: string | null;
  priceUsd: number;
}): GuardResult {
  if (input.priceUsd <= 0) return { ok: true };
  if (!isStripeCheckoutSessionId(input.stripeSessionId)) {
    return {
      ok: false,
      status: 402,
      error: "Paid data products activate only after Stripe checkout.session.completed fulfillment.",
    };
  }
  return { ok: true };
}

const SPONSOR_OFFERS = {
  territory: {
    productKey: "territory_sponsor_monthly",
    priceMonthly: 299,
    mode: "subscription",
    label: "Territory Sponsor",
  },
  corridor: {
    productKey: "corridor_sponsor_monthly",
    priceMonthly: 199,
    mode: "subscription",
    label: "Corridor Sponsor",
  },
  port: {
    productKey: "port_sponsor_monthly",
    priceMonthly: 499,
    mode: "subscription",
    label: "Port Sponsor",
  },
  country: {
    productKey: "country_sponsor_monthly",
    priceMonthly: 499,
    mode: "subscription",
    label: "Country Sponsor",
  },
  empty_market: {
    productKey: "empty_market_sponsor_monthly",
    priceMonthly: 149,
    mode: "subscription",
    label: "Empty Market Sponsor",
  },
  regulation: {
    productKey: "regulation_sponsor_monthly",
    priceMonthly: 199,
    mode: "subscription",
    label: "Regulation Page Sponsor",
  },
  tool: {
    productKey: "tool_sponsor_monthly",
    priceMonthly: 199,
    mode: "subscription",
    label: "Tool Sponsor",
  },
  glossary: {
    productKey: "glossary_sponsor_monthly",
    priceMonthly: 149,
    mode: "subscription",
    label: "Glossary Sponsor",
  },
  blog: {
    productKey: "content_sponsor_monthly",
    priceMonthly: 149,
    mode: "subscription",
    label: "Content Sponsor",
  },
} as const;

export type SponsorZone = keyof typeof SPONSOR_OFFERS;

export function resolveSponsorCheckoutOffer(input: {
  zone?: string | null;
  geo?: string | null;
  label?: string | null;
  requestedPriceMonthly?: number | null;
}): GuardResult<{
  zone: SponsorZone;
  geo: string;
  label: string;
  productKey: string;
  priceMonthly: number;
  mode: "subscription";
  ignoredClientPrice: boolean;
}> {
  const zone = input.zone as SponsorZone | undefined;
  if (!zone || !(zone in SPONSOR_OFFERS)) {
    return { ok: false, status: 400, error: "Invalid sponsor zone." };
  }

  const geo = input.geo?.trim();
  if (!geo) return { ok: false, status: 400, error: "Sponsor geo is required." };

  const offer = SPONSOR_OFFERS[zone];
  const label = input.label?.trim() || `${offer.label}: ${geo}`;
  return {
    ok: true,
    zone,
    geo,
    label,
    productKey: offer.productKey,
    priceMonthly: offer.priceMonthly,
    mode: offer.mode,
    ignoredClientPrice: input.requestedPriceMonthly !== undefined && input.requestedPriceMonthly !== offer.priceMonthly,
  };
}

export type ProofStripItem = { stat: string; label: string; color: string; symbol: string };

export function getProofStripItems(input: {
  operatorCount?: number | null;
  verifiedOperatorCount?: number | null;
  activeCountryCount?: number | null;
  indexedCountryCount?: number | null;
  escrowEnabled?: boolean;
}): ProofStripItem[] {
  const items: ProofStripItem[] = [];
  const verifiedOperatorCount = Number(input.verifiedOperatorCount ?? 0);
  if (verifiedOperatorCount > 0) {
    items.push({ symbol: "OK", stat: verifiedOperatorCount.toLocaleString(), label: "verified operators", color: "#22C55E" });
  } else if (input.operatorCount && input.operatorCount > 0) {
    items.push({ symbol: "DIR", stat: input.operatorCount.toLocaleString(), label: "directory profiles", color: "#22C55E" });
  }

  const activeCountryCount = Number(input.activeCountryCount ?? 0);
  if (activeCountryCount > 0) {
    items.push({ symbol: "GEO", stat: String(activeCountryCount), label: "countries active", color: "#3B82F6" });
  } else {
    items.push({ symbol: "GEO", stat: String(input.indexedCountryCount ?? 120), label: "countries indexed", color: "#3B82F6" });
  }

  items.push({
    symbol: "PAY",
    stat: input.escrowEnabled ? "Escrow" : "Stripe",
    label: input.escrowEnabled ? "protected payments" : "checkout-secured purchases",
    color: "#8B5CF6",
  });

  return items;
}

export function buildLoadPreviewState(input: { liveCount: number; usingFallbackRows: boolean }) {
  if (input.usingFallbackRows) {
    return {
      isSample: true,
      badge: "Sample Load Board",
      headline: "Sample Loads - Real Board Opens After Verified Posts",
      subhead: "Example cards show the workflow. Verified, paid posts appear here when available.",
    };
  }

  return {
    isSample: false,
    badge: "Live Load Board",
    headline: `${input.liveCount} Loads Available Now`,
    subhead: "Sign in to view full details, accept jobs, and set availability.",
  };
}
