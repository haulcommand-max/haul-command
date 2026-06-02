import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();

function read(path: string) {
  return readFileSync(join(root, path), "utf8");
}

describe("matching money spine contracts", () => {
  it("preauthorizes against canonical hc_jobs instead of treating a load id as a job id", () => {
    const route = read("app/api/loads/create/route.ts");

    expect(route).toContain("hc_jobs");
    expect(route).toContain("job_id: hcJob.id");
    expect(route).not.toContain("job_id: load.id");
    expect(route).toContain("instant_match");
    expect(route).toContain("match-generate");
  });

  it("routes the broker load page through the server money gate", () => {
    const page = read("app/(broker)/loads/new/page.tsx");

    expect(page).toContain("fetch('/api/loads/create'");
    expect(page).not.toContain('supabase.functions.invoke("payments-preauth"');
    expect(page).toContain("instant_match: instantMatch");
  });

  it("hardens matching and payment edge functions with real auth or internal invocation checks", () => {
    const preauth = read("supabase/functions/payments-preauth/index.ts");
    const capture = read("supabase/functions/payments-capture/index.ts");
    const matchGenerate = read("supabase/functions/match-generate/index.ts");

    expect(preauth).toContain("auth.getUser()");
    expect(preauth).toContain("getJobOwner");
    expect(preauth).toContain("isDemoPaymentsAllowed");
    expect(preauth).not.toContain("broker_user_id } = await req.json()");

    expect(capture).toContain("auth.getUser()");
    expect(capture).toContain("MATCHING_INTERNAL_SECRET");
    expect(capture).toContain('preauth_status !== "authorized"');
    expect(capture).toContain('!["admin", "finance"].includes');
    expect(capture).toContain("Job completion/proof readiness is required before capture");
    expect(capture).toContain("markRevenueCaptured");
    expect(capture).not.toContain("Date.now()");
    expect(capture).not.toContain('update({ preauth_status: "failed" })');

    expect(matchGenerate).toContain("auth.getUser()");
    expect(matchGenerate).toContain("MATCHING_INTERNAL_SECRET");
    expect(matchGenerate).toContain("Canonical job_id is required before dispatch");
    expect(matchGenerate).toContain("Force dispatch requires internal authorization");
    expect(matchGenerate).toContain("load.broker_id !== user.id");
    expect(matchGenerate).toContain("Payment authorization required before dispatch");
    expect(matchGenerate).toContain("hc_job_id: canonicalJobId");
    expect(matchGenerate).toContain("buildDispatchDecision");
    expect(matchGenerate).toContain("dispatch_confidence");
    expect(matchGenerate).toContain("multi_role_slots");
    expect(matchGenerate).toContain("p_ingest_source: 'system'");
  });

  it("locks the legacy public offer accept route behind authenticated ownership", () => {
    const route = read("app/api/offers/[offerId]/accept/route.ts");

    expect(route).toContain("auth.getUser()");
    expect(route).toContain("driver_id");
    expect(route).toContain("offer.driver_id !== user.id");
    expect(route).toContain("responded_at");
    expect(route).toContain("rpc_accept_match_offer_to_hc_job");
    expect(route).toContain("legacy_offers_accept_bridge");
    expect(route).not.toContain("accepted_at");
  });

  it("retires unauthenticated match preview and bridges UI dispatch through canonical job ids", () => {
    const previewRoute = read("app/api/loads/match-generate/route.ts");
    const legacyMarketplaceMatch = read("app/api/v1/marketplace/match/route.ts");
    const dispatchRoute = read("app/api/loads/dispatch/route.ts");
    const mobilePostPage = read("app/(app)/loads/post/page.tsx");

    expect(previewRoute).toContain("Legacy match preview is retired");
    expect(previewRoute).toContain("canonical_required");
    expect(previewRoute).not.toContain("getSupabaseAdmin");
    expect(previewRoute).not.toContain("hc_global_operators");
    expect(previewRoute).not.toContain("trust_scores");

    expect(legacyMarketplaceMatch).toContain("Legacy marketplace match is retired");
    expect(legacyMarketplaceMatch).toContain("payment_authorized_job_required");
    expect(legacyMarketplaceMatch).toContain('canonical_route: "/api/loads/create"');
    expect(legacyMarketplaceMatch).toContain('dispatch_route: "/api/loads/dispatch"');
    expect(legacyMarketplaceMatch).toContain("status: 410");
    expect(legacyMarketplaceMatch).not.toContain("getSupabaseAdmin");
    expect(legacyMarketplaceMatch).not.toContain("runMatchPipeline");
    expect(legacyMarketplaceMatch).not.toContain("load_requests");
    expect(legacyMarketplaceMatch).not.toContain("computePremiumFees");

    expect(dispatchRoute).toContain("load_id and canonical job_id are required");
    expect(dispatchRoute).toContain("/functions/v1/match-generate");
    expect(dispatchRoute).toContain("MATCHING_INTERNAL_SECRET");
    expect(dispatchRoute).not.toContain("hc_corridor_dispatch");

    expect(mobilePostPage).toContain("fetch('/api/loads/create'");
    expect(mobilePostPage).toContain("Canonical dispatch gate");
    expect(mobilePostPage).toContain("job_id: hcJobId");
    expect(mobilePostPage).toContain("fetch('/api/loads/dispatch'");
    expect(mobilePostPage).not.toContain("supabase.from('loads').insert");
    expect(mobilePostPage).not.toContain("/api/loads/match-generate");
  });

  it("keeps compatibility offer acceptance on canonical match_offers and blocks old job creation", () => {
    const bodyOfferAccept = read("app/api/offers/accept/route.ts");
    const marketplaceRespond = read("app/api/v1/marketplace/offers/[offerId]/respond/route.ts");
    const inboxPage = read("app/offers/inbox/page.tsx");
    const offersPage = read("app/offers/page.tsx");
    const notifications = read("lib/marketplace/notifications.ts");

    expect(bodyOfferAccept).toContain("auth.getUser()");
    expect(bodyOfferAccept).toContain("match_offers");
    expect(bodyOfferAccept).toContain("rpc_accept_match_offer_to_hc_job");
    expect(bodyOfferAccept).not.toContain('.from("jobs")');
    expect(bodyOfferAccept).not.toContain('.from("loads").update({ status: "filled"');

    expect(marketplaceRespond).toContain("auth.getUser()");
    expect(marketplaceRespond).toContain("match_offers");
    expect(marketplaceRespond).toContain("rpc_accept_match_offer_to_hc_job");
    expect(marketplaceRespond).toContain("Legacy marketplace offer acceptance is retired");
    expect(marketplaceRespond).not.toContain("createBooking");
    expect(marketplaceRespond).not.toContain('.from("jobs")');

    expect(inboxPage).toContain(".from('match_offers')");
    expect(inboxPage).toContain("offer-decline");
    expect(inboxPage).not.toContain(".from('offers')");

    expect(offersPage).toContain('redirect("/offers/inbox")');
    expect(offersPage).not.toContain("OffersClient");
    expect(notifications).toContain("/offers/inbox?offer=");
    expect(notifications).toContain("/offers/inbox?request=");
    expect(notifications).not.toContain("/offers/${notif.offer_id}");
  });

  it("retires legacy offer expiry cascade so it cannot create old offers", () => {
    const expireRoute = read("app/api/v1/marketplace/offers/expire/route.ts");

    expect(expireRoute).toContain("Legacy marketplace offer expiry is retired");
    expect(expireRoute).toContain("canonical_match_offers_required");
    expect(expireRoute).toContain('canonical_table: "match_offers"');
    expect(expireRoute).toContain('canonical_inbox: "/offers/inbox"');
    expect(expireRoute).toContain("status: 410");
    expect(expireRoute).not.toContain("getSupabaseAdmin");
    expect(expireRoute).not.toContain("runMatchPipeline");
    expect(expireRoute).not.toContain("cascadeFallback");
    expect(expireRoute).not.toContain("rankCandidates");
    expect(expireRoute).not.toContain("determineOfferStrategy");
    expect(expireRoute).not.toContain("load_requests");
    expect(expireRoute).not.toContain("match_runs");
    expect(expireRoute).not.toContain('.from("offers")');
  });

  it("blocks unpaid emergency and broadcast dispatch paths behind the canonical spine", () => {
    const loadPostCompat = read("app/api/loads/route.ts");
    const autoDispatch = read("app/api/dispatch/auto/route.ts");
    const broadcastDispatch = read("app/api/dispatch/broadcast/route.ts");
    const emergencyFill = read("app/api/emergency-fill/route.ts");

    expect(loadPostCompat).toContain("/api/loads/create");
    expect(loadPostCompat).toContain("canonical_route: '/api/loads/create'");
    expect(loadPostCompat).not.toContain(".from('loads').insert");

    expect(autoDispatch).toContain("/api/loads/dispatch");
    expect(autoDispatch).toContain("canonical_required");
    expect(autoDispatch).not.toContain("trySendBulkNotification");
    expect(autoDispatch).not.toContain("dispatch_requests");
    expect(autoDispatch).not.toContain("complianceMatch = true");
    expect(broadcastDispatch).toContain("/api/loads/dispatch");
    expect(broadcastDispatch).toContain("canonical_required");
    expect(broadcastDispatch).not.toContain("sendRoutedNotification");
    expect(broadcastDispatch).not.toContain("findDispatchCandidates");
    expect(broadcastDispatch).not.toContain("hc_notification_events");

    expect(emergencyFill).toContain("requires_checkout");
    expect(emergencyFill).toContain("MATCHING_INTERNAL_SECRET");
    expect(emergencyFill).toContain("getSupabaseAdmin");

  });

  it("ships an atomic match-offer to hc_jobs bridge migration", () => {
    const migration = read("supabase/migrations/20260509234500_matching_canonical_money_spine.sql");

    expect(migration).toContain("rpc_accept_match_offer_to_hc_job");
    expect(migration).toContain("public.match_offers");
    expect(migration).toContain("public.hc_jobs");
    expect(migration).toContain("public.hc_pay_revenue");
    expect(migration).toContain("public.hc_supply_gap_bounties");
    expect(migration).toContain("hc_job_id");
    expect(migration).toContain("recognition_status");
    expect(migration).toContain("pending_capture");
    expect(migration).toContain("match_offers_one_open_per_load_escort_wave_uidx");
    expect(migration).toContain("alter table public.match_offers enable row level security");
    expect(migration).not.toContain("country_code_iso2");
    expect(migration).not.toContain("'pending_payment',\n      v_rate");
  });

  it("keeps offer acceptance on the canonical RPC path only", () => {
    const offerAccept = read("supabase/functions/offer-accept/index.ts");

    expect(offerAccept).toContain("rpc_accept_match_offer_to_hc_job");
    expect(offerAccept).toContain("p_actor_type");
    expect(offerAccept).toContain("p_job_id");
    expect(offerAccept).toContain('p_ingest_source: "system"');
    expect(offerAccept).not.toContain("pg_try_advisory_xact_lock");
    expect(offerAccept).not.toContain("Load already matched by another escort");
  });

  it("blocks job completion unless the actor owns the job and payment is captured", () => {
    const completionRoute = read("app/api/v1/marketplace/jobs/[jobId]/complete/route.ts");
    const bookingPayment = read("lib/marketplace/booking-payment.ts");

    expect(completionRoute).toContain("createClient");
    expect(completionRoute).toContain("requireInternalRequest");
    expect(completionRoute).toContain("body.completed_by === 'system'");
    expect(completionRoute).toContain("jobData.broker_id === user.id");
    expect(completionRoute).toContain("escorts.includes(user.id)");
    expect(completionRoute).toContain("Payment capture failed; job completion is blocked");
    expect(completionRoute).toContain("Payment must be captured before job completion");
    expect(completionRoute).toContain("{ status: 402 }");
    expect(completionRoute).not.toContain("Don't block completion");

    expect(bookingPayment).toContain("Dispatch/completion gates must block until retry succeeds");
    expect(bookingPayment).not.toContain("Still let the job proceed");
  });

  it("hands Stripe authorization back into the dispatch spine instead of leaving instant match stuck", () => {
    const webhook = read("supabase/functions/hc_webhook_stripe/index.ts");
    const config = read("supabase/config.toml");

    expect(webhook).toContain("openLoadAndTriggerMatching");
    expect(webhook).toContain("Checkout creation must be called through an authenticated server route");
    expect(webhook).toContain("payment_intent.amount_capturable_updated");
    expect(webhook).toContain(".from('loads')");
    expect(webhook).toContain("status: 'open'");
    expect(webhook).toContain("/functions/v1/match-generate");
    expect(webhook).toContain("'x-internal-token'");
    expect(webhook).toContain("status: 'processing'");
    expect(webhook).toContain("status: 'done'");
    expect(webhook).toContain("matching.dispatch_triggered");
    expect(webhook).not.toContain("status: 'PROCESSING'");
    expect(webhook).not.toContain("status: 'DONE'");
    expect(config).toContain("[functions.hc_webhook_stripe]");
    expect(config).toContain("verify_jwt = false");
  });

  it("uses the same platform-fee estimate in fallback capture and acceptance revenue", () => {
    const capture = read("supabase/functions/payments-capture/index.ts");
    const migration = read("supabase/migrations/20260509234500_matching_canonical_money_spine.sql");

    expect(capture).toContain("* 0.08");
    expect(migration).toContain("v_rate * 0.08");
    expect(capture).not.toContain("* 0.12");
  });
});
