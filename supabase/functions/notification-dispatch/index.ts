/**
 * notification-dispatch — Haul Command Push Pipeline Drain Worker
 *
 * Architecture: Queue-drain pattern
 *  - Reads pending rows from hc_notif_jobs (FIFO, up to 50 per invocation)
 *  - For each job, resolves device tokens from hc_device_tokens
 *  - Applies preference gates (push_enabled, max_push_per_day, quiet_hours)
 *  - Applies dedup check via hc_notif_is_duplicate()
 *  - Sends via Firebase HTTP v1 (see _shared/fcm.ts)
 *  - Writes one hc_notif_events row per token per job
 *  - Marks job done (or failed with error)
 *  - Marks stale tokens inactive in hc_device_tokens
 *
 * Invocation:
 *  - Supabase pg_cron: every 30 seconds
 *  - Also invokeable manually: POST /functions/v1/notification-dispatch
 *
 * Required env vars:
 *   SUPABASE_URL              — auto-injected
 *   SUPABASE_SERVICE_ROLE_KEY — auto-injected
 *   FIREBASE_PROJECT_ID       — set in Supabase secrets
 *   FIREBASE_SERVICE_ACCOUNT  — set in Supabase secrets (full JSON stringified)
 */

import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";
import { sendFcmPush, type FcmSendResult } from "../_shared/fcm.ts";

const BATCH_SIZE = 50;

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = getServiceClient();
  const startedAt = Date.now();
  let processedJobs = 0;
  let totalSent = 0;
  let totalFailed = 0;

  try {
    // ── 1. Claim a batch of pending jobs ─────────────────────────────────────
    // Atomically mark as 'processing' to prevent double-processing
    const { data: jobs, error: jobsErr } = await supabase
      .from("hc_notif_jobs")
      .select("*")
      .eq("status", "pending")
      .lte("scheduled_at", new Date().toISOString())
      .order("scheduled_at", { ascending: true })
      .limit(BATCH_SIZE);

    if (jobsErr) {
      console.error("[notif-dispatch] Job fetch error:", jobsErr.message);
      return errorResponse(jobsErr.message);
    }

    if (!jobs || jobs.length === 0) {
      return okResponse({ processed: 0, sent: 0, failed: 0, ms: Date.now() - startedAt });
    }

    // Mark batch as processing
    const jobIds = jobs.map((j: any) => j.id);
    await supabase
      .from("hc_notif_jobs")
      .update({ status: "processing", attempts: supabase.rpc("coalesce_increment_attempts") })
      .in("id", jobIds);

    // ── 2. Process each job ───────────────────────────────────────────────────
    for (const job of jobs) {
      try {
        const payload = job.payload as Record<string, any>;
        const {
          eventType,
          userId,
          roleKey,
          countryCode,
          corridorSlug,
          title,
          body,
          deepLink,
          dedupKey,
          dedupWindowHrs = 24,
          mode = "single",
        } = payload;

        // ── 2a. Resolve target tokens ─────────────────────────────────────────
        let tokenQuery = supabase
          .from("hc_device_tokens")
          .select("id, user_id, token, platform")
          .eq("is_active", true);

        if (mode === "single" && userId) {
          tokenQuery = tokenQuery.eq("user_id", userId);
        } else if (mode === "broadcast") {
          if (roleKey)       tokenQuery = tokenQuery.eq("role_key", roleKey);
          if (countryCode)   tokenQuery = tokenQuery.eq("country_code", countryCode);
          // Corridor broadcasts are limited to 200 tokens max to prevent blast
          tokenQuery = tokenQuery.limit(200);
        }

        const { data: tokenRows } = await tokenQuery;

        if (!tokenRows || tokenRows.length === 0) {
          await markJobDone(supabase, job.id);
          continue;
        }

        // ── 2b. Filter by preferences + dedup + throttle ──────────────────────
        const eligibleTokenRows: typeof tokenRows = [];

        for (const tr of tokenRows) {
          const uid = tr.user_id;

          // Preference gate
          const { data: pref } = await supabase
            .from("hc_notif_preferences")
            .select("push_enabled, max_push_per_day, quiet_hours_start, quiet_hours_end")
            .eq("user_id", uid)
            .maybeSingle();

          if (pref?.push_enabled === false) continue;

          // Throttle gate
          if (pref?.max_push_per_day) {
            const { data: countResult } = await supabase.rpc("hc_notif_daily_count", {
              p_user_id: uid,
              p_channel: "push",
            });
            if ((countResult ?? 0) >= pref.max_push_per_day) continue;
          }

          // Quiet hours gate (UTC)
          if (pref?.quiet_hours_start && pref?.quiet_hours_end) {
            const nowUtc = new Date();
            const nowTime = `${String(nowUtc.getUTCHours()).padStart(2, "0")}:${String(nowUtc.getUTCMinutes()).padStart(2, "0")}`;
            const qs = pref.quiet_hours_start as string;
            const qe = pref.quiet_hours_end as string;
            // Quiet window may wrap midnight
            const inQuiet = qs < qe
              ? nowTime >= qs && nowTime < qe
              : nowTime >= qs || nowTime < qe;
            if (inQuiet) continue;
          }

          // Dedup gate
          if (dedupKey) {
            const { data: isDup } = await supabase.rpc("hc_notif_is_duplicate", {
              p_user_id: uid,
              p_dedup_key: dedupKey,
              p_window_hrs: dedupWindowHrs,
            });
            if (isDup) continue;
          }

          eligibleTokenRows.push(tr);
        }

        if (eligibleTokenRows.length === 0) {
          await markJobDone(supabase, job.id);
          continue;
        }

        // ── 2c. Send via FCM ──────────────────────────────────────────────────
        const tokens = eligibleTokenRows.map((r) => r.token);
        const fcmResults: FcmSendResult[] = await sendFcmPush({
          tokens,
          title: title || "Haul Command",
          body: body || "You have a new update.",
          deepLink: deepLink,
          data: { eventType: eventType || "system", ...(corridorSlug ? { corridorSlug } : {}) },
        });

        // ── 2d. Write audit events + mark stale tokens ────────────────────────
        const auditRows = [];
        const staleTokenIds: string[] = [];

        for (let i = 0; i < fcmResults.length; i++) {
          const result = fcmResults[i];
          const tokenRow = eligibleTokenRows[i];

          auditRows.push({
            user_id: tokenRow.user_id,
            device_token_id: tokenRow.id,
            event_type: eventType || "route_alert",
            channel: "push" as const,
            status: result.success ? "sent" : "failed",
            title: title,
            body: body,
            data_payload: payload,
            deep_link: deepLink,
            role_key: roleKey,
            country_code: countryCode,
            corridor_slug: corridorSlug,
            dedup_key: dedupKey,
            dedup_window_hrs: dedupWindowHrs,
            sent_at: result.success ? new Date().toISOString() : null,
            failed_reason: result.error || null,
            firebase_message_id: result.messageId || null,
          });

          if (result.error === "invalid_token") {
            staleTokenIds.push(tokenRow.id);
          }

          if (result.success) totalSent++;
          else totalFailed++;
        }

        if (auditRows.length > 0) {
          await supabase.from("hc_notif_events").insert(auditRows);
        }

        if (staleTokenIds.length > 0) {
          await supabase
            .from("hc_device_tokens")
            .update({ is_active: false })
            .in("id", staleTokenIds);
          console.log(`[notif-dispatch] Marked ${staleTokenIds.length} stale token(s) inactive`);
        }

        await markJobDone(supabase, job.id);
        processedJobs++;
      } catch (jobErr: any) {
        console.error(`[notif-dispatch] Error on job ${job.id}:`, jobErr.message);
        await supabase
          .from("hc_notif_jobs")
          .update({
            status: "failed",
            last_error: jobErr.message,
            processed_at: new Date().toISOString(),
          })
          .eq("id", job.id);
      }
    }

    const ms = Date.now() - startedAt;
    console.log(`[notif-dispatch] Done: jobs=${processedJobs} sent=${totalSent} failed=${totalFailed} ms=${ms}`);

    return okResponse({ processed: processedJobs, sent: totalSent, failed: totalFailed, ms });
  } catch (err: any) {
    console.error("[notif-dispatch] Fatal error:", err.message);
    return errorResponse(err.message);
  }
});

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function markJobDone(supabase: any, jobId: number) {
  await supabase
    .from("hc_notif_jobs")
    .update({ status: "done", processed_at: new Date().toISOString() })
    .eq("id", jobId);
}

function okResponse(data: object): Response {
  return new Response(JSON.stringify({ ok: true, ...data }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}

function errorResponse(message: string, status = 500): Response {
  return new Response(JSON.stringify({ ok: false, error: message }), {
    headers: { ...corsHeaders, "content-type": "application/json" },
    status,
  });
}
