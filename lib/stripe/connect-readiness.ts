import type Stripe from "stripe";
import { getSupabaseAdmin } from "@/lib/supabase/admin";
import { getStripeClient } from "@/lib/stripe/client";

type ConnectSource = "hc_stripe_accounts" | "profiles_legacy";

export type PayoutReadyConnectAccount =
  | {
      ok: true;
      accountId: string;
      source: ConnectSource;
      chargesEnabled: boolean;
      payoutsEnabled: boolean;
      detailsSubmitted: boolean;
    }
  | {
      ok: false;
      status: number;
      error: string;
      action: "connect_onboarding" | "connect_requirements";
      redirect: string;
      accountId?: string;
      requirementsDue?: string[];
      disabledReason?: string | null;
    };

function blockingRequirements(account: Stripe.Account): string[] {
  return [
    ...(account.requirements?.currently_due ?? []),
    ...(account.requirements?.past_due ?? []),
  ];
}

async function syncCanonicalConnectState(userId: string, account: Stripe.Account) {
  const admin = getSupabaseAdmin();
  const due = blockingRequirements(account);
  const status =
    account.charges_enabled && account.payouts_enabled && due.length === 0
      ? "active"
      : "restricted";

  await admin
    .from("hc_stripe_accounts")
    .update({
      charges_enabled: account.charges_enabled,
      payouts_enabled: account.payouts_enabled,
      details_submitted: account.details_submitted,
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("stripe_account_id", account.id);
}

export async function resolvePayoutReadyConnectAccount(
  userId: string,
): Promise<PayoutReadyConnectAccount> {
  const admin = getSupabaseAdmin();

  const { data: canonical } = await admin
    .from("hc_stripe_accounts")
    .select("stripe_account_id,charges_enabled,payouts_enabled,details_submitted,status,updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  let source: ConnectSource = "hc_stripe_accounts";
  let accountId = canonical?.stripe_account_id as string | undefined;

  if (!accountId) {
    const { data: legacyProfile } = await admin
      .from("profiles")
      .select("stripe_connect_account_id")
      .eq("id", userId)
      .maybeSingle();

    accountId = legacyProfile?.stripe_connect_account_id as string | undefined;
    source = "profiles_legacy";
  }

  if (!accountId) {
    return {
      ok: false,
      status: 400,
      error: "No payout account. Complete Stripe Connect onboarding first.",
      action: "connect_onboarding",
      redirect: "/operator/connect-stripe",
    };
  }

  const liveAccount = await getStripeClient().accounts.retrieve(accountId);
  await syncCanonicalConnectState(userId, liveAccount);

  const due = blockingRequirements(liveAccount);
  const disabledReason = liveAccount.requirements?.disabled_reason ?? null;
  if (!liveAccount.charges_enabled || !liveAccount.payouts_enabled || due.length > 0 || disabledReason) {
    return {
      ok: false,
      status: 403,
      error: "Stripe Connect account is not payout-ready. Complete outstanding onboarding requirements.",
      action: "connect_requirements",
      redirect: "/operator/connect-stripe",
      accountId,
      requirementsDue: due,
      disabledReason,
    };
  }

  return {
    ok: true,
    accountId,
    source,
    chargesEnabled: liveAccount.charges_enabled,
    payoutsEnabled: liveAccount.payouts_enabled,
    detailsSubmitted: liveAccount.details_submitted,
  };
}
