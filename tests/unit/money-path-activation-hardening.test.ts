import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("money path activation hardening", () => {
  it("requires Stripe Connect live readiness before HC Pay or QuickPay payouts", () => {
    const helper = read("lib/stripe/connect-readiness.ts");
    const hcPay = read("app/api/hc-pay/payout/route.ts");
    const quickPay = read("app/api/payments/quickpay/route.ts");

    expect(helper).toContain('.from("hc_stripe_accounts")');
    expect(helper).toContain('.from("profiles")');
    expect(helper).toContain('"profiles_legacy"');
    expect(helper).toContain("accounts.retrieve(accountId)");
    expect(helper).toContain("charges_enabled");
    expect(helper).toContain("payouts_enabled");
    expect(helper).toContain("currently_due");
    expect(helper).toContain("past_due");

    for (const route of [hcPay, quickPay]) {
      expect(route).toContain("resolvePayoutReadyConnectAccount(user.id)");
      expect(route).toContain("getStripeCheckoutBlockReason");
      expect(route).toContain("isEmailConfirmed(user)");
      expect(route).toContain("connectAccount.accountId");
      expect(route).not.toContain("destination: profile.stripe_connect_account_id");
    }

    expect(quickPay).toContain("status: 'pending_transfer'");
    expect(quickPay).toContain("quickpay_transaction_id: pendingTxn.id");
    expect(quickPay).toContain(".eq('id', pendingTxn.id)");

    expect(hcPay).toContain("status: 'pending_transfer'");
    expect(hcPay).toContain("entryType: 'payout_reversal'");
    expect(hcPay).toContain("Payout transfer failed. Wallet debit was reversed.");
    expect(hcPay).toContain("payout_id: payout.id");
  });

  it("disables legacy QuickPay mutation endpoints in favor of canonical QuickPay", () => {
    const legacyQuickPay = read("app/api/quickpay/route.ts");
    const legacyAdvance = read("app/api/quickpay/advance/route.ts");

    for (const route of [legacyQuickPay, legacyAdvance]) {
      expect(route).toContain("replacement: '/api/payments/quickpay'");
      expect(route).toContain("{ status: 410 }");
    }

    expect(legacyQuickPay).not.toContain("invoice_amount * feePercentage");
    expect(legacyAdvance).not.toContain("status: 'advanced'");
  });

  it("puts the enterprise RouteIntel API behind the canonical hashed key gate", () => {
    const route = read("app/api/enterprise/v1/route-intelligence/route.ts");

    expect(route).toContain("enterpriseGate(req, 'operations_optimizer')");
    expect(route).not.toContain("startsWith('Bearer hc_ent_')");
    expect(route).not.toContain("Mock auth");
  });

  it("does not activate profile boosts before Stripe confirms payment", () => {
    const route = read("app/api/boost/purchase/route.ts");

    expect(route).toContain("status: 'pending_payment'");
    expect(route).toContain("boost_checkout_started");
    expect(route).toContain("activates after Stripe confirms payment");
    expect(route).not.toContain("boost activated");
    expect(route).not.toContain("boost_purchased");
  });

  it("keeps claim and verification identity server-owned", () => {
    const claimPage = read("app/claim/page.tsx");
    const operatorTrustCard = read("components/directory/OperatorTrustCard.tsx");
    const verificationStatus = read("app/api/v1/verification/status/route.ts");

    expect(claimPage).toContain("intent=claim");
    expect(claimPage).not.toContain('name="user_id"');
    expect(operatorTrustCard).toContain("/claim?operator=");
    expect(operatorTrustCard).not.toContain("/claim/${id}");
    expect(verificationStatus).toContain("supabase.auth.getUser()");
    expect(verificationStatus).toContain("userId !== user.id");
    expect(verificationStatus).toContain("app_metadata");
  });
});
