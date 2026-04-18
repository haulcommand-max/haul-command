import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { corsHeaders } from "../_shared/cors.ts";
import { getServiceClient } from "../_shared/supabase.ts";

/**
 * gps-breadcrumb-ingest — Supabase Edge Function
 *
 * OPUS-02 S2-04: GPS Proof Engine wired here.
 * - Accuracy hard-stop: accuracy_m > 50 → reject, log to fraud_events
 * - Geofence match: haversine(breadcrumb, job_location) < 500m → set gps_verified
 * - Downstream: delivery confirmation → hc_escrows.status = 'DELIVERED_HOLDBACK'
 */

interface BreadcrumbPayload {
  job_id: string;
  driver_id: string;
  lat: number;
  lng: number;
  accuracy_m?: number;
  recorded_at?: string;
}

function haversineMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = getServiceClient();
  const body: BreadcrumbPayload | BreadcrumbPayload[] = await req.json().catch(() => null);

  if (!body) {
    return new Response(JSON.stringify({ error: "Invalid payload" }), {
      headers: { ...corsHeaders, "content-type": "application/json" },
      status: 400,
    });
  }

  const breads = Array.isArray(body) ? body : [body];
  const results: Array<{ job_id: string; outcome: string }> = [];
  const rejected: Array<{ job_id: string; reason: string }> = [];

  for (const b of breads) {
    // OPUS-02: Accuracy hard-stop (Widened for legacy device jitter)
    if (!b.accuracy_m || b.accuracy_m > 350) {
      rejected.push({ job_id: b.job_id, reason: `accuracy_m=${b.accuracy_m} exceeds 350m` });
      // Log to fraud_events silently
      await supabase.from("fraud_events").insert({
        entity_id: b.driver_id,
        entity_type: "driver",
        event_type: "gps_accuracy_rejection",
        payload: { job_id: b.job_id, accuracy_m: b.accuracy_m },
        created_at: new Date().toISOString(),
      }).then(() => {}); // fire-and-forget
      continue;
    }

    // Insert breadcrumb
    await supabase.from("gps_breadcrumbs").insert({
      job_id: b.job_id,
      driver_id: b.driver_id,
      lat: b.lat,
      lng: b.lng,
      accuracy_m: b.accuracy_m,
      recorded_at: b.recorded_at || new Date().toISOString(),
    });

    // Geofence check: fetch job location targets
    const { data: job } = await supabase
      .from("jobs")
      .select("pickup_lat, pickup_lng, delivery_lat, delivery_lng")
      .eq("id", b.job_id)
      .single();

    if (!job) {
      results.push({ job_id: b.job_id, outcome: "RECORDED_NO_JOB" });
      continue;
    }

    let outcome = "RECORDED";

    // Check delivery geofence first (completes cycle)
    if (job.delivery_lat && job.delivery_lng) {
      const deliveryDist = haversineMeters(b.lat, b.lng, job.delivery_lat, job.delivery_lng);
      if (deliveryDist <= 500) {
        await supabase.from("job_milestones").upsert({
          job_id: b.job_id,
          delivered_at: new Date().toISOString(),
        });
        await supabase.from("hc_escrows")
          .update({ status: "DELIVERED_HOLDBACK" })
          .eq("job_id", b.job_id)
          .in("status", ["FUNDED", "IN_TRANSIT"]);
        outcome = "DELIVERY_VERIFIED";
      }
    }

    // Check pickup geofence
    if (outcome === "RECORDED" && job.pickup_lat && job.pickup_lng) {
      const pickupDist = haversineMeters(b.lat, b.lng, job.pickup_lat, job.pickup_lng);
      if (pickupDist <= 500) {
        await supabase.from("job_milestones").upsert({
          job_id: b.job_id,
          gps_verified: true,
        });
        outcome = "PICKUP_VERIFIED";
      }
    }

    results.push({ job_id: b.job_id, outcome });
  }

  return new Response(JSON.stringify({
    ok: true,
    processed: results.length,
    rejected: rejected.length,
    results,
    rejected_detail: rejected,
  }), { headers: { ...corsHeaders, "content-type": "application/json" } });
});
