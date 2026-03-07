// ═══════════════════════════════════════════════════════════════════════════════
// PROFILE COMPLETION TRIGGERS
// Side-effect orchestrator — fetches data, calls engine, persists, notifies.
//
// Call these from API routes or claim flow hooks.
// ═══════════════════════════════════════════════════════════════════════════════

import { getSupabaseAdmin } from "@/lib/enterprise/supabase/admin";
import {
  computeProfileCompletion,
  computeVisibilityScore,
  checkBadgeEligibility,
  MILESTONE_TOASTS,
  MILESTONE_BOOSTS,
  type ProfileFieldSnapshot,
  type ProfileCompletionResult,
  type ResponseTimeBand,
} from "./profile-completion-engine";
import { captureEvent } from "@/lib/analytics/event-pipeline";
import { sendPushToUser } from "@/lib/push-send";

// ═══════════════════════════════════════════════════════════════════════════════
// SNAPSHOT BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

export async function buildSnapshot(userId: string): Promise<{
  snapshot: ProfileFieldSnapshot;
  previousScore: number;
  claimedAt: Date | undefined;
  lastActiveAt: Date | null;
  verifiedBadge: boolean;
}> {
  const supabase = getSupabaseAdmin();

  const [profileRes, driverRes, verRes, progressRes, offersRes, jobsRes, reviewsRes, claimRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, phone, email, home_city, home_state, avatar_url")
      .eq("id", userId)
      .maybeSingle(),
    supabase
      .from("driver_profiles")
      .select("service_radius_miles, verified_badge, last_active_at, cb_channel, has_high_pole, has_dashcam, insurance_min_limit_usd")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_verification_tiers")
      .select("tier")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("user_profile_progress")
      .select("completion_score")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("offers")
      .select("responded_at, sent_at")
      .eq("operator_id", userId)
      .not("responded_at", "is", null)
      .order("sent_at", { ascending: false })
      .limit(50),
    supabase
      .from("jobs")
      .select("job_id")
      .contains("assigned_escort_ids", [userId])
      .eq("status", "completed"),
    supabase
      .from("operator_reviews")
      .select("rating")
      .eq("operator_id", userId),
    supabase
      .from("place_claims")
      .select("created_at")
      .eq("user_id", userId)
      .eq("verification_status", "verified")
      .order("created_at", { ascending: true })
      .limit(1),
  ]);

  const profile = profileRes.data as any;
  const driver = driverRes.data as any;
  const ver = verRes.data as any;
  const progress = progressRes.data as any;
  const offers = (offersRes.data ?? []) as any[];
  const jobs = (jobsRes.data ?? []) as any[];
  const reviews = (reviewsRes.data ?? []) as any[];
  const claim = (claimRes.data as any[])?.[0];

  // Compute response time band from offers
  const responseTimes = offers
    .filter((o: any) => o.responded_at && o.sent_at)
    .map((o: any) => (new Date(o.responded_at).getTime() - new Date(o.sent_at).getTime()) / (1000 * 60));

  let response_time_band: ResponseTimeBand = 'none';
  if (responseTimes.length > 0) {
    responseTimes.sort((a, b) => a - b);
    const median = responseTimes[Math.floor(responseTimes.length / 2)];
    if (median <= 10) response_time_band = 'fast';
    else if (median <= 30) response_time_band = 'normal';
    else response_time_band = 'slow';
  }

  const snapshot: ProfileFieldSnapshot = {
    display_name: profile?.display_name ?? null,
    phone: profile?.phone ?? null,
    email: profile?.email ?? null,
    home_base_city: profile?.home_city ?? null,
    home_base_state: profile?.home_state ?? null,

    coverage_states: null,        // populated from driver equipment_tags if available
    preferred_corridors: null,    // populated from corridor assignments if available
    radius_miles: driver?.service_radius_miles ?? null,

    vehicle_type: null,           // populated from driver soft_flags if available
    certifications: null,
    pilot_car_level: null,

    availability_status: null,    // populated from presence if available
    hours: null,

    photo_url: profile?.avatar_url ?? null,
    insurance_proof: !!(driver?.insurance_min_limit_usd && driver.insurance_min_limit_usd > 0),
    id_verification: (ver?.tier ?? 0) >= 1,

    response_time_band,
    completed_jobs: jobs.length,
    broker_feedback_count: reviews.length,
  };

  // Try to get extended fields from driver equipment tags or soft flags
  const [equipRes, corridorRes, presenceRes] = await Promise.all([
    supabase
      .from("driver_profiles")
      .select("equipment_tags, soft_flags")
      .eq("user_id", userId)
      .maybeSingle(),
    supabase
      .from("corridor_assignments")
      .select("corridor_id")
      .eq("user_id", userId),
    supabase
      .from("escort_presence")
      .select("status, updated_at")
      .eq("user_id", userId)
      .maybeSingle(),
  ]);

  const equip = equipRes.data as any;
  const corridors = (corridorRes.data ?? []) as any[];
  const presence = presenceRes.data as any;

  if (equip?.equipment_tags) {
    const tags = Array.isArray(equip.equipment_tags) ? equip.equipment_tags : [];
    snapshot.vehicle_type = tags.find((t: string) => ['pilot_car', 'bucket_truck', 'pole_car', 'escort_vehicle'].includes(t)) ?? null;
    snapshot.pilot_car_level = tags.find((t: string) => ['lead', 'chase', 'front', 'rear'].includes(t)) ?? null;
    const certTags = tags.filter((t: string) => ['twic', 'cdl', 'hazmat', 'oversize_certified'].includes(t));
    snapshot.certifications = certTags.length > 0 ? certTags : null;
  }

  if (equip?.soft_flags) {
    const flags = typeof equip.soft_flags === 'object' ? equip.soft_flags : {};
    if (flags.coverage_states && Array.isArray(flags.coverage_states)) {
      snapshot.coverage_states = flags.coverage_states.length > 0 ? flags.coverage_states : null;
    }
    if (flags.hours) {
      snapshot.hours = flags.hours;
    }
    if (flags.vehicle_type && !snapshot.vehicle_type) {
      snapshot.vehicle_type = flags.vehicle_type;
    }
  }

  if (corridors.length > 0) {
    snapshot.preferred_corridors = corridors.map((c: any) => c.corridor_id);
  }

  if (presence?.status) {
    snapshot.availability_status = presence.status;
  }

  const previousScore = (progress?.completion_score ?? 0) * 100; // DB stores 0-1, engine uses 0-100
  const verifiedBadge = driver?.verified_badge ?? false;
  const lastActiveAt = driver?.last_active_at ? new Date(driver.last_active_at) : null;
  const claimedAt = claim?.created_at ? new Date(claim.created_at) : undefined;

  return { snapshot, previousScore, claimedAt, lastActiveAt, verifiedBadge };
}

// ═══════════════════════════════════════════════════════════════════════════════
// PERSIST & NOTIFY
// ═══════════════════════════════════════════════════════════════════════════════

async function persistAndNotify(
  userId: string,
  result: ProfileCompletionResult,
  trigger: string,
  claimedAt: Date | undefined,
): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Upsert profile progress (0-1 scale)
  await supabase.from("user_profile_progress").upsert({
    user_id: userId,
    completion_score: result.score / 100,
    current_step: result.next_step?.field ?? 'done',
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  // Update profile strength + visibility tier
  await supabase.from("profiles").update({
    profile_strength: result.score,
    visibility_tier: result.tier,
  }).eq("id", userId);

  // Handle newly crossed milestones
  for (const milestone of result.newly_crossed_milestones) {
    const toast = MILESTONE_TOASTS[milestone];
    if (toast) {
      // Insert notification
      await supabase.from("notification_events").insert({
        user_id: userId,
        type: 'profile_milestone',
        title: `Profile milestone: ${milestone}%`,
        body: toast,
        action_url: '/app/profile',
        meta: { milestone, trigger },
      });

      // Push notification for milestones >= 40
      if (milestone >= 40) {
        try {
          await sendPushToUser(userId, {
            title: `Profile ${milestone}% complete`,
            body: toast,
            url: '/app/profile',
          });
        } catch {
          // Push is best-effort
        }
      }
    }

    // Grant visibility boost if applicable
    const boost = MILESTONE_BOOSTS[milestone];
    if (boost) {
      const expiresAt = new Date(Date.now() + boost.duration_hours * 60 * 60 * 1000);
      await supabase.from("visibility_boosts").upsert({
        user_id: userId,
        milestone,
        boost_type: boost.type,
        multiplier: boost.multiplier,
        granted_at: new Date().toISOString(),
        expires_at: expiresAt.toISOString(),
        active: true,
      }, { onConflict: "user_id,milestone" });
    }
  }

  // Check and upsert badges
  const badges = checkBadgeEligibility(
    result.group_scores as any, // not needed for badge check — use snapshot directly
    result.score,
    claimedAt,
  );

  // Re-check with actual snapshot is done by callers; here we just handle what we get
  for (const badge of badges) {
    await supabase.from("user_badges").upsert({
      user_id: userId,
      badge_type: badge,
      active: true,
      earned_at: new Date().toISOString(),
    }, { onConflict: "user_id,badge_type" });
  }

  // Fire analytics event
  captureEvent({
    category: 'profile',
    action: 'completion_updated',
    score: result.score,
    tier: result.tier,
    trigger,
    milestones_crossed: result.newly_crossed_milestones,
  } as any);
}

// ═══════════════════════════════════════════════════════════════════════════════
// TRIGGER HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

export async function onProfileClaimed(userId: string): Promise<ProfileCompletionResult> {
  const { snapshot, previousScore, claimedAt, lastActiveAt, verifiedBadge } = await buildSnapshot(userId);
  const result = computeProfileCompletion(snapshot, previousScore);

  // For badge check, pass snapshot directly
  const badges = checkBadgeEligibility(snapshot, result.score, claimedAt);

  await persistAndNotify(userId, result, 'profile_claimed', claimedAt);

  // Persist badges from snapshot-aware check
  const supabase = getSupabaseAdmin();
  for (const badge of badges) {
    await supabase.from("user_badges").upsert({
      user_id: userId,
      badge_type: badge,
      active: true,
      earned_at: new Date().toISOString(),
    }, { onConflict: "user_id,badge_type" });
  }

  return result;
}

export async function onProfileFieldUpdated(userId: string, fieldName: string): Promise<ProfileCompletionResult> {
  const { snapshot, previousScore, claimedAt } = await buildSnapshot(userId);
  const result = computeProfileCompletion(snapshot, previousScore);

  await persistAndNotify(userId, result, `field_updated:${fieldName}`, claimedAt);

  // Badge check with actual snapshot
  const badges = checkBadgeEligibility(snapshot, result.score, claimedAt);
  const supabase = getSupabaseAdmin();
  for (const badge of badges) {
    await supabase.from("user_badges").upsert({
      user_id: userId,
      badge_type: badge,
      active: true,
      earned_at: new Date().toISOString(),
    }, { onConflict: "user_id,badge_type" });
  }

  return result;
}

export async function onAvailabilityToggled(userId: string, newStatus: string): Promise<{
  completion: ProfileCompletionResult;
  visibility_score: number;
}> {
  const { snapshot, previousScore, claimedAt, lastActiveAt, verifiedBadge } = await buildSnapshot(userId);

  // Override the status with the new one
  snapshot.availability_status = newStatus;

  const result = computeProfileCompletion(snapshot, previousScore);
  await persistAndNotify(userId, result, 'availability_toggled', claimedAt);

  // Get active boost
  const supabase = getSupabaseAdmin();
  const { data: boostData } = await supabase
    .from("visibility_boosts")
    .select("multiplier, expires_at")
    .eq("user_id", userId)
    .eq("active", true)
    .gt("expires_at", new Date().toISOString())
    .order("multiplier", { ascending: false })
    .limit(1)
    .maybeSingle();

  const visibility_score = computeVisibilityScore({
    profile_completion_score: result.score,
    availability_status: newStatus,
    last_active_at: lastActiveAt,
    response_time_band: snapshot.response_time_band,
    verified_badge: verifiedBadge,
    active_boost: boostData ? {
      multiplier: Number(boostData.multiplier),
      expires_at: new Date(boostData.expires_at),
    } : undefined,
  });

  // Log presence event
  captureEvent({
    category: 'profile',
    action: 'availability_toggled',
    new_status: newStatus,
    visibility_score,
  } as any);

  return { completion: result, visibility_score };
}

export async function onBrokerProfileView(operatorId: string, brokerId: string): Promise<void> {
  const supabase = getSupabaseAdmin();

  // Quick check: only notify if score < 80
  const { data: progress } = await supabase
    .from("user_profile_progress")
    .select("completion_score")
    .eq("user_id", operatorId)
    .maybeSingle();

  const score = ((progress as any)?.completion_score ?? 0) * 100;
  if (score >= 80) return;

  // Notify operator that a broker viewed their profile
  await supabase.from("notification_events").insert({
    user_id: operatorId,
    type: 'profile_milestone',
    title: 'A broker viewed your profile',
    body: `Complete your profile to ${score < 60 ? 'unlock leaderboard ranking' : 'earn Featured status'}. You're at ${Math.round(score)}%.`,
    action_url: '/app/profile',
    meta: { broker_id: brokerId, current_score: score },
  });
}

// ═══════════════════════════════════════════════════════════════════════════════
// FULL COMPLETION DATA (for API response)
// ═══════════════════════════════════════════════════════════════════════════════

export async function getFullCompletionData(userId: string) {
  const { snapshot, previousScore, claimedAt, lastActiveAt, verifiedBadge } = await buildSnapshot(userId);
  const result = computeProfileCompletion(snapshot, 0); // no milestone detection for reads

  const supabase = getSupabaseAdmin();

  // Get active boosts
  const { data: boosts } = await supabase
    .from("visibility_boosts")
    .select("milestone, boost_type, multiplier, expires_at")
    .eq("user_id", userId)
    .eq("active", true)
    .gt("expires_at", new Date().toISOString());

  // Get badges
  const { data: badges } = await supabase
    .from("user_badges")
    .select("badge_type, earned_at")
    .eq("user_id", userId)
    .eq("active", true);

  // Best active boost for visibility calc
  const bestBoost = (boosts ?? []).sort((a: any, b: any) => b.multiplier - a.multiplier)[0];

  const visibility_score = computeVisibilityScore({
    profile_completion_score: result.score,
    availability_status: snapshot.availability_status,
    last_active_at: lastActiveAt,
    response_time_band: snapshot.response_time_band,
    verified_badge: verifiedBadge,
    active_boost: bestBoost ? {
      multiplier: Number(bestBoost.multiplier),
      expires_at: new Date(bestBoost.expires_at),
    } : undefined,
  });

  return {
    score: result.score,
    tier: result.tier,
    group_scores: result.group_scores,
    gate_active: result.gate_active,
    gate_cap: result.gate_cap,
    next_step: result.next_step,
    milestones_reached: result.milestones_reached,
    visibility_score,
    active_boosts: boosts ?? [],
    badges: (badges ?? []).map((b: any) => b.badge_type),
  };
}
