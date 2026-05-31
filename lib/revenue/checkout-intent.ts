import { getSupabaseAdmin } from "@/lib/supabase/admin";

type CheckoutIntentInput = {
  userId?: string | null;
  userEmail?: string | null;
  buyerRole?: string | null;
  productKind: string;
  productKey: string;
  priceCents: number;
  currency?: string | null;
  countryCode?: string | null;
  targetCorridorKey?: string | null;
  targetLoadId?: string | null;
  stripeSessionId?: string | null;
  stripeCustomerId?: string | null;
  sourcePath?: string | null;
  recommendation?: string | null;
  meta?: Record<string, unknown>;
};

type CheckoutIntentResult = {
  ok: boolean;
  checkoutIntentId?: string;
  crmOpportunityId?: string;
  abandonedCheckoutRecorded: boolean;
  errors: string[];
};

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const asUuidOrNull = (value?: string | null) => {
  if (!value) return null;
  return UUID_RE.test(value) ? value : null;
};

const rowId = (row: unknown) => (row && typeof row === "object" && "id" in row ? String(row.id) : undefined);

export async function recordCheckoutIntent(input: CheckoutIntentInput): Promise<CheckoutIntentResult> {
  const errors: string[] = [];
  const admin = getSupabaseAdmin();
  const currency = (input.currency || "usd").toLowerCase();
  const priceCents = Math.max(0, Math.round(input.priceCents));
  const userId = asUuidOrNull(input.userId);
  const targetLoadId = asUuidOrNull(input.targetLoadId);
  const stripeSessionId = input.stripeSessionId || `intake_${crypto.randomUUID()}`;
  const meta = {
    source_path: input.sourcePath || null,
    stripe_session_available: Boolean(input.stripeSessionId),
    revenue_recorded: false,
    ...(input.meta || {}),
  };

  const { data: intent, error: intentError } = await admin
    .from("hc_checkout_intents" as never)
    .insert({
      user_id: userId,
      user_email: input.userEmail || null,
      buyer_role: input.buyerRole || null,
      product_kind: input.productKind,
      product_key: input.productKey,
      target_load_id: targetLoadId,
      target_corridor_key: input.targetCorridorKey || null,
      price_cents: priceCents,
      currency,
      country_code: input.countryCode?.toUpperCase() || null,
      stripe_session_id: stripeSessionId,
      status: input.stripeSessionId ? "stripe_session_created" : "created",
      meta,
    } as never)
    .select("id")
    .single();

  const checkoutIntentId = rowId(intent);
  if (intentError || !checkoutIntentId) {
    errors.push(intentError?.message || "checkout intent insert failed");
  }

  let abandonedCheckoutRecorded = false;
  const { error: abandonedError } = await admin
    .from("hc_abandoned_checkouts" as never)
    .insert({
      stripe_session_id: stripeSessionId,
      stripe_customer_id: input.stripeCustomerId || null,
      email: input.userEmail || null,
      user_id: userId,
      product_code: input.productKey,
      amount_cents: priceCents,
      currency: currency.toUpperCase(),
      status: "abandoned",
    } as never);

  if (abandonedError) {
    errors.push(abandonedError.message);
  } else {
    abandonedCheckoutRecorded = true;
  }

  let crmOpportunityId: string | undefined;
  const { data: crm, error: crmError } = await admin
    .from("hc_crm_market_opportunities" as never)
    .insert({
      opportunity_type: "checkout_intent",
      role_family: input.buyerRole || "buyer",
      country_code: input.countryCode?.toUpperCase() || null,
      corridor_slug: input.targetCorridorKey || null,
      recommendation:
        input.recommendation ||
        `Follow up on ${input.productKind} checkout intent for ${input.productKey}.`,
      evidence: {
        checkout_intent_id: checkoutIntentId || null,
        product_kind: input.productKind,
        product_key: input.productKey,
        price_cents: priceCents,
        currency,
        stripe_session_id: stripeSessionId,
        source_path: input.sourcePath || null,
        revenue_recorded: false,
      },
      estimated_value_score: Math.min(100, Math.max(50, Math.round(priceCents / 100))),
      adgrid_inventory_flag: input.productKind.includes("sponsor") || input.productKind.includes("adgrid"),
      data_product_signal_flag: input.productKind.includes("data"),
      status: "open",
    } as never)
    .select("id")
    .single();

  if (crmError) {
    errors.push(crmError.message);
  } else {
    crmOpportunityId = rowId(crm);
  }

  return {
    ok: errors.length === 0,
    checkoutIntentId,
    crmOpportunityId,
    abandonedCheckoutRecorded,
    errors,
  };
}
