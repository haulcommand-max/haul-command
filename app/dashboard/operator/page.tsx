export const dynamic = "force-dynamic";
import { createClient } from "@/lib/supabase/server";
import { OperatorDashboardClient } from "./OperatorDashboardClient";
import { redirect } from "next/navigation";

export default async function OperatorDashboardPage() {
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login?next=/dashboard/operator");

  const userId = user.id;

  // ── Operator profile ──────────────────────────────────────────────────────
  const { data: operatorProfile } = await supabase
    .from("hc_global_operators")
    .select(`
      id, business_name, claim_status, primary_trust_source, trust_score,
      verification_tier, state, city, country_code, phone, email, website,
      services, certification_flags, rating_avg, review_count,
      profile_completeness_pct, is_active, created_at
    `)
    .eq("user_id", userId)
    .maybeSingle();

  const hasLinkedProfile = !!operatorProfile;

  // ── Trust profile — period stats (Report Card) ────────────────────────────
  // Columns added by migration 029 (20260405_029_leaderboard_periods...)
  const { data: trustProfile } = await supabase
    .from("hc_trust_profiles")
    .select(`
      trust_score, identity_verified, insurance_verified, license_verified,
      background_checked, claimed, badges, review_count, review_avg,
      avg_response_min, verified_jobs_count, verified_km_total,
      active_since, last_active_at,
      jobs_30d, jobs_90d, jobs_180d, jobs_365d,
      km_30d, km_90d, km_180d, km_365d,
      avg_rating_30d, avg_rating_90d, avg_rating_180d, avg_rating_365d,
      reviews_30d, reviews_90d, reviews_180d, reviews_365d,
      avg_response_min_30d, avg_response_min_90d,
      avg_response_min_180d, avg_response_min_365d,
      period_stats_refreshed_at, score_computed_at
    `)
    .eq("user_id", userId)
    .maybeSingle();

  // ── Dispatch Assignments ──────────────────────────────────────────────────
  const { data: assignments } = await supabase
    .from("dispatch_assignments")
    .select(`
      id, dispatch_request_id, load_id, origin, destination,
      load_type, date_needed, agreed_rate_per_day, positions,
      status, accepted_at, started_at, completed_at
    `)
    .eq("operator_user_id", userId)
    .in("status", ["active", "in_transit"])
    .order("accepted_at", { ascending: false })
    .limit(10);

  // ── Recent earnings (30d) ─────────────────────────────────────────────────
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const { data: recentEarnings } = await supabase
    .from("hc_earnings")
    .select("id, amount, status, job_id, earned_at, payout_at, description")
    .eq("operator_id", operatorProfile?.id ?? userId)
    .gte("earned_at", thirtyDaysAgo.toISOString())
    .order("earned_at", { ascending: false })
    .limit(20);

  const totalEarnings = recentEarnings?.reduce((s, e) => s + (e.amount || 0), 0) ?? 0;
  const pendingPayout = recentEarnings
    ?.filter(e => e.status === "pending")
    .reduce((s, e) => s + (e.amount || 0), 0) ?? 0;

  // ── Open loads for bid board ──────────────────────────────────────────────
  const { data: openLoads } = await supabase
    .from("loads")
    .select("id, origin_city, origin_state, destination_city, destination_state, equipment_type, status, created_at")
    .eq("status", "OPEN")
    .order("created_at", { ascending: false })
    .limit(20);

  return (
    <div className="min-h-screen bg-hc-bg text-hc-text pt-24 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <OperatorDashboardClient
          userId={userId}
          operatorId={operatorProfile?.id ?? null}
          operatorProfile={operatorProfile ?? null}
          hasLinkedProfile={hasLinkedProfile}
          claimStatus={operatorProfile?.claim_status ?? "unclaimed"}
          profileCompleteness={operatorProfile?.profile_completeness_pct ?? 0}
          assignments={assignments ?? []}
          recentEarnings={recentEarnings ?? []}
          totalEarnings30d={totalEarnings}
          pendingPayout={pendingPayout}
          availableLoads={openLoads ?? []}
          trustProfile={trustProfile ?? null}
        />
      </div>
    </div>
  );
}
