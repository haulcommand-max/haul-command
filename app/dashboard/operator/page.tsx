export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { OperatorDashboardClient } from "./OperatorDashboardClient";
import { redirect } from "next/navigation";

// ═══════════════════════════════════════════════════════════════
// /dashboard/operator — Server Component
//
// Fetches real session auth + operator profile from DB.
// Passes typed data to OperatorDashboardClient — NO mocks.
//
// Data fetched here:
//   1. Authenticated user (guard — redirect to /login if none)
//   2. Operator profile from hc_global_operators (via user_id)
//   3. Active jobs from hc_jobs (status: active | pending)
//   4. Pending/recent earnings from hc_earnings
//   5. Open loads from loads table (for bidding board)
//   6. Claim status (for CTA: "complete your profile" prompt)
// ═══════════════════════════════════════════════════════════════

export default async function OperatorDashboardPage() {
  const supabase = await createClient();

  // ── Auth guard — hard redirect, never expose to unauthenticated ──
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/operator");

  const userId = user.id;

  // ── Operator profile (from hc_global_operators linked by user_id) ──
  const { data: operatorProfile } = await supabase
    .from("hc_global_operators")
    .select(`
      id,
      business_name,
      claim_status,
      primary_trust_source,
      trust_score,
      verification_tier,
      state,
      city,
      country_code,
      phone,
      email,
      website,
      services,
      certification_flags,
      rating_avg,
      review_count,
      profile_completeness_pct,
      is_active,
      created_at
    `)
    .eq("user_id", userId)
    .maybeSingle();

  // If no operator profile linked yet, they need to claim a listing first
  const hasLinkedProfile = !!operatorProfile;

  // ── Dispatch Assignments (Sprint 17/18) ──
  const { data: assignments } = await supabase
    .from("dispatch_assignments")
    .select(`
      id,
      dispatch_request_id,
      load_id,
      origin,
      destination,
      load_type,
      date_needed,
      agreed_rate_per_day,
      positions,
      status,
      accepted_at,
      started_at,
      completed_at
    `)
    .eq("operator_user_id", userId)
    .in("status", ["active", "in_transit"])
    .order("accepted_at", { ascending: false })
    .limit(10);

  // ── Recent earnings (last 30 days) ──
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentEarnings } = await supabase
    .from("hc_earnings")
    .select(`
      id,
      amount,
      status,
      job_id,
      earned_at,
      payout_at,
      description
    `)
    .eq("operator_id", operatorProfile?.id ?? userId)
    .gte("earned_at", thirtyDaysAgo.toISOString())
    .order("earned_at", { ascending: false })
    .limit(20);

  // ── Total earnings summary ──
  const totalEarnings = recentEarnings?.reduce((sum, e) => sum + (e.amount || 0), 0) ?? 0;
  const pendingPayout = recentEarnings
    ?.filter(e => e.status === "pending")
    .reduce((sum, e) => sum + (e.amount || 0), 0) ?? 0;

  // ── Open loads for bidding board ──
  const { data: openLoads } = await supabase
    .from("loads")
    .select("id, origin_city, origin_state, destination_city, destination_state, equipment_type, status, created_at")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false })
    .limit(20);

  // ── Profile completeness CTA ──
  const profileCompleteness = operatorProfile?.profile_completeness_pct ?? 0;
  const claimStatus = operatorProfile?.claim_status ?? "unclaimed";

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OperatorDashboardClient
          userId={userId}
          operatorId={operatorProfile?.id ?? null}
          operatorProfile={operatorProfile ?? null}
          hasLinkedProfile={hasLinkedProfile}
          claimStatus={claimStatus}
          profileCompleteness={profileCompleteness}
          assignments={assignments ?? []}
          recentEarnings={recentEarnings ?? []}
          totalEarnings30d={totalEarnings}
          pendingPayout={pendingPayout}
          availableLoads={openLoads ?? []}
        />
      </div>
    </div>
  );
}
